import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';

/** Thrown when an AMRAP or EMOM group is created without a duration. */
export class AmrapEmomRequiresDurationError extends BusinessRuleError {
  constructor(public readonly type: 'AMRAP' | 'EMOM') {
    super('errors.domain.amrapEmom.durationRequired');
    this.name = 'AmrapEmomRequiresDurationError';
  }
}
