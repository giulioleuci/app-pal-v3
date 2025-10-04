import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, MavSetParamsData, PerformedSetData } from '@/shared/types';

import { DurationParams, SetConfiguration } from './SetConfiguration';

export class MavSetConfiguration extends SetConfiguration {
  public sets: MavSetParamsData['sets'];
  public counts: MavSetParamsData['counts'];
  public rpe?: MavSetParamsData['rpe'];

  constructor(data: MavSetParamsData) {
    super(data);
    this.sets = data.sets;
    this.counts = data.counts;
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
    return this.sets.min;
  }

  getSummary(): string {
    const setsStr = this.formatRange(this.sets);
    const countsStr = this.formatRange(this.counts);
    let summary = `${setsStr} MAV sets of ${countsStr} reps`;
    if (this.rpe) {
      summary += ` @ RPE ${this.formatRange(this.rpe)}`;
    }
    return summary;
  }

  getEstimatedDurationSeconds({
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  }: DurationParams = {}): number {
    const maxReps =
      this.counts.max === undefined || this.counts.max === Infinity
        ? Math.max(10, this.counts.min * 1.5)
        : this.counts.max;
    const avgReps = (this.counts.min + maxReps) / 2;
    const totalReps = this.sets.min * avgReps;
    return totalReps * timePerRep + this.sets.min * baseTimePerSet;
  }

  generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[] {
    return Array.from({ length: this.sets.min }, () => ({
      id: generateId(),
      profileId,
      counterType,
      counts: 0,
      weight: 0,
      completed: false,
      plannedRpe: this.rpe,
      plannedCounts: this.counts,
    }));
  }

  getEstimatedRPECurve(): number[] {
    if (!this.rpe) return [];
    return Array(this.getTotalSets()).fill(this.rpe.min);
  }

  toPlainObject(): MavSetParamsData {
    return {
      type: 'mav',
      sets: this.sets,
      counts: this.counts,
      rpe: this.rpe,
    };
  }

  clone(): MavSetConfiguration {
    return new MavSetConfiguration(this.toPlainObject());
  }
}
