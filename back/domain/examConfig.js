/**
 * Domain constants — exam configuration and violation thresholds.
 */

const CORRECT_ANSWERS = { 1: 1, 2: 1, 3: 2, 4: 0, 5: 2 };
const TOTAL_QUESTIONS = 5;
const VIOLATION_WARN_THRESHOLD = 3;
const VIOLATION_BAN_THRESHOLD = 5;

module.exports = {
  CORRECT_ANSWERS,
  TOTAL_QUESTIONS,
  VIOLATION_WARN_THRESHOLD,
  VIOLATION_BAN_THRESHOLD,
};
