import { formatDuration, intervalToDuration } from 'date-fns';

import { BusinessRuleError } from '@/shared/errors';

/**
 * A Value Object representing a duration of time, stored in seconds.
 */
export class Duration {
  private constructor(private readonly seconds: number) {
    if (seconds < 0) {
      throw new BusinessRuleError('errors.domain.duration.negative');
    }
    Object.freeze(this);
  }

  public static fromSeconds(seconds: number): Duration {
    return new Duration(seconds);
  }

  public static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60);
  }

  public asSeconds(): number {
    return this.seconds;
  }

  public asMinutes(): number {
    return this.seconds / 60;
  }

  /**
   * Formats the duration into a string like 'mm:ss'.
   * @returns The formatted duration string.
   */
  public format(): string {
    const duration = intervalToDuration({ start: 0, end: this.seconds * 1000 });
    return formatDuration(duration, { format: ['minutes', 'seconds'], zero: true, delimiter: ':' });
  }
}
