import { BusinessRuleError } from '@/shared/errors';
import { ExerciseCounter } from '@/shared/types';

/**
 * Base class for exercise counters (reps, seconds, minutes).
 */
export abstract class Counter {
  abstract readonly type: 'reps' | 'secs' | 'mins';
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new BusinessRuleError('errors.domain.counter.invalid');
    }
    // Don't freeze here - let subclasses set their properties first
  }

  public static create(value: number, type: ExerciseCounter): Counter {
    switch (type) {
      case 'reps':
        return new RepsCounter(value);
      case 'secs':
        return new SecondsCounter(value);
      case 'mins':
        return new MinutesCounter(value);
      default:
        throw new BusinessRuleError('errors.domain.counter.invalid');
    }
  }
}

export class RepsCounter extends Counter {
  public readonly type = 'reps';

  constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
}
export class SecondsCounter extends Counter {
  public readonly type = 'secs';

  constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
}
export class MinutesCounter extends Counter {
  public readonly type = 'mins';

  constructor(value: number) {
    super(value);
    Object.freeze(this);
  }
}
