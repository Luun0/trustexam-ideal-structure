import type { Server, Socket } from 'socket.io';
import type { StudentService } from '../application/StudentService';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from '../../shared/types/socket';

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export class SocketHandler {
  constructor(
    private _io: AppServer,
    private _students: StudentService,
  ) {}

  register(): void {
    this._io.on('connection', (socket: AppSocket) => {
      console.log(`[+] ${socket.id}`);

      socket.on('student_join', ({ studentId, name }) => {
        socket.data.studentId = studentId;
        socket.data.role = 'student';
        const student = this._students.join(studentId, name);
        socket.emit('init', student);
        console.log(`[STUDENT] ${name}`);
      });

      socket.on('proctor_join', ({ username }) => {
        socket.data.role = 'proctor';
        socket.join('proctors');
        socket.emit('init', this._students.getAll());
        console.log(`[PROCTOR] ${username}`);
      });

      socket.on('ai_violation', ({ studentId, reason, severity }) => {
        this._students.reportViolation(studentId, reason, severity);
      });

      socket.on('chat_message', (msg) => {
        if (msg.role === 'student') {
          this._io.to('proctors').emit('chat_message', msg);
        } else if (msg.role === 'proctor') {
          for (const [, sock] of this._io.sockets.sockets) {
            if (sock.data.studentId === msg.to) {
              sock.emit('chat_message', msg);
              break;
            }
          }
        }
      });

      socket.on('disconnect', () => {
        if (socket.data.role === 'student' && socket.data.studentId) {
          this._students.disconnect(socket.data.studentId);
        }
      });
    });
  }
}
