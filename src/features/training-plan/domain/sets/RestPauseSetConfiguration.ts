import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, PerformedSetData, RestPauseSetParamsData } from '@/shared/types';

import { DurationParams, SetConfiguration } from './SetConfiguration';

export class RestPauseSetConfiguration extends SetConfiguration {
  public counts: RestPauseSetParamsData['counts'];
  public pauses: RestPauseSetParamsData['pauses'];
  public rpe?: RestPauseSetParamsData['rpe'];

  constructor(data: RestPauseSetParamsData) {
    super(data);
    this.counts = data.counts;
    this.pauses = data.pauses;
    this.rpe = data.rpe;
  }

  private formatRange(range: {
    min: number;
    max?: number | typeof Infinity;
    direction: 'asc' | 'desc';
  }): string {
    if (range.max === Infinity) {
      return `${range.min}+`;
    }
    if (range.max === undefined || range.min === range.max) {
      return `${range.min}`;
    }
    return range.direction === 'desc' ? `${range.max}-${range.min}` : `${range.min}-${range.max}`;
  }

  getTotalSets(): number {
    return 1 + this.pauses.min;
  }

  getSummary(): string {
    const countsStr = this.formatRange(this.counts);
    const pausesStr = this.formatRange(this.pauses);
    let summary = `${countsStr} reps with ${pausesStr} rest-pauses`;
    if (this.rpe) {
      summary += ` @ RPE ${this.formatRange(this.rpe)}`;
    }
    return summary;
  }

  getEstimatedDurationSeconds({
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  }: DurationParams = {}): number {
    const totalReps = this.counts.min * this.getTotalSets(); // Simplified
    return totalReps * timePerRep + this.getTotalSets() * baseTimePerSet;
  }

  generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[] {
    return Array.from({ length: this.getTotalSets() }, () => ({
      id: generateId(),
      profileId,
      counterType,
      counts: 0,
      weight: 0,
      completed: false,
      plannedRpe: this.rpe,
    }));
  }

  getEstimatedRPECurve(): number[] {
    if (!this.rpe) return [];
    return Array(this.getTotalSets()).fill(this.rpe.min);
  }

  toPlainObject(): RestPauseSetParamsData {
    return {
      type: 'restPause',
      counts: { ...this.counts },
      pauses: { ...this.pauses },
      sets: { min: 1, direction: 'asc' }, // Base schema requirement
      rpe: this.rpe ? { ...this.rpe } : undefined,
    };
  }

  clone(): RestPauseSetConfiguration {
    return new RestPauseSetConfiguration(this.toPlainObject());
  }
}
