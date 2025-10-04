import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, MyoRepsParamsData, PerformedSetData } from '@/shared/types';

import { DurationParams, SetConfiguration } from './SetConfiguration';

export class MyoRepsSetConfiguration extends SetConfiguration {
  public activationCounts: MyoRepsParamsData['activationCounts'];
  public miniSets: MyoRepsParamsData['miniSets'];
  public miniSetCounts: MyoRepsParamsData['miniSetCounts'];
  public rpe?: MyoRepsParamsData['rpe'];

  constructor(data: MyoRepsParamsData) {
    super(data);
    this.activationCounts = data.activationCounts;
    this.miniSets = data.miniSets;
    this.miniSetCounts = data.miniSetCounts;
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
    return 1 + this.miniSets.min;
  }

  getSummary(): string {
    const activationStr = this.formatRange(this.activationCounts);
    const miniSetsStr = this.formatRange(this.miniSets);
    const miniSetCountsStr = this.formatRange(this.miniSetCounts);
    let summary = `${activationStr} reps, then ${miniSetsStr} mini-sets of ${miniSetCountsStr}`;
    if (this.rpe) {
      summary += ` @ RPE ${this.formatRange(this.rpe)}`;
    }
    return summary;
  }

  getEstimatedDurationSeconds({
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  }: DurationParams = {}): number {
    const totalReps = this.activationCounts.min + this.miniSets.min * this.miniSetCounts.min;
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

  toPlainObject(): MyoRepsParamsData {
    return {
      type: 'myoReps',
      activationCounts: { ...this.activationCounts },
      miniSets: { ...this.miniSets },
      miniSetCounts: { ...this.miniSetCounts },
      sets: { min: 1, direction: 'asc' }, // Base schema requirement
      rpe: this.rpe ? { ...this.rpe } : undefined,
    };
  }

  clone(): MyoRepsSetConfiguration {
    return new MyoRepsSetConfiguration(this.toPlainObject());
  }
}
