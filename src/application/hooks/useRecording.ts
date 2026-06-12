import { useRef, useState, useCallback, type MutableRefObject } from 'react';
import * as recordingApi from '../api/recordingApi';

const CHUNK_INTERVAL_MS = 5000;

interface UseRecordingOptions {
  studentId: string;
}

export function useRecording({ studentId }: UseRecordingOptions) {
  const [recording, setRecording] = useState(false);
  const [recordingHash, setRecordingHash] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const faceRecorderRef = useRef<MediaRecorder | null>(null);
  const screenChunksRef = useRef<Blob[]>([]);
  const faceChunksRef = useRef<Blob[]>([]);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hashRef = useRef<string | null>(null);

  const stopRecording = useCallback(async () => {
    if (!screenRecorderRef.current && !faceRecorderRef.current) return;

    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);

    await Promise.all([
      new Promise<void>((resolve) => {
        const rec = screenRecorderRef.current;
        if (!rec) return resolve();
        rec.onstop = () => resolve();
        if (rec.state !== 'inactive') rec.stop(); else resolve();
      }),
      new Promise<void>((resolve) => {
        const rec = faceRecorderRef.current;
        if (!rec) return resolve();
        rec.onstop = () => resolve();
        if (rec.state !== 'inactive') rec.stop(); else resolve();
      }),
    ]);

    const flushChunks = async (type: string, chunksRef: MutableRefObject<Blob[]>) => {
      if (chunksRef.current.length === 0) return;
      const mimeType = getSupportedMimeType();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      try {
        const arrayBuf = await blob.arrayBuffer();
        await recordingApi.sendChunk(studentId, type, arrayBuf);
      } catch (err) {
        console.error(`[REC] Chunk send error (${type}):`, err);
      }
    };

    await flushChunks('screen', screenChunksRef);
    await flushChunks('face', faceChunksRef);

    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setScreenStream(null);

    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;

    const data = await recordingApi.stopRecording(studentId).catch(() => null);

    if (data) {
      setRecordingUrl(data.screenUrl);
      setFaceUrl(data.faceUrl);
      console.log(`[REC] Stopped — screen: ${data.screenUrl}, face: ${data.faceUrl}`);
    }

    screenRecorderRef.current = null;
    faceRecorderRef.current = null;
    setRecording(false);
  }, [studentId]);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('[REC] Camera error:', err);
      throw new Error('Не удалось получить доступ к камере. Разрешите в настройках браузера.');
    }
  }, []);

  const requestScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } },
        audio: false,
      });
      screenStreamRef.current = stream;
      setScreenStream(stream);
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('[REC] Screen share stopped by user');
        stopRecording();
      });
      return stream;
    } catch (err) {
      console.error('[REC] Screen share error:', err);
      throw new Error('Не удалось получить доступ к экрану. Разрешите шейринг.');
    }
  }, [stopRecording]);

  const flushChunks = useCallback(async (type: string, chunksRef: MutableRefObject<Blob[]>) => {
    if (chunksRef.current.length === 0) return;
    const mimeType = getSupportedMimeType();
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    try {
      const arrayBuf = await blob.arrayBuffer();
      await recordingApi.sendChunk(studentId, type, arrayBuf);
    } catch (err) {
      console.error(`[REC] Chunk send error (${type}):`, err);
    }
  }, [studentId]);

  const startRecording = useCallback(async (cameraStream?: MediaStream | null) => {
    if (!cameraStream && !cameraStreamRef.current) throw new Error('Сначала включите камеру');
    const camStream = cameraStream || cameraStreamRef.current!;

    await requestScreenShare();

    const { hash } = await recordingApi.startRecording(studentId);
    hashRef.current = hash;
    setRecordingHash(hash);

    const mimeType = getSupportedMimeType();

    const screenRecorder = new MediaRecorder(screenStreamRef.current!, { mimeType, videoBitsPerSecond: 3_000_000 });
    screenRecorder.ondataavailable = (e) => { if (e.data?.size > 0) screenChunksRef.current.push(e.data); };
    screenRecorderRef.current = screenRecorder;

    const faceRecorder = new MediaRecorder(camStream, { mimeType, videoBitsPerSecond: 1_500_000 });
    faceRecorder.ondataavailable = (e) => { if (e.data?.size > 0) faceChunksRef.current.push(e.data); };
    faceRecorderRef.current = faceRecorder;

    screenRecorder.start(1000);
    faceRecorder.start(1000);

    chunkTimerRef.current = setInterval(() => {
      flushChunks('screen', screenChunksRef);
      flushChunks('face', faceChunksRef);
    }, CHUNK_INTERVAL_MS);

    setRecording(true);
    console.log(`[REC] Started — hash: ${hash}`);
  }, [studentId, requestScreenShare, flushChunks]);

  return {
    recording,
    recordingHash,
    recordingUrl,
    faceUrl,
    screenStream,
    requestCamera,
    startRecording,
    stopRecording,
    cameraStreamRef,
  };
}

function getSupportedMimeType(): string {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const t of types) { if (MediaRecorder.isTypeSupported(t)) return t; }
  return 'video/webm';
}
