import type { StudentStatus } from '../../shared/types/student';
import { VIOLATION_WARN_THRESHOLD, VIOLATION_BAN_THRESHOLD } from './examConfig';

export class ViolationRules {
  applyStatusAfterViolation(violationCount: number): StudentStatus | null {
    if (violationCount >= VIOLATION_BAN_THRESHOLD) return 'banned';
    if (violationCount >= VIOLATION_WARN_THRESHOLD) return 'warned';
    return null;
  }
}
