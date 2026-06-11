/**
 * SocketHandler — presentation layer: maps Socket.IO events to application services.
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
        socket.emit('init', this._students.getAll());
        console.log(`[PROCTOR] ${username}`);
      });

      socket.on('ai_violation', ({ studentId, reason, severity }) => {
        this._students.reportViolation(studentId, reason, severity);
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
