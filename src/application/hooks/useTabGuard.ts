import { useEffect } from 'react';
import { socket } from '../../infrastructure/socketClient';

interface UseTabGuardOptions {
  studentId: string;
  active: boolean;
}

export function useTabGuard({ studentId, active }: UseTabGuardOptions) {
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
