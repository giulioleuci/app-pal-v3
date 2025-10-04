import { addDays, differenceInDays, isFuture, isPast, isWithinInterval } from 'date-fns';
import { immerable, produce } from 'immer';

import { BaseModel } from '@/shared/domain';
import {
  DayOfWeek,
  TrainingCycleData,
  TrainingCycleGoal,
  trainingCycleSchema,
} from '@/shared/types';

import { TrainingPlanModel } from './TrainingPlanModel';

/**
 * A domain model representing a training cycle aggregate root.
 * Contains cycle metadata, manages duration, and tracks progress over time.
 */
export class TrainingCycleModel extends BaseModel<TrainingCycleData> {
  [immerable] = true;

  public readonly profileId: string;
  public readonly name: string;
  public readonly startDate: Date;
  public readonly endDate: Date;
  public readonly goal: TrainingCycleGoal;
  public readonly notes?: string;

  protected constructor(props: TrainingCycleData) {
    super(props);
    this.profileId = props.profileId;
    this.name = props.name;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.goal = props.goal;
    this.notes = props.notes;
  }

  /**
   * Creates a new TrainingCycleModel instance from plain data.
   * @param props The training cycle data to hydrate from
   * @returns A new TrainingCycleModel instance
   */
  public static hydrate(props: TrainingCycleData): TrainingCycleModel {
    return new TrainingCycleModel(props);
  }

  private createUpdatedInstance(updates: Partial<TrainingCycleData>): TrainingCycleModel {
    const currentData = this.toPlainObject();
    const newData = { ...currentData, ...updates, updatedAt: new Date() };
    return new TrainingCycleModel(newData);
  }

  /**
   * Gets the total duration of the training cycle in days.
   * @returns The duration in days (inclusive of start and end dates)
   */
  getDurationInDays(): number {
    return differenceInDays(this.endDate, this.startDate) + 1;
  }

  /**
   * Gets the approximate duration of the training cycle in weeks.
   * @returns The duration in weeks (rounded)
   */
  getDurationInWeeks(): number {
    return Math.round(this.getDurationInDays() / 7);
  }

  /**
   * Checks if the training cycle is currently active.
   * @param currentDate The current date to check against
   * @returns True if the current date falls within the cycle period
   */
  isActive(currentDate: Date): boolean {
    return isWithinInterval(currentDate, { start: this.startDate, end: this.endDate });
  }

  /**
   * Checks if the training cycle has been completed.
   * @param currentDate The current date to check against
   * @returns True if the cycle end date has passed
   */
  isCompleted(currentDate: Date): boolean {
    // Cycle is completed only when:
    // 1. Current date is AFTER the end date (not on the end date)
    // 2. Current date is not in the future (relative to "now")
    return currentDate > this.endDate && !isFuture(currentDate);
  }

  /**
   * Checks if the training cycle is scheduled for the future.
   * @param currentDate The current date to check against
   * @returns True if the cycle start date is in the future
   */
  isFuture(currentDate: Date): boolean {
    return isFuture(this.startDate) && isFuture(currentDate);
  }

  /**
   * Calculates the completion percentage of the training cycle.
   * @param currentDate The current date to calculate progress against
   * @returns The completion percentage (0-100)
   */
  getCompletionPercentage(currentDate: Date): number {
    const totalDays = this.getDurationInDays();
    if (totalDays <= 0) return 0;

    // If we're on or after the end date, consider it 100% complete
    if (currentDate >= this.endDate) return 100;

    const elapsed = this.getElapsedDays(currentDate);
    if (elapsed <= 0) return 0;

    return Math.round((elapsed / totalDays) * 100);
  }

  /**
   * Gets the number of days remaining in the training cycle.
   * @param currentDate The current date to calculate from
   * @returns The number of days remaining (0 if completed)
   */
  getRemainingDays(currentDate: Date): number {
    // Return 0 if the cycle is completed (current date is after end date)
    if (this.isCompleted(currentDate)) return 0;
    return Math.max(0, differenceInDays(this.endDate, currentDate));
  }

  /**
   * Gets the number of days elapsed since the cycle started.
   * @param currentDate The current date to calculate from
   * @returns The number of days elapsed (0 if not started)
   */
  getElapsedDays(currentDate: Date): number {
    if (isFuture(this.startDate)) return 0;
    return Math.max(0, differenceInDays(currentDate, this.startDate));
  }

