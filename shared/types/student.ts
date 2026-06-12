export type StudentStatus = 'active' | 'offline' | 'banned' | 'warned' | 'cleared';

export type ViolationSeverity = 'warning' | 'critical';

export interface Comment {
  id: number;
  author: string;
  text: string;
  isAI: boolean;
  severity: ViolationSeverity | null;
  time: string;
}

export interface Student {
  id: string;
  name: string;
  examTitle: string;
  status: StudentStatus;
  violations: number;
  score: number | string | null;
  autoScore: number | null;
  comments: Comment[];
  joinedAt: string;
  recordingHash: string | null;
  screenUrl: string | null;
  faceUrl: string | null;
  recordingDuration?: number;
}

export interface GradeResult {
  autoScore: number;
  correct: number;
  total: number;
}

export interface AddCommentDto {
  author?: string;
  text: string;
  isAI?: boolean;
  severity?: ViolationSeverity | null;
}
