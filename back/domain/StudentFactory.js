/**
 * StudentFactory — creates new student entities with default state.
 */

class StudentFactory {
  create(id, name) {
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

module.exports = StudentFactory;
