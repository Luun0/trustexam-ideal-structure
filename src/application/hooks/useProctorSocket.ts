import { useState, useEffect } from 'react';
import type { Student } from '@shared/student';
import { socket } from '../../infrastructure/socketClient';

export function useProctorSocket(username: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    socket.connect();
    socket.emit('proctor_join', { username });

    const countOnline = (list: Student[]) =>
      list.filter(s => s.status === 'active' || s.status === 'warned').length;

    socket.on('init', (initial) => {
      const list = Array.isArray(initial) ? initial : [initial];
      setStudents(list);
      setConnectedCount(countOnline(list));
    });

    socket.on('students_update', (updated) => {
      setStudents(updated);
      setConnectedCount(countOnline(updated));
    });

    return () => {
      socket.off('init');
      socket.off('students_update');
      socket.disconnect();
    };
  }, [username]);

  return { students, connectedCount };
}
