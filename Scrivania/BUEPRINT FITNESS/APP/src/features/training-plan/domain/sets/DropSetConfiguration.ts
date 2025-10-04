import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { DropSetParamsData, ExerciseCounter, PerformedSetData } from '@/shared/types';

import { DurationParams, SetConfiguration } from './SetConfiguration';

export class DropSetConfiguration extends SetConfiguration {
  public startCounts: DropSetParamsData['startCounts'];
  public drops: DropSetParamsData['drops'];
  public rpe?: DropSetParamsData['rpe'];

  constructor(data: DropSetParamsData) {
    super(data);
    this.startCounts = data.startCounts;
    this.drops = data.drops;
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
    return 1 + this.drops.min;
  }

  getSummary(): string {
    const startStr = this.formatRange(this.startCounts);
    const dropsStr = this.formatRange(this.drops);
    let summary = `${startStr} reps, then ${dropsStr} drops`;
    if (this.rpe) {
      summary += ` to RPE ${this.formatRange(this.rpe)}`;
    }
    return summary;
  }

  getEstimatedDurationSeconds({
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  }: DurationParams = {}): number {
    // A drop set is one long set. We estimate a lower rep time due to fatigue.
    const totalReps = this.startCounts.min + this.drops.min * (this.startCounts.min / 2); // Rough estimate
    const result = totalReps * (timePerRep * 0.8) + baseTimePerSet;
    return Math.round(result * 100) / 100; // Round to 2 decimal places to avoid floating point precision issues
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

  toPlainObject(): DropSetParamsData {
    return {
      type: 'drop',
      startCounts: { ...this.startCounts },
      drops: { ...this.drops },
      sets: { min: 1, direction: 'asc' }, // Base schema requirement
      rpe: this.rpe ? { ...this.rpe } : undefined,
    };
  }

  clone(): DropSetConfiguration {
    return new DropSetConfiguration(this.toPlainObject());
  }
}
