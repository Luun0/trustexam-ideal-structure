/**
 * ViolationRules — pure domain logic for violation consequences.
 */

const { VIOLATION_WARN_THRESHOLD, VIOLATION_BAN_THRESHOLD } = require('./examConfig');

class ViolationRules {
  applyStatusAfterViolation(violationCount) {
    if (violationCount >= VIOLATION_BAN_THRESHOLD) return 'banned';
    if (violationCount >= VIOLATION_WARN_THRESHOLD) return 'warned';
    return null;
  }
}

module.exports = ViolationRules;
