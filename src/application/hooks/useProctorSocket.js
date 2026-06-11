/**
 * useProctorSocket — application hook: proctor socket connection and student list sync.
 */

import { useState, useEffect } from 'react';
import { socket } from '../../infrastructure/socketClient';

export function useProctorSocket(username) {
  const [students, setStudents] = useState([]);
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    socket.connect();
    socket.emit('proctor_join', { username });

    const countOnline = (list) =>
      list.filter(s => s.status === 'active' || s.status === 'warned').length;

    socket.on('init', (initial) => {
      setStudents(initial);
      setConnectedCount(countOnline(initial));
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
