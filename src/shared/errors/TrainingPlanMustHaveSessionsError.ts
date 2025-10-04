import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';

/** Thrown when attempting to build a training plan with no sessions. */
export class TrainingPlanMustHaveSessionsError extends BusinessRuleError {
  constructor() {
    super('errors.domain.trainingPlan.noSessions');
    this.name = 'TrainingPlanMustHaveSessionsError';
  }
}
