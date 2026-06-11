import { io } from 'socket.io-client';

// Используем переменную окружения прямо здесь
export const socket = io(import.meta.env.VITE_API_URL, {
  transports: ['websocket'],
  withCredentials: true, // ЭТО КЛЮЧЕВОЕ для CORS
  autoConnect: false,
});