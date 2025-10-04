import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';

/** Thrown when a superset is created with fewer than two exercises. */
export class SupersetRequiresMultipleExercisesError extends BusinessRuleError {
  constructor() {
    super('errors.domain.superset.invalidExerciseCount');
    this.name = 'SupersetRequiresMultipleExercisesError';
  }
}
