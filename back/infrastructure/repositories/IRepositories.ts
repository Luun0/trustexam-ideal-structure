import type { Student, GradeResult, AddCommentDto } from '../../../shared/types/student';
import type { RecordingType, ChunkWriteResult } from '../../../shared/types/recording';
import type { ReadStream } from 'fs';

export interface IStudentRepository {
  create(id: string, name: string): Student;
  get(id: string): Student | null;
  getAll(): Student[];
  reactivate(id: string): void;
  setOffline(id: string): void;
  setStatus(id: string, status: Student['status']): void;
  setScore(id: string, score: number | string): void;
  addComment(id: string, dto: AddCommentDto): boolean;
  addViolation(id: string, reason: string, severity: string): Student | null;
  gradeAnswers(id: string, answers: Record<string, number>): GradeResult | null;
  attachRecording(id: string, hash: string): void;
  setRecordingDuration(id: string, duration: number): void;
  findByRecordingHash(hash: string): Student | null;
}

export interface IRecordingRepository {
  startSession(studentId: string): string;
  getSession(studentId: string): unknown;
  writeChunk(studentId: string, type: RecordingType, buffer: Buffer): ChunkWriteResult | null;
  stopSession(studentId: string): Promise<{ hash: string; screenSize: number; faceSize: number; duration: number }>;
  listAll(): Array<{
    hash: string;
    screenPath: string;
    facePath: string;
    screenStat: { size: number; birthtime: Date };
    faceStat: { size: number } | null;
  }>;
  fileExists(filename: string): boolean;
  fileStats(filename: string): { size: number } | null;
  createReadStream(filename: string, options?: { start?: number; end?: number }): ReadStream;
}