  /**
   * Creates a new training cycle instance with updated details.
   * @param details The details to update (name, goal, notes)
   * @returns A new TrainingCycleModel instance with updated details
   */
  cloneWithUpdatedDetails(details: {
    name?: string;
    goal?: TrainingCycleGoal;
    notes?: string;
  }): TrainingCycleModel {
    return this.createUpdatedInstance(details);
  }

  /**
   * Creates a new training cycle instance with new start and end dates.
   * @param newStartDate The new start date
   * @param newEndDate The new end date
   * @returns A new TrainingCycleModel instance with updated dates
   * @throws Error if start date is after end date
   */
  cloneWithNewDates(newStartDate: Date, newEndDate: Date): TrainingCycleModel {
    if (newStartDate > newEndDate) {
      throw new Error('Start date must be before end date.');
    }
    return this.createUpdatedInstance({ startDate: newStartDate, endDate: newEndDate });
  }

  /**
   * Creates a new training cycle instance with extended duration.
   * @param daysToAdd The number of days to add to the end date
   * @returns A new TrainingCycleModel instance with extended end date
   */
  cloneWithExtendedDuration(daysToAdd: number): TrainingCycleModel {
    const newEndDate = addDays(this.endDate, daysToAdd);
    return this.createUpdatedInstance({ endDate: newEndDate });
  }

  /**
   * Creates a new training cycle instance with shifted dates.
   * @param daysToShift The number of days to shift both start and end dates
   * @returns A new TrainingCycleModel instance with shifted dates
   */
  cloneWithShiftedDates(daysToShift: number): TrainingCycleModel {
    const newStartDate = addDays(this.startDate, daysToShift);
    const newEndDate = addDays(this.endDate, daysToShift);
    return this.createUpdatedInstance({ startDate: newStartDate, endDate: newEndDate });
  }

  /**
   * Filters training plans to get those associated with this cycle.
   * @param allPlansInProfile All training plans in the profile
   * @returns Training plans that belong to this cycle
   */
  getAssociatedPlans(allPlansInProfile: TrainingPlanModel[]): TrainingPlanModel[] {
    return allPlansInProfile.filter((plan) => plan.cycleId === this.id);
  }

  /**
   * Gets the total number of sessions across all associated training plans.
   * @param plans The training plans associated with this cycle
   * @returns The total session count
   */
  getTotalSessionCount(plans: TrainingPlanModel[]): number {
    return plans.reduce((acc, plan) => acc + plan.getTotalSessions(), 0);
  }

  /**
   * Calculates the average weekly session frequency for the cycle.
   * @param plans The training plans associated with this cycle
   * @returns The average sessions per week
   */
  getWeeklySessionFrequency(plans: TrainingPlanModel[]): number {
    const weeks = this.getDurationInWeeks();
    if (weeks <= 0) return 0;
    return Math.round((this.getTotalSessionCount(plans) / weeks) * 10) / 10;
  }

  /**
   * Finds training plans that have sessions scheduled for a specific day.
   * @param day The day of the week to search for
   * @param plans The training plans associated with this cycle
   * @returns Training plans with sessions on the specified day
   */
  findPlansByDayOfWeek(day: DayOfWeek, plans: TrainingPlanModel[]): TrainingPlanModel[] {
    return plans.filter((plan) => plan.sessions.some((s) => s.dayOfWeek === day));
  }

  /**
   * Creates a deep, structurally-shared clone of the model instance.
   * @returns A cloned instance of this TrainingCycleModel
   */
  clone(): this {
    return produce(this, (draft) => {}) as this;
  }

  /**
   * Converts the rich domain model back into a plain, serializable object.
   * @returns The plain TrainingCycleData object
   */
  toPlainObject(): TrainingCycleData {
    const { id, profileId, name, startDate, endDate, goal, notes, createdAt, updatedAt } = this;
    return { id, profileId, name, startDate, endDate, goal, notes, createdAt, updatedAt };
  }

  /**
   * Validates the model's data against its corresponding Zod schema.
   * @returns Validation result with success status and potential errors
   */
  validate() {
    return trainingCycleSchema.safeParse(this.toPlainObject());
  }
}
