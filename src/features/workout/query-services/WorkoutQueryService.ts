import type { Query } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import type { BlueprintFitnessDB } from '@/app/db/database';
import { WorkoutLog } from '@/app/db/model/WorkoutLog';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Query service that acts as an adapter between the Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the WorkoutService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all workout-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class WorkoutQueryService {
  constructor(
    @inject(WorkoutService) private readonly workoutService: WorkoutService,
    @inject('BlueprintFitnessDB') private readonly database: BlueprintFitnessDB
  ) {}

  /**
   * Starts a new workout from a planned session.
   * @param profileId The ID of the profile starting the workout
   * @param sessionId The ID of the planned session to start
   * @param trainingPlanId Optional ID of the training plan containing the session
   * @param trainingPlanName Name of the training plan for display purposes
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created WorkoutLogModel
   */
  async startWorkoutFromPlan(
    profileId: string,
    sessionId: string,
    trainingPlanId?: string,
    trainingPlanName?: string
  ): Promise<WorkoutLogModel> {
    const result = await this.workoutService.startWorkoutFromPlan(
      profileId,
      sessionId,
      trainingPlanId,
      trainingPlanName
    );
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves a workout log by its unique identifier.
   * @param workoutLogId The workout log ID to retrieve
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the WorkoutLogModel
   */
  async getWorkoutLog(workoutLogId: string): Promise<WorkoutLogModel> {
    const result = await this.workoutService.getWorkoutLog(workoutLogId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Gets a WatermelonDB query for a specific workout log by ID.
   * @param workoutLogId The workout log ID to observe
   * @returns Query for WorkoutLog model for reactive observation
   */
  getWorkoutLogQuery(workoutLogId: string): Query<WorkoutLog> {
    const collection = this.database.get<WorkoutLog>('workout_logs');
    return collection.query(Q.where('id', workoutLogId));
  }

  /**
   * Retrieves all workout logs for a profile with optional filtering.
   * @param profileId The profile ID to retrieve logs for
   * @param filters Optional date range filters
   * @throws {ApplicationError} When the operation fails
   * @returns Query for WorkoutLog models for reactive observation
   */
  getWorkoutLogs(
    profileId: string,
    filters?: { dateRange?: { from: Date; to: Date } }
  ): Query<WorkoutLog> {
    const collection = this.database.get<WorkoutLog>('workout_logs');

    const clauses = [];

    // Apply profile filter
    if (profileId) {
      clauses.push(Q.where('profile_id', profileId));
    }

    // Apply date range filter if provided
    if (filters?.dateRange) {
      if (filters.dateRange.from) {
        clauses.push(Q.where('start_time', Q.gte(filters.dateRange.from.getTime())));
      }
      if (filters.dateRange.to) {
        clauses.push(Q.where('start_time', Q.lte(filters.dateRange.to.getTime())));
      }
    }

    return collection.query(...clauses);
  }

  /**
   * Retrieves paginated workout history for a profile.
   * Note: This method remains async as it returns complex pagination metadata
   * needed by UI components. For reactive data, use getWorkoutLogs() instead.
   * @param profileId The profile ID to retrieve history for
   * @param limit The number of logs to retrieve per page
   * @param offset The number of logs to skip (for pagination)
   * @param filters Optional date range filters
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to paginated workout history
   */
  async getWorkoutHistory(
    profileId: string,
    limit: number,
    offset: number,
    filters?: { dateRange?: { from: Date; to: Date } }
  ): Promise<{ logs: WorkoutLogModel[]; hasMore: boolean; total: number }> {
    // Get all logs first (in a real implementation, this would be paginated at the repository level)
    const result = await this.workoutService.getWorkoutLogs(profileId, filters);
    if (result.isFailure) {
      throw result.error;
    }

    const allLogs = result.value;
    const sortedLogs = allLogs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    const paginatedLogs = sortedLogs.slice(offset, offset + limit);
    const hasMore = offset + limit < sortedLogs.length;

    return {
      logs: paginatedLogs,
      hasMore,
      total: sortedLogs.length,
    };
  }

  /**
   * Finds the last workout log for a specific session.
   * @param profileId The profile ID to search for
   * @param sessionId The session ID to find the last workout for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the WorkoutLogModel or undefined if not found
   */
  async getLastWorkoutForSession(
    profileId: string,
    sessionId: string
  ): Promise<WorkoutLogModel | undefined> {
    const result = await this.workoutService.getLastWorkoutForSession(profileId, sessionId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Gets a WatermelonDB query for the last workout of a specific session.
   * @param profileId The profile ID to search for
   * @param sessionId The session ID to find the last workout for
   * @returns Query for WorkoutLog models for reactive observation
   */
  getLastWorkoutForSessionQuery(profileId: string, sessionId: string): Query<WorkoutLog> {
    const collection = this.database.get<WorkoutLog>('workout_logs');
    return collection.query(
      Q.where('profile_id', profileId),
      Q.where('session_id', sessionId),
      Q.sortBy('start_time', Q.desc),
      Q.take(1)
    );
  }

  /**
   * Ends a workout by marking it as completed and calculating final metrics.
   * @param workoutLogId The ID of the workout log to end
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated WorkoutLogModel
   */
  async endWorkout(workoutLogId: string): Promise<WorkoutLogModel> {
    const result = await this.workoutService.endWorkout(workoutLogId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Updates workout metadata such as notes and user rating.
   * @param workoutLogId The ID of the workout log to update
   * @param metadata The metadata to update
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated WorkoutLogModel
   */
  async updateWorkoutMetadata(
    workoutLogId: string,
    metadata: { notes?: string; userRating?: number }
  ): Promise<WorkoutLogModel> {
    const result = await this.workoutService.updateWorkoutMetadata(workoutLogId, metadata);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Deletes a workout log permanently.
   * @param workoutLogId The ID of the workout log to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteWorkout(workoutLogId: string): Promise<void> {
    const result = await this.workoutService.deleteWorkout(workoutLogId);
    if (result.isFailure) {
      throw result.error;
    }
  }
}
