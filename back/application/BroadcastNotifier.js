/**
 * BroadcastNotifier — application service: notifies clients of state changes.
 */

class BroadcastNotifier {
  constructor(io, studentRepository) {
    this._io = io;
    this._students = studentRepository;
  }

  emitStudentsUpdate() {
    this._io.emit('students_update', this._students.getAll());
  }
}

module.exports = BroadcastNotifier;
