import type { Student, GradeResult } from '../../shared/types/student';
import type { IStudentRepository } from '../infrastructure/repositories/IRepositories';
import type { BanGateway } from '../infrastructure/socket/BanGateway';
import type { BroadcastNotifier } from './BroadcastNotifier';

export class StudentService {
  constructor(
    private _students: IStudentRepository,
    private _broadcast: BroadcastNotifier,
    private _banGateway: BanGateway,
  ) {}

  getAll(): Student[] {
    return this._students.getAll();
  }

  get(id: string): Student | null {
    return this._students.get(id);
  }

  join(studentId: string, name: string): Student {
    if (!this._students.get(studentId)) {
      this._students.create(studentId, name);
    } else {
      this._students.reactivate(studentId);
    }
    this._broadcast.emitStudentsUpdate();
    return this._students.get(studentId)!;
  }

  disconnect(studentId: string): void {
    this._students.setOffline(studentId);
    this._broadcast.emitStudentsUpdate();
  }

  addComment(studentId: string, { author, text }: { author?: string; text: string }): boolean {
    const ok = this._students.addComment(studentId, {
      author: author || 'Проктор',
      text,
    });
    if (!ok) return false;
    this._broadcast.emitStudentsUpdate();
    return true;
  }

  setVerdict(studentId: string, verdict: Student['status']): boolean {
    const student = this._students.get(studentId);
    if (!student) return false;
    this._students.setStatus(studentId, verdict);
    if (verdict === 'banned') {
      this._banGateway.banStudent(studentId);
    }
    this._broadcast.emitStudentsUpdate();
    return true;
  }

  setScore(studentId: string, score: number | string): boolean {
    const student = this._students.get(studentId);
    if (!student) return false;
    this._students.setScore(studentId, score);
    this._broadcast.emitStudentsUpdate();
    return true;
  }

  submitAnswers(studentId: string, answers: Record<string, number>): GradeResult | null {
    const result = this._students.gradeAnswers(studentId, answers || {});
    if (!result) return null;
    this._broadcast.emitStudentsUpdate();
    return result;
  }

  reportViolation(studentId: string, reason: string, severity: string): Student | null {
    const student = this._students.addViolation(studentId, reason, severity);
    if (!student) return null;
    if (student.status === 'banned') {
      this._banGateway.banStudent(studentId);
    }
    this._broadcast.emitStudentsUpdate();
    return student;
  }

  attachRecording(studentId: string, hash: string): void {
    this._students.attachRecording(studentId, hash);
    this._broadcast.emitStudentsUpdate();
  }

  setRecordingDuration(studentId: string, duration: number): void {
    this._students.setRecordingDuration(studentId, duration);
    this._broadcast.emitStudentsUpdate();
  }

  findByRecordingHash(hash: string): Student | null {
    return this._students.findByRecordingHash(hash);
  }
}
