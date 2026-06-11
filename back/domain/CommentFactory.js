/**
 * CommentFactory — creates comment value objects.
 */

class CommentFactory {
  create({ author, text, isAI = false, severity = null }) {
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

module.exports = CommentFactory;
