/**
 * AnswerGrader — pure domain logic for grading student answers.
 */

const { CORRECT_ANSWERS, TOTAL_QUESTIONS } = require('./examConfig');

class AnswerGrader {
  grade(answers) {
    let correct = 0;
    for (const [qId, answerIdx] of Object.entries(answers)) {
      if (CORRECT_ANSWERS[parseInt(qId)] === answerIdx) correct++;
    }
    const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
    return { autoScore: pct, correct, total: TOTAL_QUESTIONS };
  }
}

module.exports = AnswerGrader;
