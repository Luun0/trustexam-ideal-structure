import { useRef, useState, useCallback } from 'react';
import { socket } from '../../infrastructure/socketClient';

const HEAD_TURN_THRESHOLD = 0.28;
const HEAD_TURN_BLOCK_MS = 500;
const HEAD_TURN_VIOLATION_MS = 2500;
const NO_FACE_VIOLATION_MS = 3000;
const DETECTION_INTERVAL = 2000;

type ProctorStatus = 'idle' | 'loading' | 'active' | 'error';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

interface UseProctoringOptions {
  studentId: string;
}

export function useProctoring({ studentId }: UseProctoringOptions) {
  const [status, setStatus] = useState<ProctorStatus>('idle');
  const [statusText, setStatusText] = useState('Камера не активна');
  const [warning, setWarning] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const faceMeshRef = useRef<InstanceType<typeof window.FaceMesh> | null>(null);
  const cocoModelRef = useRef<Awaited<ReturnType<typeof window.cocoSsd.load>> | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headTurnStartRef = useRef<number | null>(null);
  const headTurnFiredRef = useRef(false);
  const noFaceStartRef = useRef<number | null>(null);
  const noFaceFiredRef = useRef(false);
  const offscreenVideoRef = useRef<HTMLVideoElement | null>(null);

  const reportViolation = useCallback((reason: string, severity = 'warning') => {
    socket.emit('ai_violation', { studentId, reason, severity });
  }, [studentId]);

  const attachStream = useCallback((stream: MediaStream) => {
    if (!offscreenVideoRef.current) {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;';
      document.body.appendChild(v);
      offscreenVideoRef.current = v;
    }
    offscreenVideoRef.current.srcObject = stream;
    offscreenVideoRef.current.play().catch(() => {});
  }, []);

  const initAI = useCallback(async (cameraStream?: MediaStream | null) => {
    setStatus('loading');
    setStatusText('Загрузка AI моделей...');

    if (cameraStream) attachStream(cameraStream);

    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
      setStatusText('TensorFlow загружен...');

      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
      setStatusText('COCO-SSD загружен...');

      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
      setStatusText('FaceMesh загружен...');

      cocoModelRef.current = await window.cocoSsd.load();

      const faceMesh = new window.FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks?.[0]) {
          headTurnStartRef.current = null;
          headTurnFiredRef.current = false;
          setIsBlocked(true);
          setWarning('⚠️ Лицо не в кадре — вернитесь в кадр!');
          setStatusText('⚠️ Лицо не в кадре');

          if (!noFaceStartRef.current) noFaceStartRef.current = Date.now();
          const elapsed = Date.now() - noFaceStartRef.current;

          if (elapsed > NO_FACE_VIOLATION_MS && !noFaceFiredRef.current) {
            noFaceFiredRef.current = true;
            reportViolation('⚠️ Лицо не в кадре более 3 секунд', 'warning');
          }
          return;
        }

        noFaceStartRef.current = null;
        noFaceFiredRef.current = false;

        const landmarks = results.multiFaceLandmarks[0];
        const nose = landmarks[1].x;
        const leftEye = landmarks[33].x;
        const rightEye = landmarks[263].x;
        const eyeCenter = (leftEye + rightEye) / 2;
        const eyeWidth = Math.abs(rightEye - leftEye);
        const turn = (nose - eyeCenter) / eyeWidth;

        if (Math.abs(turn) > HEAD_TURN_THRESHOLD) {
          if (!headTurnStartRef.current) headTurnStartRef.current = Date.now();
          const duration = Date.now() - headTurnStartRef.current;
          const dir = turn > 0 ? 'вправо →' : '← влево';

          if (duration > HEAD_TURN_BLOCK_MS) {
            setIsBlocked(true);
            setWarning(`⚠️ Поверните голову обратно! (${dir})`);
          }

          if (duration > HEAD_TURN_VIOLATION_MS && !headTurnFiredRef.current) {
            headTurnFiredRef.current = true;
            reportViolation(`⚠️ Поворот головы ${turn > 0 ? 'вправо' : 'влево'} более 2.5 сек`, 'warning');
          }

          setStatusText(`👁 Поворот ${dir}`);
        } else {
          headTurnStartRef.current = null;
          headTurnFiredRef.current = false;
          setIsBlocked(false);
          setWarning(null);
          setStatusText('✅ Лицо в кадре');
        }
      });

      await faceMesh.initialize();
      faceMeshRef.current = faceMesh;

      setStatus('active');
      setStatusText('✅ AI прокторинг активен');
    } catch (err) {
      console.error('AI init error:', err);
      setStatus('error');
      setStatusText('❌ Ошибка загрузки AI');
    }
  }, [attachStream, reportViolation]);

  const startDetectionLoop = useCallback(() => {
    async function tick() {
      const video = offscreenVideoRef.current;
      if (!video || video.readyState < 2) {
        loopTimerRef.current = setTimeout(tick, DETECTION_INTERVAL);
        return;
      }

      if (faceMeshRef.current) {
        await faceMeshRef.current.send({ image: video }).catch(() => {});
      }

      if (cocoModelRef.current) {
        const detections = await cocoModelRef.current.detect(video).catch(() => []);
        const persons = detections.filter(d => d.class === 'person');
        if (persons.length > 1) {
          reportViolation('🚨 В кадре обнаружен второй человек!', 'critical');
        }
      }

      loopTimerRef.current = setTimeout(tick, DETECTION_INTERVAL);
    }
    tick();
  }, [reportViolation]);

  const stopDetection = useCallback(() => {
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    setStatus('idle');
    setStatusText('Экзамен завершён');
    setIsBlocked(false);
    setWarning(null);
    if (offscreenVideoRef.current) {
      offscreenVideoRef.current.srcObject = null;
      offscreenVideoRef.current.remove();
      offscreenVideoRef.current = null;
    }
  }, []);

  return {
    status,
    statusText,
    warning,
    isBlocked,
    initAI,
    startDetectionLoop,
    stopDetection,
    attachStream,
  };
}
