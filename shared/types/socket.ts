import type { Student } from './student';
import type { ChatMessage } from './chat';

export interface ServerToClientEvents {
  students_update: (students: Student[]) => void;
  banned: () => void;
  init: (data: Student | Student[]) => void;
  chat_message: (msg: ChatMessage) => void;
}

export interface ClientToServerEvents {
  student_join: (data: { studentId: string; name: string }) => void;
  proctor_join: (data: { username: string }) => void;
  ai_violation: (data: { studentId: string; reason: string; severity: string }) => void;
  chat_message: (msg: ChatMessage) => void;
}

export interface SocketData {
  studentId?: string;
  role?: 'student' | 'proctor';
}
