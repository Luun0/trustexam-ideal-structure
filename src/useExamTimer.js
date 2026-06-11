/**
 * useExamTimer — single responsibility: countdown timer for the exam
 */

import { useState, useEffect, useRef } from 'react';

const EXAM_DURATION_SEC = 3600; // 60 minutes

export function useExamTimer({ active, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SEC);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active, onExpire]);

  return secondsLeft;
}
