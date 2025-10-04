import { BASE_SECONDS_PER_SET, generateId, SECONDS_PER_REP } from '@/lib';
import { ExerciseCounter, PerformedSetData, PyramidalSetParamsData } from '@/shared/types';

import { DurationParams, SetConfiguration } from './SetConfiguration';

export class PyramidalSetConfiguration extends SetConfiguration {
  public startCounts: PyramidalSetParamsData['startCounts'];
  public endCounts: PyramidalSetParamsData['endCounts'];
  public step: PyramidalSetParamsData['step'];
  public mode: PyramidalSetParamsData['mode'];
  public rpe?: PyramidalSetParamsData['rpe'];

  constructor(data: PyramidalSetParamsData) {
    super(data);
    this.startCounts = data.startCounts;
    this.endCounts = data.endCounts;
    this.step = data.step;
    this.mode = data.mode;
    this.rpe = data.rpe;
  }

  private getPyramidSets(): number[] {
    const sets = [];
    const step = this.step.min;
    if (this.mode === 'ascending' || this.mode === 'bothAscendingDescending') {
      for (let i = this.startCounts.min; i <= this.endCounts.min; i += step) {
        sets.push(i);
      }
    }
    if (this.mode === 'descending' || this.mode === 'bothAscendingDescending') {
      const start = this.mode === 'descending' ? this.startCounts.min : this.endCounts.min - step;
      for (
        let i = start;
        i >= (this.mode === 'descending' ? this.endCounts.min : this.startCounts.min);
        i -= step
      ) {
        sets.push(i);
      }
    }
    return sets;
  }

  getTotalSets(): number {
    return this.getPyramidSets().length;
  }

  getSummary(): string {
    return `Pyramid from ${this.startCounts.min} to ${this.endCounts.min} reps`;
  }

  getEstimatedDurationSeconds({
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  }: DurationParams = {}): number {
    const sets = this.getPyramidSets();
    const totalReps = sets.reduce((sum, reps) => sum + reps, 0);
    return totalReps * timePerRep + sets.length * baseTimePerSet;
  }

  generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[] {
    const sets = this.getPyramidSets();
    return sets.map((counts) => ({
      id: generateId(),
      profileId,
      counterType,
      counts: 0,
      weight: 0,
      completed: false,
      plannedRpe: this.rpe,
      plannedCounts: { min: counts, direction: 'asc' },
    }));
  }

  getEstimatedRPECurve(): number[] {
    if (!this.rpe) return [];
    return Array(this.getTotalSets()).fill(this.rpe.min);
  }

  toPlainObject(): PyramidalSetParamsData {
    return {
      type: 'pyramidal',
      startCounts: { ...this.startCounts },
      endCounts: { ...this.endCounts },
      step: { ...this.step },
      mode: this.mode,
      sets: { min: this.getTotalSets(), direction: 'asc' }, // Base schema requirement
      rpe: this.rpe ? { ...this.rpe } : undefined,
    };
  }

  clone(): PyramidalSetConfiguration {
    return new PyramidalSetConfiguration(this.toPlainObject());
  }
}
