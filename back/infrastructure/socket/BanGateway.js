/**
 * BanGateway — infrastructure: delivers ban notifications via Socket.IO.
 */

class BanGateway {
  constructor(io) {
    this._io = io;
  }

  banStudent(studentId) {
    for (const [, sock] of this._io.sockets.sockets) {
      if (sock.studentId === studentId) {
        sock.emit('banned');
        break;
      }
    }
  }
}

module.exports = BanGateway;
