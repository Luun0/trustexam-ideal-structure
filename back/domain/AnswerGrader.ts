import type { GradeResult } from '../../shared/types/student';
import { CORRECT_ANSWERS, TOTAL_QUESTIONS } from './examConfig';

export class AnswerGrader {
  grade(answers: Record<string, number>): GradeResult {
    let correct = 0;
    for (const [qId, answerIdx] of Object.entries(answers)) {
      if (CORRECT_ANSWERS[parseInt(qId, 10)] === answerIdx) correct++;
    }
    const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
    return { autoScore: pct, correct, total: TOTAL_QUESTIONS };
  }
}
