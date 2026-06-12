import type { Student } from '../../shared/types/student';

export class StudentFactory {
  create(id: string, name: string): Student {
    return {
      id,
      name,
      examTitle: 'Midterm Exam 2025',
      status: 'active',
      violations: 0,
      score: null,
      autoScore: null,
      comments: [],
      joinedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      recordingHash: null,
      screenUrl: null,
      faceUrl: null,
    };
  }
}
