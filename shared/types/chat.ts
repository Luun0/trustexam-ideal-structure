export type ChatRole = 'student' | 'proctor';

export interface ChatMessage {
  from: string;
  fromName: string;
  to: string;
  text: string;
  time: string;
  role: ChatRole;
}
