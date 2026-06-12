import type { Comment, Student } from '../../shared/types/student';

export class CommentFactory {
  create({
    author,
    text,
    isAI = false,
    severity = null,
  }: {
    author: string;
    text: string;
    isAI?: boolean;
    severity?: Comment['severity'];
  }): Comment {
    return {
      id: Date.now(),
      author,
      text,
      isAI,
      severity,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
