import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { IWorkoutSessionRepository } from '@/features/training-plan/domain/IWorkoutSessionRepository';
import { SessionModel } from '@/features/training-plan/domain/SessionModel';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { PerformedExerciseLogModel } from '@/features/workout/domain/PerformedExerciseLogModel';
import { PerformedGroupLogModel } from '@/features/workout/domain/PerformedGroupLogModel';
import { PerformedSetModel } from '@/features/workout/domain/PerformedSetModel';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { generateId } from '@/lib';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { WorkoutFinishedEvent } from '@/shared/domain/events/WorkoutFinishedEvent';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating workout-related operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to workout execution and logging.
 */
@injectable()
export class WorkoutService {
  constructor(
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IWorkoutSessionRepository')
    private readonly workoutSessionRepository: IWorkoutSessionRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Starts a new workout from a planned session, creating an immutable snapshot.
   * Fetches historical data and creates a complete WorkoutLog aggregate for logging.
   * This is the critical workflow for workout execution.
   * @param profileId The ID of the profile starting the workout
   * @param sessionId The ID of the planned session to start
   * @param trainingPlanId Optional ID of the training plan containing the session
   * @param trainingPlanName Name of the training plan for display purposes
   * @returns A Result containing the created WorkoutLog or an error
   */
  async startWorkoutFromPlan(
    profileId: string,
    sessionId: string,
    trainingPlanId?: string,
    trainingPlanName?: string
  ): Promise<Result<WorkoutLogModel, ApplicationError>> {
    try {
      this.logger.info('Starting workout from planned session', {
        profileId,
        sessionId,
        trainingPlanId,
      });

      // Retrieve the planned session
      const plannedSession = await this.workoutSessionRepository.findById(sessionId);
      if (!plannedSession) {
        this.logger.warn('Planned session not found', { sessionId, profileId });
        return Result.failure(new NotFoundError('Planned session not found'));
      }

      // Validate session belongs to the profile
      if (plannedSession.profileId !== profileId) {
        this.logger.warn('Session does not belong to profile', { sessionId, profileId });
        return Result.failure(new ApplicationError('Session does not belong to profile'));
      }

      // Create the workout log data structure
      const workoutLogData = {
        id: generateId(),
        profileId,
        trainingPlanId,
        trainingPlanName: trainingPlanName || 'Unknown Plan',
        sessionId,
        sessionName: plannedSession.name,
        performedGroupIds: [], // Will be populated as groups are created
        startTime: new Date(),
        endTime: undefined,
        durationSeconds: undefined,
        totalVolume: undefined,
        notes: undefined,
        userRating: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create performed groups from planned groups (immutable snapshots)
      const performedGroupModels: PerformedGroupLogModel[] = plannedSession.groups.map(
        (plannedGroup) => {
          // Create performed exercises from planned exercises
          const performedExerciseModels: PerformedExerciseLogModel[] =
            plannedGroup.appliedExercises.map((appliedExercise) => {
              // Create performed sets based on set configuration
              const plannedSets = appliedExercise.setConfiguration;
              const performedSetModels: PerformedSetModel[] = [];

              // Generate sets based on configuration
              let setsCount = 1;
              if (plannedSets.type === 'standard') {
                setsCount = plannedSets.sets.min;
              }

              for (let i = 0; i < setsCount; i++) {
                const performedSetData = {
                  id: generateId(),
                  profileId,
                  counterType: appliedExercise.exerciseId ? 'reps' : 'time', // Default to reps, could be enhanced
                  counts:
                    plannedSets.type === 'standard'
                      ? plannedSets.counts.min
                      : plannedSets.type === 'dropset'
                        ? plannedSets.mainSet.counts.min
                        : 1,
                  weight: undefined,
                  completed: false,
                  notes: undefined,
                  rpe: undefined,
                  percentage: undefined,
                  plannedLoad:
                    plannedSets.type === 'standard'
                      ? plannedSets.load
                      : plannedSets.type === 'dropset'
                        ? plannedSets.mainSet.load
                        : undefined,
                  plannedRpe:
                    plannedSets.type === 'standard'
                      ? plannedSets.rpe
                      : plannedSets.type === 'dropset'
                        ? plannedSets.mainSet.rpe
                        : undefined,
                  plannedCounts:
                    plannedSets.type === 'standard'
                      ? plannedSets.counts
                      : plannedSets.type === 'dropset'
                        ? plannedSets.mainSet.counts
                        : undefined,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                // Create and hydrate the PerformedSetModel
                const performedSetModel = PerformedSetModel.hydrate(performedSetData);
                performedSetModels.push(performedSetModel);
              }

              // Create performed exercise log data
              const performedExerciseData = {
                id: generateId(),
                profileId,
                exerciseId: appliedExercise.exerciseId,
                plannedExerciseId: appliedExercise.id,
                setIds: performedSetModels.map((set) => set.id),
                notes: undefined,
                isSkipped: false,
                exerciseName: 'Exercise Name', // Would be fetched from exercise repository in real implementation
                exerciseCategory: 'strength' as const,
                muscleActivation: {},
                totalSets: performedSetModels.length,
                totalCounts: performedSetModels.reduce((sum, set) => sum + set.counts, 0),
                totalVolume: undefined,
                repCategoryDistribution: undefined,
                comparisonTrend: undefined,
                comparisonSetsChange: undefined,
                comparisonCountsChange: undefined,
                comparisonVolumeChange: undefined,
                rpeEffort: undefined,
                estimated1RM: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Create and hydrate the PerformedExerciseLogModel
              return PerformedExerciseLogModel.hydrate(performedExerciseData, performedSetModels);
            });

          // Create performed group data
          const performedGroupData = {
            id: generateId(),
            profileId,
            plannedGroupId: plannedGroup.id,
            type: plannedGroup.type,
            performedExerciseLogIds: performedExerciseModels.map((exercise) => exercise.id),
            actualRestSeconds: undefined,
          };

          // Create and hydrate the PerformedGroupLogModel
          return PerformedGroupLogModel.hydrate(performedGroupData, performedExerciseModels);
        }
      );

      // Update workout log with performed group IDs
      workoutLogData.performedGroupIds = performedGroupModels.map((group) => group.id);

      // Create the complete workout log aggregate with properly hydrated models
      const workoutLog = WorkoutLogModel.hydrate(workoutLogData, performedGroupModels);

      // Save the workout log
      const savedWorkoutLog = await this.workoutLogRepository.save(workoutLog);

      // Increment session execution count
      const updatedSession = plannedSession.cloneWithIncrementedExecutionCount();
      await this.workoutSessionRepository.save(updatedSession);

      this.logger.info('Workout started successfully', {
        workoutLogId: savedWorkoutLog.id,
        profileId,
        sessionId,
        sessionName: plannedSession.name,
      });

      return Result.success(savedWorkoutLog);
    } catch (_error) {
      this.logger.error('Failed to start workout from plan', _error as Error, {
        profileId,
        sessionId,
        trainingPlanId,
      });
      return Result.failure(new ApplicationError('Failed to start workout from plan', _error));
    }
  }

  /**
   * Retrieves a workout log by its unique identifier.
   * @param workoutLogId The workout log ID to retrieve
   * @returns A Result containing the WorkoutLogModel or an error
   */
  async getWorkoutLog(workoutLogId: string): Promise<Result<WorkoutLogModel, ApplicationError>> {
    try {
      this.logger.info('Retrieving workout log', { workoutLogId });

      const workoutLog = await this.workoutLogRepository.findById(workoutLogId);
      if (!workoutLog) {
        this.logger.warn('Workout log not found', { workoutLogId });
        return Result.failure(new NotFoundError('Workout log not found'));
      }

      this.logger.info('Workout log retrieved successfully', { workoutLogId });
      return Result.success(workoutLog);
    } catch (_error) {
      this.logger.error('Failed to retrieve workout log', _error as Error, { workoutLogId });
      return Result.failure(new ApplicationError('Failed to retrieve workout log', _error));
    }
  }

  /**
   * Retrieves all workout logs for a profile with optional filtering.
   * @param profileId The profile ID to retrieve logs for
   * @param filters Optional date range filters
   * @returns A Result containing an array of WorkoutLogModels or an error
   */
  async getWorkoutLogs(
    profileId: string,
    filters?: { dateRange?: { from: Date; to: Date } }
  ): Promise<Result<WorkoutLogModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving workout logs for profile', { profileId, filters });

      const workoutLogs = await this.workoutLogRepository.findAll(profileId, filters);

      this.logger.info('Workout logs retrieved successfully', {
        profileId,
        count: workoutLogs.length,
      });

      return Result.success(workoutLogs);
    } catch (_error) {
      this.logger.error('Failed to retrieve workout logs', _error as Error, { profileId, filters });
      return Result.failure(new ApplicationError('Failed to retrieve workout logs', _error));
    }
  }

  /**
   * Finds the last workout log for a specific session.
   * @param profileId The profile ID to search for
   * @param sessionId The session ID to find the last workout for
   * @returns A Result containing the WorkoutLogModel or an error
   */
  async getLastWorkoutForSession(
    profileId: string,
    sessionId: string
  ): Promise<Result<WorkoutLogModel | undefined, ApplicationError>> {
    try {
      this.logger.info('Retrieving last workout for session', { profileId, sessionId });

      const lastWorkout = await this.workoutLogRepository.findLastBySessionId(profileId, sessionId);

      this.logger.info('Last workout retrieved successfully', {
        profileId,
        sessionId,
        found: !!lastWorkout,
      });

      return Result.success(lastWorkout);
    } catch (_error) {
      this.logger.error('Failed to retrieve last workout for session', _error as Error, {
        profileId,
        sessionId,
      });
      return Result.failure(
        new ApplicationError('Failed to retrieve last workout for session', _error)
      );
    }
  }

  /**
   * Ends a workout by marking it as completed and calculating final metrics.
   * @param workoutLogId The ID of the workout log to end
   * @returns A Result containing the updated WorkoutLogModel or an error
   */
  async endWorkout(workoutLogId: string): Promise<Result<WorkoutLogModel, ApplicationError>> {
    try {
      this.logger.info('Ending workout', { workoutLogId });

      const workoutLog = await this.workoutLogRepository.findById(workoutLogId);
      if (!workoutLog) {
        this.logger.warn('Workout log not found for ending', { workoutLogId });
        return Result.failure(new NotFoundError('Workout log not found'));
      }

      if (workoutLog.isCompleted()) {
        this.logger.warn('Workout is already completed', { workoutLogId });
        return Result.failure(new ApplicationError('Workout is already completed'));
      }

      const endedWorkout = workoutLog.cloneAsEnded();
      const savedWorkout = await this.workoutLogRepository.save(endedWorkout);

      // Publish domain event for workout completion
      const workoutFinishedEvent = new WorkoutFinishedEvent(savedWorkout);
      DomainEvents.dispatch(workoutFinishedEvent);

      this.logger.info('Workout ended successfully', {
        workoutLogId: savedWorkout.id,
        duration: savedWorkout.getDurationInMinutes(),
        totalVolume: savedWorkout.totalVolume,
      });

      return Result.success(savedWorkout);
    } catch (_error) {
      this.logger.error('Failed to end workout', _error as Error, { workoutLogId });
      return Result.failure(new ApplicationError('Failed to end workout', _error));
    }
  }

  /**
   * Updates workout metadata such as notes and user rating.
   * @param workoutLogId The ID of the workout log to update
   * @param metadata The metadata to update
   * @returns A Result containing the updated WorkoutLogModel or an error
   */
  async updateWorkoutMetadata(
    workoutLogId: string,
    metadata: { notes?: string; userRating?: number }
  ): Promise<Result<WorkoutLogModel, ApplicationError>> {
    try {
      this.logger.info('Updating workout metadata', { workoutLogId, metadata });

      const workoutLog = await this.workoutLogRepository.findById(workoutLogId);
      if (!workoutLog) {
        this.logger.warn('Workout log not found for metadata update', { workoutLogId });
        return Result.failure(new NotFoundError('Workout log not found'));
      }

      const updatedWorkout = workoutLog.cloneWithUpdatedMetadata(metadata);
      const savedWorkout = await this.workoutLogRepository.save(updatedWorkout);

      this.logger.info('Workout metadata updated successfully', {
        workoutLogId: savedWorkout.id,
        notes: !!metadata.notes,
        userRating: metadata.userRating,
      });

      return Result.success(savedWorkout);
    } catch (_error) {
      this.logger.error('Failed to update workout metadata', _error as Error, {
        workoutLogId,
        metadata,
      });
      return Result.failure(new ApplicationError('Failed to update workout metadata', _error));
    }
  }

  /**
   * Deletes a workout log permanently.
   * @param workoutLogId The ID of the workout log to delete
   * @returns A Result indicating success or failure
   */
  async deleteWorkout(workoutLogId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting workout log', { workoutLogId });

      const workoutLog = await this.workoutLogRepository.findById(workoutLogId);
      if (!workoutLog) {
        this.logger.warn('Workout log not found for deletion', { workoutLogId });
        return Result.failure(new NotFoundError('Workout log not found'));
      }

      await this.workoutLogRepository.delete(workoutLogId);

      this.logger.info('Workout log deleted successfully', { workoutLogId });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete workout log', _error as Error, { workoutLogId });
      return Result.failure(new ApplicationError('Failed to delete workout log', _error));
    }
  }
}
