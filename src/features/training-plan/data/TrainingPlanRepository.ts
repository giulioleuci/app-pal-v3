import { inject, injectable } from 'tsyringe';

import { type BlueprintFitnessDB, database, db } from '@/app/db/database';
import { ConflictError } from '@/shared/errors/ConflictError';

import { ITrainingPlanRepository } from '../domain/ITrainingPlanRepository';
import { IWorkoutSessionRepository } from '../domain/IWorkoutSessionRepository';
import { TrainingPlanModel } from '../domain/TrainingPlanModel';

/**
 * Concrete implementation of ITrainingPlanRepository using WatermelonDB.
 * Handles persistence and retrieval of TrainingPlan domain models as aggregate roots.
 * Self-assembles the full aggregate by injecting child repository interfaces and
 * orchestrates the assembly of all child entities (sessions and their hierarchies).
 *
 * This repository acts as a pure data mapper, delegating hydration to the model's
 * static hydrate method and dehydration to toPlainObject. All write operations
 * are wrapped in atomic transactions to ensure data integrity.
 */
@injectable()
export class TrainingPlanRepository implements ITrainingPlanRepository {
  private readonly database: BlueprintFitnessDB;

  /**
   * Creates a new TrainingPlanRepository instance.
   * @param sessionRepository Repository for fetching workout sessions
   * @param database Optional database instance for dependency injection and testability
   */
  constructor(
    @inject('IWorkoutSessionRepository') private sessionRepository: IWorkoutSessionRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  ) {
    this.database = database;
  }

  /**
   * Persists a TrainingPlanModel aggregate to the database by dehydrating it to plain data
   * using the model's toPlainObject method. Also persists all child entities (sessions)
   * in an atomic transaction to maintain consistency across the entire aggregate.
   *
   * The dehydration process extracts the core training plan data and session IDs,
   * then delegates the persistence of child sessions to the injected session repository.
   *
   * @param plan The TrainingPlanModel aggregate instance to save
   * @returns Promise resolving to the saved TrainingPlanModel aggregate
   */
  async save(plan: TrainingPlanModel): Promise<TrainingPlanModel> {
    // Check for name conflicts OUTSIDE the transaction first
    const existingPlans = await this.database.trainingPlans
      .where('profileId')
      .equals(plan.profileId)
      .toArray();

    const conflictingPlans = existingPlans.filter(
      (existingPlan) => existingPlan.name === plan.name && existingPlan.id !== plan.id
    );

    console.log('Conflict check (outside transaction):', {
      planId: plan.id,
      planName: plan.name,
      profileId: plan.profileId,
      existingPlansCount: conflictingPlans.length,
      existingPlans: conflictingPlans.map((p) => ({ id: p.id, name: p.name })),
    });

    if (conflictingPlans.length > 0) {
      throw new ConflictError('errors.training-plan.name-already-exists' as any);
    }

    // Use WatermelonDB's write transaction for atomic operations
    await this.database.write(async () => {
      // Dehydrate and save the training plan aggregate root
      const planData = plan.toPlainObject();
      await this.database.trainingPlans.put(planData);

      // Save all child sessions through their repository in deep transactional writes
      for (const session of plan.sessions) {
        await this.sessionRepository.save(session, true);
      }
    });

    return plan;
  }

  /**
   * Retrieves a training plan by ID and hydrates it into a TrainingPlanModel aggregate
   * using the model's static hydrate method. Orchestrates the assembly of the complete
   * domain model by fetching all child entities through injected child repositories.
   *
   * The internal assembly process fetches the top-level training plan data, then uses
   * eager loading to fetch all descendant records (sessions, groups, exercises) for
   * full hydration of the domain model.
   *
   * @param id The training plan ID to find
   * @returns Promise resolving to TrainingPlanModel if found, undefined otherwise
   */
  async findById(id: string): Promise<TrainingPlanModel | undefined> {
    const planData = await this.database.trainingPlans.get(id);
    if (!planData) {
      return undefined;
    }

    // Eagerly fetch all sessions for this training plan through child repository
    // This will trigger deep loading of all descendant entities (sessions -> groups -> exercises)
    const sessions = await this.sessionRepository.findByIds(planData.sessionIds);

    // Delegate hydration to the domain model's static method
    return TrainingPlanModel.hydrate(planData, sessions);
  }

  /**
   * Retrieves training plans for a profile with optional filtering and hydrates them
   * into TrainingPlanModel aggregates using the model's static hydrate method.
   * Orchestrates the assembly of multiple complete domain models by batch-fetching
   * child entities through injected repositories for optimal performance.
   *
   * The internal assembly process applies filters to the query, batch-fetches all
   * required sessions with eager loading, and efficiently maps them back to their parent plans.
   *
   * @param profileId The profile ID to find training plans for
   * @param filters Optional filters for archived status and cycle assignment
   * @returns Promise resolving to array of TrainingPlanModel aggregates
   */
  async findAll(
    profileId: string,
    filters?: { isArchived?: boolean; cycleId?: string }
  ): Promise<TrainingPlanModel[]> {
    // Build the query with filters
    let plansData = await this.database.trainingPlans
      .where('profileId')
      .equals(profileId)
      .toArray();

    // Apply client-side filters (WatermelonDB query builder limitations)
    if (filters?.isArchived !== undefined) {
      plansData = plansData.filter((plan) => plan.isArchived === filters.isArchived);
    }

    if (filters?.cycleId) {
      plansData = plansData.filter((plan) => plan.cycleId === filters.cycleId);
    }

    if (plansData.length === 0) {
      return [];
    }

    // Collect all session IDs from all training plans for batch fetching
    const allSessionIds = plansData.flatMap((plan) => plan.sessionIds);
    const allSessions = await this.sessionRepository.findByIds(allSessionIds);

    // Group sessions by their IDs for efficient lookup during hydration
    const sessionsById = new Map(allSessions.map((session) => [session.id, session]));

    // Hydrate each training plan with its corresponding sessions
    return plansData.map((planData) => {
      const planSessions = planData.sessionIds
        .map((sessionId) => sessionsById.get(sessionId))
        .filter((session) => session !== undefined);

      return TrainingPlanModel.hydrate(planData, planSessions);
    });
  }

  /**
   * Deletes a training plan by ID from the database along with all its child entities
   * in an atomic transaction. Ensures cascade deletion of all sessions and their
   * hierarchies through the injected child repositories.
   *
   * @param id The training plan ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    const plan = await this.findById(id);
    if (!plan) {
      return;
    }

    // Use WatermelonDB's write transaction for atomic cascade deletion
    await this.database.write(async () => {
      // Delete all child sessions first through their repository (cascade deletion)
      for (const session of plan.sessions) {
        await this.sessionRepository.delete(session.id, true);
      }

      // Delete the training plan aggregate root
      await this.database.trainingPlans.delete(id);
    });
  }
}
