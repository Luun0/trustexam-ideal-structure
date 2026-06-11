/**
 * Infrastructure — Socket.IO client singleton.
 */

import { io } from 'socket.io-client';
import { SERVER_URL } from '../domain/serverConfig';

export const socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false,
});
