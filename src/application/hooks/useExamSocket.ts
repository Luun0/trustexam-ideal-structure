import { useState, useEffect, useCallback } from 'react';
import { socket } from '../../infrastructure/socketClient';

interface UseExamSocketOptions {
  studentId: string;
  username: string;
  onBanned?: () => void;
}

export function useExamSocket({ studentId, username, onBanned }: UseExamSocketOptions) {
  const [violations, setViolations] = useState(0);
  const [score, setScore] = useState<number | string | null>(null);
  const [autoScore, setAutoScore] = useState<number | null>(null);

  const handleBanned = useCallback(() => {
    onBanned?.();
  }, [onBanned]);

  useEffect(() => {
    socket.connect();
    socket.emit('student_join', { studentId, name: username });

    socket.on('students_update', (list: import('@shared/student').Student[]) => {
      const me = list.find((s) => s.id === studentId);
      if (!me) return;
      setViolations(me.violations);
      if (me.score != null) setScore(me.score);
      if (me.autoScore != null) setAutoScore(me.autoScore);
      if (me.status === 'banned') handleBanned();
    });

    socket.on('banned', handleBanned);

    return () => {
      socket.off('students_update');
      socket.off('banned');
      socket.disconnect();
    };
  }, [studentId, username, handleBanned]);

  return { violations, score, autoScore };
}
