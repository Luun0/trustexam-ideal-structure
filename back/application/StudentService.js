/**
 * StudentService — application layer: orchestrates student use cases.
 */

class StudentService {
  constructor(studentRepository, broadcastNotifier, banGateway) {
    this._students = studentRepository;
    this._broadcast = broadcastNotifier;
    this._banGateway = banGateway;
  }

  getAll() {
    return this._students.getAll();
  }

  get(id) {
    return this._students.get(id);
  }

  join(studentId, name) {
    if (!this._students.get(studentId)) {
      this._students.create(studentId, name);
    } else {
      this._students.reactivate(studentId);
    }
    this._broadcast.emitStudentsUpdate();
    return this._students.get(studentId);
  }

  disconnect(studentId) {
    this._students.setOffline(studentId);
    this._broadcast.emitStudentsUpdate();
  }

  addComment(studentId, { author, text }) {
    const ok = this._students.addComment(studentId, {
      author: author || 'Проктор',
      text,
    });
    if (!ok) return false;
    this._broadcast.emitStudentsUpdate();
    return true;
  }

  setVerdict(studentId, verdict) {
    const student = this._students.get(studentId);
    if (!student) return false;
    this._students.setStatus(studentId, verdict);
    if (verdict === 'banned') {
      this._banGateway.banStudent(studentId);
    }
    this._broadcast.emitStudentsUpdate();
    return true;
  }

  setScore(studentId, score) {
    const student = this._students.get(studentId);
    if (!student) return false;
    this._students.setScore(studentId, score);
    this._broadcast.emitStudentsUpdate();
    return true;
  }

  submitAnswers(studentId, answers) {
    const result = this._students.gradeAnswers(studentId, answers || {});
    if (!result) return null;
    this._broadcast.emitStudentsUpdate();
    return result;
  }

  reportViolation(studentId, reason, severity) {
    const student = this._students.addViolation(studentId, reason, severity);
    if (!student) return null;
    if (student.status === 'banned') {
      this._banGateway.banStudent(studentId);
    }
    this._broadcast.emitStudentsUpdate();
    return student;
  }

  attachRecording(studentId, hash) {
    this._students.attachRecording(studentId, hash);
    this._broadcast.emitStudentsUpdate();
  }

  setRecordingDuration(studentId, duration) {
    this._students.setRecordingDuration(studentId, duration);
    this._broadcast.emitStudentsUpdate();
  }

  findByRecordingHash(hash) {
    return this._students.findByRecordingHash(hash);
  }
}

module.exports = StudentService;
