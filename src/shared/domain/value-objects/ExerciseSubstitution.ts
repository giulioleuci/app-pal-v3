import { BusinessRuleError } from '@/shared/errors';
import { ExerciseSubstitutionData } from '@/shared/types';

/**
 * A Value Object representing a prioritized exercise substitution.
 */
export class ExerciseSubstitution {
  public readonly exerciseId: string;
  public readonly priority: number;
  public readonly reason?: string;

  constructor(data: ExerciseSubstitutionData) {
    if (data.priority < 1 || data.priority > 5) {
      throw new BusinessRuleError('errors.domain.substitution.priority');
    }
    this.exerciseId = data.exerciseId;
    this.priority = data.priority;
    this.reason = data.reason;
    Object.freeze(this);
  }

  public toPlainObject(): ExerciseSubstitutionData {
    return {
      exerciseId: this.exerciseId,
      priority: this.priority,
      reason: this.reason,
    };
  }
}
