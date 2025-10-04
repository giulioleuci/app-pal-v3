import type { Query } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { TrainingCycle } from '@/app/db/model/TrainingCycle';
import { TrainingPlan } from '@/app/db/model/TrainingPlan';
import {
  TrainingCycleModel,
  TrainingPlanModel,
  TrainingPlanService,
} from '@/features/training-plan/services';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Query service that acts as an adapter between the Training Plan Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the TrainingPlanService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all training plan and cycle-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class TrainingPlanQueryService {
  constructor(
    @inject(TrainingPlanService) private readonly trainingPlanService: TrainingPlanService
  ) {}

  /**
   * Creates a new training plan for a specific profile.
   * @param profileId The profile ID to create the plan for
   * @param name The name of the training plan
   * @param description Optional description of the training plan
   * @param cycleId Optional training cycle ID to associate with the plan
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created TrainingPlanModel
   */
  async createTrainingPlan(
    profileId: string,
    name: string,
    description?: string,
    cycleId?: string
  ): Promise<TrainingPlanModel> {
    const result = await this.trainingPlanService.createTrainingPlan(
      profileId,
      name,
      description,
      cycleId
    );
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Creates a new training cycle for a specific profile.
   * @param profileId The profile ID to create the cycle for
   * @param name The name of the training cycle
   * @param startDate The start date of the cycle
   * @param endDate The end date of the cycle
   * @param goal The goal type for this cycle
   * @param notes Optional notes for the cycle
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created TrainingCycleModel
   */
  async createTrainingCycle(
    profileId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    goal: string,
    notes?: string
  ): Promise<TrainingCycleModel> {
    const result = await this.trainingPlanService.createTrainingCycle(
      profileId,
      name,
      startDate,
      endDate,
      goal,
      notes
    );
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves a training plan by its unique identifier.
   * @param planId The training plan ID to search for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the TrainingPlanModel
   */
  async getTrainingPlan(planId: string): Promise<TrainingPlanModel> {
    const result = await this.trainingPlanService.getTrainingPlan(planId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Gets a WatermelonDB query for a specific training plan by ID.
   * @param planId The training plan ID to observe
   * @returns Query for TrainingPlan model for reactive observation
   */
  getTrainingPlanQuery(planId: string): Query<TrainingPlan> {
    const collection = database.get<TrainingPlan>('training_plans');
    return collection.query(Q.where('id', planId));
  }

  /**
   * Retrieves a training cycle by its unique identifier.
   * @param cycleId The training cycle ID to search for
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the TrainingCycleModel
   */
  async getTrainingCycle(cycleId: string): Promise<TrainingCycleModel> {
    const result = await this.trainingPlanService.getTrainingCycle(cycleId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Gets a WatermelonDB query for a specific training cycle by ID.
   * @param cycleId The training cycle ID to observe
   * @returns Query for TrainingCycle model for reactive observation
   */
  getTrainingCycleQuery(cycleId: string): Query<TrainingCycle> {
    const collection = database.get<TrainingCycle>('training_cycles');
    return collection.query(Q.where('id', cycleId));
  }

  /**
   * Retrieves all training plans for a specific profile.
   * @param profileId The profile ID to get plans for
   * @param filters Optional filters for archived status and cycle ID
   * @throws {ApplicationError} When the operation fails
   * @returns Query for TrainingPlan models for reactive observation
   */
  getTrainingPlans(
    profileId: string,
    filters?: { isArchived?: boolean; cycleId?: string }
  ): Query<TrainingPlan> {
    const collection = database.get<TrainingPlan>('training_plans');

    const clauses = [Q.where('profile_id', profileId)];

    if (filters?.isArchived !== undefined) {
      clauses.push(Q.where('is_archived', filters.isArchived));
    }

    if (filters?.cycleId) {
      clauses.push(Q.where('cycle_id', filters.cycleId));
    }

    return collection.query(...clauses);
  }

  /**
   * Retrieves all training cycles for a specific profile.
   * @param profileId The profile ID to get cycles for
   * @throws {ApplicationError} When the operation fails
   * @returns Query for TrainingCycle models for reactive observation
   */
  getTrainingCycles(profileId: string): Query<TrainingCycle> {
    const collection = database.get<TrainingCycle>('training_cycles');
    return collection.query(Q.where('profile_id', profileId));
  }

  /**
   * Updates a training plan's basic information.
   * @param planId The training plan ID to update
   * @param updates Object containing the fields to update
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated TrainingPlanModel
   */
  async updateTrainingPlan(
    planId: string,
    updates: {
      name?: string;
      description?: string;
      notes?: string;
      cycleId?: string | null;
    }
  ): Promise<TrainingPlanModel> {
    const result = await this.trainingPlanService.updateTrainingPlan(planId, updates);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Updates a training cycle's basic information.
   * @param cycleId The training cycle ID to update
   * @param updates Object containing the fields to update
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated TrainingCycleModel
   */
  async updateTrainingCycle(
    cycleId: string,
    updates: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
      goal?: string;
      notes?: string;
    }
  ): Promise<TrainingCycleModel> {
    const result = await this.trainingPlanService.updateTrainingCycle(cycleId, updates);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Archives a training plan (soft delete).
   * @param planId The training plan ID to archive
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the archived TrainingPlanModel
   */
  async archiveTrainingPlan(planId: string): Promise<TrainingPlanModel> {
    const result = await this.trainingPlanService.archiveTrainingPlan(planId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Permanently deletes a training plan from the system.
   * This operation cascades to delete all child entities (sessions, exercise groups, applied exercises).
   * @param planId The training plan ID to delete
   * @param options Options object containing deleteChildren flag
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteTrainingPlan(planId: string, options: { deleteChildren: boolean }): Promise<void> {
    const result = await this.trainingPlanService.deleteTrainingPlan(
      planId,
      options.deleteChildren
    );
    if (result.isFailure) {
      throw result.error;
    }
  }

  /**
   * Permanently deletes a training cycle from the system.
   * This operation also removes the cycle association from any related training plans.
   * @param cycleId The training cycle ID to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteTrainingCycle(cycleId: string): Promise<void> {
    const result = await this.trainingPlanService.deleteTrainingCycle(cycleId);
    if (result.isFailure) {
      throw result.error;
    }
  }
}
