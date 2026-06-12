/**
 * SocketHandler — presentation layer: maps Socket.IO events to application services.
 * Added: chat_message relay between students and proctors
 */

class SocketHandler {
  constructor(io, studentService) {
    this._io = io;
    this._students = studentService;
  }

  register() {
    this._io.on('connection', (socket) => {
      console.log(`[+] ${socket.id}`);

      socket.on('student_join', ({ studentId, name }) => {
        socket.studentId = studentId;
        socket.role = 'student';
        const student = this._students.join(studentId, name);
        socket.emit('init', student);
        console.log(`[STUDENT] ${name}`);
      });

      socket.on('proctor_join', ({ username }) => {
        socket.role = 'proctor';
        socket.join('proctors'); // room for all proctors
        socket.emit('init', this._students.getAll());
        console.log(`[PROCTOR] ${username}`);
      });

      socket.on('ai_violation', ({ studentId, reason, severity }) => {
        this._students.reportViolation(studentId, reason, severity);
      });

      // ── Chat relay ────────────────────────────────────────────────
      socket.on('chat_message', (msg) => {
        if (msg.role === 'student') {
          // Student → all proctors
          this._io.to('proctors').emit('chat_message', msg);
        } else if (msg.role === 'proctor') {
          // Proctor → specific student
          for (const [, sock] of this._io.sockets.sockets) {
            if (sock.studentId === msg.to) {
              sock.emit('chat_message', msg);
              break;
            }
          }
        }
      });

      socket.on('disconnect', () => {
        if (socket.role === 'student' && socket.studentId) {
          this._students.disconnect(socket.studentId);
        }
      });
    });
  }
}

module.exports = SocketHandler;