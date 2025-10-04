import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';

/** Thrown when a circuit is created with fewer than two exercises. */
export class CircuitRequiresMultipleExercisesError extends BusinessRuleError {
  constructor() {
    super('errors.domain.circuit.invalidExerciseCount');
    this.name = 'CircuitRequiresMultipleExercisesError';
  }
}
