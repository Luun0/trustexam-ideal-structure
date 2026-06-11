/**
 * InMemoryStudentRepository — infrastructure: in-memory student persistence.
 * Delegates business rules to domain services.
 */

const StudentFactory = require('../../domain/StudentFactory');
const CommentFactory = require('../../domain/CommentFactory');
const AnswerGrader = require('../../domain/AnswerGrader');
const ViolationRules = require('../../domain/ViolationRules');

class InMemoryStudentRepository {
  constructor() {
    this._students = {};
    this._factory = new StudentFactory();
    this._commentFactory = new CommentFactory();
    this._grader = new AnswerGrader();
    this._violationRules = new ViolationRules();
  }

  create(id, name) {
    this._students[id] = this._factory.create(id, name);
    return this._students[id];
  }

  get(id) {
    return this._students[id] || null;
  }

  getAll() {
    return Object.values(this._students);
  }

  reactivate(id) {
    if (this._students[id]) this._students[id].status = 'active';
  }

  setOffline(id) {
    const s = this._students[id];
    if (s && s.status !== 'banned') s.status = 'offline';
  }

  setStatus(id, status) {
    const s = this._students[id];
    if (s) s.status = status;
  }

  setScore(id, score) {
    const s = this._students[id];
    if (s) s.score = score;
  }

  addComment(id, { author, text, isAI = false, severity = null }) {
    const s = this._students[id];
    if (!s) return false;
    s.comments.push(this._commentFactory.create({ author, text, isAI, severity }));
    return true;
  }

  addViolation(id, reason, severity) {
    const s = this._students[id];
    if (!s || s.status === 'banned') return null;
    s.violations++;
    this.addComment(id, { author: '🤖 AI Proctor', text: reason, isAI: true, severity });
    const newStatus = this._violationRules.applyStatusAfterViolation(s.violations);
    if (newStatus) s.status = newStatus;
    return s;
  }

  gradeAnswers(id, answers) {
    const s = this._students[id];
    if (!s) return null;
    const result = this._grader.grade(answers);
    s.autoScore = result.autoScore;
    return result;
  }

  attachRecording(id, hash) {
    const s = this._students[id];
    if (!s) return;
    s.recordingHash = hash;
    s.screenUrl = `/recordings/${hash}_screen.webm`;
    s.faceUrl = `/recordings/${hash}_face.webm`;
  }

  setRecordingDuration(id, duration) {
    const s = this._students[id];
    if (s) s.recordingDuration = duration;
  }

  findByRecordingHash(hash) {
    return Object.values(this._students).find(s => s.recordingHash === hash) || null;
  }
}

module.exports = InMemoryStudentRepository;
