import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '../../shared/types/socket';
import type { IStudentRepository } from '../infrastructure/repositories/IRepositories';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export class BroadcastNotifier {
  constructor(
    private _io: AppServer,
    private _students: IStudentRepository,
  ) {}

  emitStudentsUpdate(): void {
    this._io.emit('students_update', this._students.getAll());
  }
}
