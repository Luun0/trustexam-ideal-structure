import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '../../../shared/types/socket';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export class BanGateway {
  constructor(private _io: AppServer) {}

  banStudent(studentId: string): void {
    for (const [, sock] of this._io.sockets.sockets) {
      if (sock.data.studentId === studentId) {
        sock.emit('banned');
        break;
      }
    }
  }
}
