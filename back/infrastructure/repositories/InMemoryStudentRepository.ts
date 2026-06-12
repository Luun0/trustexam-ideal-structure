import type { Student, GradeResult, AddCommentDto } from '../../../shared/types/student';
import type { IStudentRepository } from './IRepositories';
import { StudentFactory } from '../../domain/StudentFactory';
import { CommentFactory } from '../../domain/CommentFactory';
import { AnswerGrader } from '../../domain/AnswerGrader';
import { ViolationRules } from '../../domain/ViolationRules';

export class InMemoryStudentRepository implements IStudentRepository {
  private _students: Record<string, Student> = {};
  private _factory = new StudentFactory();
  private _commentFactory = new CommentFactory();
  private _grader = new AnswerGrader();
  private _violationRules = new ViolationRules();

  create(id: string, name: string): Student {
    this._students[id] = this._factory.create(id, name);
    return this._students[id];
  }

  get(id: string): Student | null {
    return this._students[id] || null;
  }

  getAll(): Student[] {
    return Object.values(this._students);
  }

  reactivate(id: string): void {
    if (this._students[id]) this._students[id].status = 'active';
  }

  setOffline(id: string): void {
    const s = this._students[id];
    if (s && s.status !== 'banned') s.status = 'offline';
  }

  setStatus(id: string, status: Student['status']): void {
    const s = this._students[id];
    if (s) s.status = status;
  }

  setScore(id: string, score: number | string): void {
    const s = this._students[id];
    if (s) s.score = score;
  }

  addComment(id: string, { author, text, isAI = false, severity = null }: AddCommentDto): boolean {
    const s = this._students[id];
    if (!s) return false;
    s.comments.push(this._commentFactory.create({ author: author || 'Проктор', text, isAI, severity }));
    return true;
  }

  addViolation(id: string, reason: string, severity: string): Student | null {
    const s = this._students[id];
    if (!s || s.status === 'banned') return null;
    s.violations++;
    this.addComment(id, { author: '🤖 AI Proctor', text: reason, isAI: true, severity: severity as AddCommentDto['severity'] });
    const newStatus = this._violationRules.applyStatusAfterViolation(s.violations);
    if (newStatus) s.status = newStatus;
    return s;
  }

  gradeAnswers(id: string, answers: Record<string, number>): GradeResult | null {
    const s = this._students[id];
    if (!s) return null;
    const result = this._grader.grade(answers);
    s.autoScore = result.autoScore;
    return result;
  }

  attachRecording(id: string, hash: string): void {
    const s = this._students[id];
    if (!s) return;
    s.recordingHash = hash;
    s.screenUrl = `/recordings/${hash}_screen.webm`;
    s.faceUrl = `/recordings/${hash}_face.webm`;
  }

  setRecordingDuration(id: string, duration: number): void {
    const s = this._students[id];
    if (s) s.recordingDuration = duration;
  }

  findByRecordingHash(hash: string): Student | null {
    return Object.values(this._students).find(s => s.recordingHash === hash) || null;
  }
}
