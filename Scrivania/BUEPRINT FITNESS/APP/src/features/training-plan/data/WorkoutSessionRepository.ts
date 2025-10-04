import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, db } from '@/app/db/database';

import { IAppliedExerciseRepository } from '../domain/IAppliedExerciseRepository';
import { IExerciseGroupRepository } from '../domain/IExerciseGroupRepository';
import { IWorkoutSessionRepository } from '../domain/IWorkoutSessionRepository';
import { SessionModel } from '../domain/SessionModel';

/**
 * Concrete implementation of IWorkoutSessionRepository using WatermelonDB.
 * Handles persistence and retrieval of WorkoutSession domain models by delegating
 * hydration to the model's static hydrate method and dehydration to toPlainObject.
 * Self-assembles the full aggregate by injecting child repository interfaces.
 */
@injectable()
export class WorkoutSessionRepository implements IWorkoutSessionRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new WorkoutSessionRepository instance.
   * @param exerciseGroupRepo Repository for fetching exercise groups
   * @param appliedExerciseRepo Repository for fetching applied exercises
   * @param db Optional database instance for dependency injection and testability
   */
  constructor(
    @inject('IExerciseGroupRepository') private exerciseGroupRepo: IExerciseGroupRepository,
    @inject('IAppliedExerciseRepository') private appliedExerciseRepo: IAppliedExerciseRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  ) {
    this.database = database;
  }

  /**
   * Persists a SessionModel to the database by converting it to plain data
   * using the model's toPlainObject method. Also persists all child entities
   * (groups and applied exercises) in an atomic transaction.
   * @param session The SessionModel instance to save
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving to the saved SessionModel
   */
  async save(session: SessionModel, inTransaction: boolean = false): Promise<SessionModel> {
    const saveOperation = async () => {
      // Save the session
      const sessionData = session.toPlainObject();
      await this.database.workoutSessions.put(sessionData);

      // Save all groups - pass transaction context to avoid nested writes
      for (const group of session.groups) {
        await this.exerciseGroupRepo.save(group, true);
      }
    };

    if (inTransaction) {
      // Already in a transaction, execute directly
      await saveOperation();
    } else {
      // Start new transaction
      await this.database.write(saveOperation);
    }

    return session;
  }

  /**
   * Retrieves a workout session by ID and hydrates it into a SessionModel
   * using the model's static hydrate method. Fetches and assembles all child entities.
   * @param id The session ID to find
   * @returns Promise resolving to SessionModel if found, undefined otherwise
   */
  async findById(id: string): Promise<SessionModel | undefined> {
    const sessionData = await this.database.workoutSessions.get(id);
    if (!sessionData) {
      return undefined;
    }

    // Fetch all exercise groups for this session
    const groups = await this.exerciseGroupRepo.findByIds(sessionData.groupIds);

    return SessionModel.hydrate(sessionData, groups);
  }

  /**
   * Retrieves multiple workout sessions by their IDs and hydrates them into SessionModels
   * using the model's static hydrate method.
   * @param ids Array of session IDs to find
   * @returns Promise resolving to array of SessionModels
   */
  async findByIds(ids: string[]): Promise<SessionModel[]> {
    const sessionsData = await this.database.workoutSessions.bulkGet(ids);
    const validSessionsData = sessionsData.filter((data) => data !== undefined);

    if (validSessionsData.length === 0) {
      return [];
    }

    // Collect all group IDs from all sessions
    const allGroupIds = validSessionsData.flatMap((session) => session.groupIds);
    const allGroups = await this.exerciseGroupRepo.findByIds(allGroupIds);

    // Group the groups by their IDs for quick lookup
    const groupsById = new Map(allGroups.map((group) => [group.id, group]));

    // Hydrate each session with its corresponding groups
    return validSessionsData.map((sessionData) => {
      const sessionGroups = sessionData.groupIds
        .map((groupId) => groupsById.get(groupId))
        .filter((group) => group !== undefined);

      return SessionModel.hydrate(sessionData, sessionGroups);
    });
  }

  /**
   * Retrieves all workout sessions for a profile ID and hydrates them into SessionModels
   * using the model's static hydrate method.
   * @param profileId The profile ID to find sessions for
   * @returns Promise resolving to array of SessionModels
   */
  async findAll(profileId: string): Promise<SessionModel[]> {
    const sessionsData = await this.database.workoutSessions
      .where('profileId')
      .equals(profileId)
      .toArray();

    if (sessionsData.length === 0) {
      return [];
    }

    // Collect all group IDs from all sessions
    const allGroupIds = sessionsData.flatMap((session) => session.groupIds);
    const allGroups = await this.exerciseGroupRepo.findByIds(allGroupIds);

    // Group the groups by their IDs for quick lookup
    const groupsById = new Map(allGroups.map((group) => [group.id, group]));

    // Hydrate each session with its corresponding groups
    return sessionsData.map((sessionData) => {
      const sessionGroups = sessionData.groupIds
        .map((groupId) => groupsById.get(groupId))
        .filter((group) => group !== undefined);

      return SessionModel.hydrate(sessionData, sessionGroups);
    });
  }

  /**
   * Deletes a workout session by ID from the database, along with all its child entities.
   * @param id The session ID to delete
   * @param inTransaction Whether this is being called from within an existing transaction
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, inTransaction: boolean = false): Promise<void> {
    const session = await this.findById(id);
    if (!session) {
      return;
    }

    const deleteOperation = async () => {
      // Delete all child entities first - pass transaction context to avoid nested writes
      for (const group of session.groups) {
        await this.exerciseGroupRepo.delete(group.id, true);
      }

      // Delete the session
      await this.database.workoutSessions.delete(id);
    };

    if (inTransaction) {
      // Already in a transaction, execute directly
      await deleteOperation();
    } else {
      // Start new transaction
      await this.database.write(deleteOperation);
    }
  }
}
