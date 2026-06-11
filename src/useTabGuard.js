/**
 * useTabGuard — single responsibility: detect when student leaves the exam tab
 */

import { useEffect } from 'react';
import { socket } from './infrastructure/socketClient';

export function useTabGuard({ studentId, active }) {
  useEffect(() => {
    if (!active) return;

    const onHide = () => {
      if (document.hidden) {
        socket.emit('ai_violation', {
          studentId,
          reason: '⚠️ Студент покинул окно экзамена',
          severity: 'warning',
        });
      }
    };

    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [studentId, active]);
}
