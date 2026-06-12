export type LoginRole = 'student' | 'proctor';

export interface Session {
  role: LoginRole;
  username: string;
  studentId: string | null;
}
