import { useState, useEffect, useRef } from 'react';

const EXAM_DURATION_SEC = 3600;

interface UseExamTimerOptions {
  active: boolean;
  onExpire?: () => void;
}

export function useExamTimer({ active, onExpire }: UseExamTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, onExpire]);

  return secondsLeft;
}
