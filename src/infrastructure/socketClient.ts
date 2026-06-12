import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/socket';
import { SERVER_URL } from '../domain/serverConfig';

export const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: false,
  autoConnect: false,
}) as Socket<ServerToClientEvents, ClientToServerEvents>;
