import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, database, db } from '@/app/db/database';

import { IPerformedGroupRepository } from '../domain/IPerformedGroupRepository';
import { IWorkoutLogRepository } from '../domain/IWorkoutLogRepository';
import { WorkoutLogModel } from '../domain/WorkoutLogModel';

/**
 * Concrete implementation of IWorkoutLogRepository using WatermelonDB.
 * Handles persistence and retrieval of WorkoutLog domain models as aggregate roots.
 * Self-assembles the full aggregate by injecting child repository interfaces and
 * orchestrates the assembly of all child entities (performed groups, exercises, and sets).
 *
 * This repository acts as a pure data mapper, delegating hydration to the model's
 * static hydrate method and dehydration to toPlainObject. All write operations
 * are wrapped in atomic transactions to ensure data integrity.
 */
@injectable()
export class WorkoutLogRepository implements IWorkoutLogRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new WorkoutLogRepository instance.
   * @param performedGroupRepository Repository for fetching performed groups
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(
    @inject('IPerformedGroupRepository')
    private performedGroupRepository: IPerformedGroupRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  ) {
    this.database = database;
  }

  /**
   * Persists a WorkoutLogModel aggregate to the database by dehydrating it to plain data
   * using the model's toPlainObject method. Also persists all child entities (performed groups)
   * in an atomic transaction to maintain consistency across the entire aggregate.
   *
   * The dehydration process extracts the core workout log data and performed group IDs,
   * then delegates the persistence of child groups to the injected performed group repository
   * for deep transactional writes.
   *
   * @param log The WorkoutLogModel aggregate instance to save
   * @returns Promise resolving to the saved WorkoutLogModel aggregate
   */
  async save(log: WorkoutLogModel): Promise<WorkoutLogModel> {
    // Use WatermelonDB's write transaction for atomic operations
    await this.database.write(async () => {
      // Save all child performed groups first - if any child fails, the entire transaction fails
      for (const performedGroup of log.performedGroups) {
        await this.performedGroupRepository.save(performedGroup, true);
      }

      // Only after all children succeed, save the workout log aggregate root
      const logData = log.toPlainObject();
      await this.database.workoutLogs.put(logData);
    });

    return log;
  }

  /**
   * Retrieves a workout log by ID and hydrates it into a WorkoutLogModel aggregate
   * using the model's static hydrate method. Orchestrates the assembly of the complete
   * domain model by fetching all child entities through injected child repositories.
   *
   * The internal assembly process fetches the top-level workout log data, then uses
   * eager loading to fetch all descendant records (performed groups -> exercises -> sets)
   * for full hydration of the domain model.
   *
   * @param id The workout log ID to find
   * @returns Promise resolving to WorkoutLogModel if found, undefined otherwise
   */
  async findById(id: string): Promise<WorkoutLogModel | undefined> {
    const logData = await this.database.workoutLogs.get(id);
    if (!logData) {
      return undefined;
    }

    // Eagerly fetch all performed groups for this workout log through child repository
    // This will trigger deep loading of all descendant entities (groups -> exercises -> sets)
    const performedGroups = await this.performedGroupRepository.findByIds(
      logData.performedGroupIds
    );

    // Delegate hydration to the domain model's static method
    return WorkoutLogModel.hydrate(logData, performedGroups);
  }

  /**
   * Retrieves workout logs for a profile with optional filtering and hydrates them
   * into WorkoutLogModel aggregates using the model's static hydrate method.
   * Orchestrates the assembly of multiple complete domain models by batch-fetching
   * child entities through injected repositories for optimal performance.
   *
   * The internal assembly process applies date range filters, batch-fetches all
   * required performed groups with eager loading, and efficiently maps them back to their parent workout logs.
   *
   * @param profileId The profile ID to find workout logs for
   * @param filters Optional filters for date range
   * @returns Promise resolving to array of WorkoutLogModel aggregates
   */
  async findAll(
    profileId: string,
    filters?: { dateRange?: { from: Date; to: Date } }
  ): Promise<WorkoutLogModel[]> {
    // Build the query with filters
    let logsData = await this.database.workoutLogs.where('profileId').equals(profileId).toArray();

    // Apply client-side filters for date range (WatermelonDB query builder limitations)
    if (filters?.dateRange) {
      const { from, to } = filters.dateRange;
      logsData = logsData.filter((log) => log.startTime >= from && log.startTime <= to);
    }

    if (logsData.length === 0) {
      return [];
    }

    // Collect all performed group IDs from all workout logs for batch fetching
    const allPerformedGroupIds = logsData.flatMap((log) => log.performedGroupIds);
    const allPerformedGroups = await this.performedGroupRepository.findByIds(allPerformedGroupIds);

    // Group performed groups by their IDs for efficient lookup during hydration
    const performedGroupsById = new Map(allPerformedGroups.map((group) => [group.id, group]));

    // Hydrate each workout log with its corresponding performed groups
    return logsData.map((logData) => {
      const logPerformedGroups = logData.performedGroupIds
        .map((groupId) => performedGroupsById.get(groupId))
        .filter((group) => group !== undefined);

      return WorkoutLogModel.hydrate(logData, logPerformedGroups);
    });
  }

  /**
   * Retrieves the most recent workout log for a specific session and profile,
   * hydrated into a WorkoutLogModel aggregate. Useful for tracking workout progression
   * and loading previous performance data for a specific session.
   *
   * The internal assembly process queries for the most recent log by session ID,
   * fetches its performed groups with eager loading, and constructs the complete aggregate.
   *
   * @param profileId The profile ID to search within
   * @param sessionId The session ID to find the last workout for
   * @returns Promise resolving to the most recent WorkoutLogModel if found, undefined otherwise
   */
  async findLastBySessionId(
    profileId: string,
    sessionId: string
  ): Promise<WorkoutLogModel | undefined> {
    // Get all workout logs for this profile and session
    const allLogsData = await this.database.workoutLogs
      .where('profileId')
      .equals(profileId)
      .toArray();

    // Filter by session ID client-side (WatermelonDB compound index limitations)
    const logsData = allLogsData.filter((log) => log.sessionId === sessionId);

    if (logsData.length === 0) {
      return undefined;
    }

    // Sort by startTime descending to get the most recent
    const logData = logsData.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

    // Eagerly fetch all performed groups for this workout log through child repository
    const performedGroups = await this.performedGroupRepository.findByIds(
      logData.performedGroupIds
    );

    // Delegate hydration to the domain model's static method
    return WorkoutLogModel.hydrate(logData, performedGroups);
  }

  /**
   * Deletes a workout log by ID from the database along with all its child entities
   * in an atomic transaction. Ensures cascade deletion of all performed groups and their
   * hierarchies through the injected child repositories.
   *
   * @param id The workout log ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    const log = await this.findById(id);
    if (!log) {
      return;
    }

    // Use WatermelonDB's write transaction for atomic cascade deletion
    await this.database.write(async () => {
      // Delete all child performed groups first through their repository (cascade deletion)
      for (const performedGroup of log.performedGroups) {
        await this.performedGroupRepository.delete(performedGroup.id, true);
      }

      // Delete the workout log aggregate root
      await this.database.workoutLogs.delete(id);
    });
  }
}
