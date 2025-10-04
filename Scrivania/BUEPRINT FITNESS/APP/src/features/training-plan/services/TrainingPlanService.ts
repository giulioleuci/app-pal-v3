import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { ITrainingCycleRepository } from '@/features/training-plan/domain/ITrainingCycleRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { TrainingCycleModel } from '@/features/training-plan/domain/TrainingCycleModel';
import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating training plan and cycle operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to training plan and cycle management including
 * creation, retrieval, updates, archiving, and cascading deletions.
 */
@injectable()
export class TrainingPlanService {
  constructor(
    @inject('ITrainingPlanRepository')
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('ITrainingCycleRepository')
    private readonly trainingCycleRepository: ITrainingCycleRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Creates a new training plan for a specific profile.
   * @param profileId The profile ID to create the plan for
   * @param name The name of the training plan
   * @param description Optional description of the training plan
   * @param cycleId Optional training cycle ID to associate with the plan
   * @returns A Result containing the created TrainingPlanModel or an error
   */
  async createTrainingPlan(
    profileId: string,
    name: string,
    description?: string,
    cycleId?: string
  ): Promise<Result<TrainingPlanModel, ApplicationError>> {
    try {
      this.logger.info('Creating new training plan', { profileId, name, cycleId });

      // Validate cycle exists if provided
      if (cycleId) {
        const cycle = await this.trainingCycleRepository.findById(cycleId);
        if (!cycle) {
          this.logger.warn('Training cycle not found for plan creation', { cycleId });
          return Result.failure(new NotFoundError('Training cycle not found'));
        }
      }

      const planData = {
        id: crypto.randomUUID(),
        profileId,
        name,
        description,
        sessionIds: [],
        isArchived: false,
        currentSessionIndex: 0,
        cycleId: cycleId || null,
        order: cycleId ? 1 : undefined, // Add order when cycleId is provided
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const plan = TrainingPlanModel.hydrate(planData, []);
      const validation = plan.validate();

      if (!validation.success) {
        this.logger.error('Training plan validation failed', undefined, {
          profileId,
          name,
          errors: validation.error.issues,
        });
        return Result.failure(
          new ApplicationError('Training plan validation failed', validation.error.issues)
        );
      }

      const savedPlan = await this.trainingPlanRepository.save(plan);

      this.logger.info('Training plan created successfully', {
        planId: savedPlan.id,
        profileId: savedPlan.profileId,
        name: savedPlan.name,
      });

      return Result.success(savedPlan);
    } catch (_error) {
      this.logger.error('Failed to create training plan', _error as Error, {
        profileId,
        name,
        cycleId,
      });
      return Result.failure(new ApplicationError('Failed to create training plan', _error));
    }
  }

  /**
   * Creates a new training cycle for a specific profile.
   * @param profileId The profile ID to create the cycle for
   * @param name The name of the training cycle
   * @param startDate The start date of the cycle
   * @param endDate The end date of the cycle
   * @param goal The goal type for this cycle
   * @param notes Optional notes for the cycle
   * @returns A Result containing the created TrainingCycleModel or an error
   */
  async createTrainingCycle(
    profileId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    goal: string,
    notes?: string
  ): Promise<Result<TrainingCycleModel, ApplicationError>> {
    try {
      this.logger.info('Creating new training cycle', { profileId, name, goal });

      const cycleData = {
        id: crypto.randomUUID(),
        profileId,
        name,
        startDate,
        endDate,
        goal: goal as any, // Cast to TrainingCycleGoal type
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cycle = TrainingCycleModel.hydrate(cycleData);
      const validation = cycle.validate();

      if (!validation.success) {
        this.logger.error('Training cycle validation failed', undefined, {
          profileId,
          name,
          goal,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Training cycle validation failed', validation.error.errors)
        );
      }

      const savedCycle = await this.trainingCycleRepository.save(cycle);

      this.logger.info('Training cycle created successfully', {
        cycleId: savedCycle.id,
        profileId: savedCycle.profileId,
        name: savedCycle.name,
      });

      return Result.success(savedCycle);
    } catch (_error) {
      this.logger.error('Failed to create training cycle', _error as Error, {
        profileId,
        name,
        goal,
      });
      return Result.failure(new ApplicationError('Failed to create training cycle', _error));
    }
  }

  /**
   * Retrieves a training plan by its unique identifier.
   * @param planId The training plan ID to search for
   * @returns A Result containing the TrainingPlanModel or an error
   */
  async getTrainingPlan(planId: string): Promise<Result<TrainingPlanModel, ApplicationError>> {
    try {
      this.logger.info('Retrieving training plan', { planId });

      const plan = await this.trainingPlanRepository.findById(planId);
      if (!plan) {
        this.logger.warn('Training plan not found', { planId });
        return Result.failure(new NotFoundError('Training plan not found'));
      }

      this.logger.info('Training plan retrieved successfully', { planId });
      return Result.success(plan);
    } catch (_error) {
      this.logger.error('Failed to retrieve training plan', _error as Error, { planId });
      return Result.failure(new ApplicationError('Failed to retrieve training plan', _error));
    }
  }

  /**
   * Retrieves a training cycle by its unique identifier.
   * @param cycleId The training cycle ID to search for
   * @returns A Result containing the TrainingCycleModel or an error
   */
  async getTrainingCycle(cycleId: string): Promise<Result<TrainingCycleModel, ApplicationError>> {
    try {
      this.logger.info('Retrieving training cycle', { cycleId });

      const cycle = await this.trainingCycleRepository.findById(cycleId);
      if (!cycle) {
        this.logger.warn('Training cycle not found', { cycleId });
        return Result.failure(new NotFoundError('Training cycle not found'));
      }

      this.logger.info('Training cycle retrieved successfully', { cycleId });
      return Result.success(cycle);
    } catch (_error) {
      this.logger.error('Failed to retrieve training cycle', _error as Error, { cycleId });
      return Result.failure(new ApplicationError('Failed to retrieve training cycle', _error));
    }
  }

  /**
   * Retrieves all training plans for a specific profile.
   * @param profileId The profile ID to get plans for
   * @param filters Optional filters for archived status and cycle ID
   * @returns A Result containing an array of TrainingPlanModels or an error
   */
  async getTrainingPlans(
    profileId: string,
    filters?: { isArchived?: boolean; cycleId?: string }
  ): Promise<Result<TrainingPlanModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving training plans', { profileId, filters });

      const plans = await this.trainingPlanRepository.findAll(profileId, filters);

      this.logger.info('Training plans retrieved successfully', {
        profileId,
        count: plans.length,
        filters,
      });

      return Result.success(plans);
    } catch (_error) {
      this.logger.error('Failed to retrieve training plans', _error as Error, {
        profileId,
        filters,
      });
      return Result.failure(new ApplicationError('Failed to retrieve training plans', _error));
    }
  }

  /**
   * Retrieves all training cycles for a specific profile.
   * @param profileId The profile ID to get cycles for
   * @returns A Result containing an array of TrainingCycleModels or an error
   */
  async getTrainingCycles(
    profileId: string
  ): Promise<Result<TrainingCycleModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving training cycles', { profileId });

      const cycles = await this.trainingCycleRepository.findAll(profileId);

      this.logger.info('Training cycles retrieved successfully', {
        profileId,
        count: cycles.length,
      });

      return Result.success(cycles);
    } catch (_error) {
      this.logger.error('Failed to retrieve training cycles', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve training cycles', _error));
    }
  }

  /**
   * Updates a training plan's basic information.
   * @param planId The training plan ID to update
   * @param updates Object containing the fields to update
   * @returns A Result containing the updated TrainingPlanModel or an error
   */
  async updateTrainingPlan(
    planId: string,
    updates: {
      name?: string;
      description?: string;
      notes?: string;
      cycleId?: string | null;
    }
  ): Promise<Result<TrainingPlanModel, ApplicationError>> {
    try {
      this.logger.info('Updating training plan', { planId, updates });

      const plan = await this.trainingPlanRepository.findById(planId);
      if (!plan) {
        this.logger.warn('Training plan not found for update', { planId });
        return Result.failure(new NotFoundError('Training plan not found'));
      }

      // Validate cycle exists if provided
      if (updates.cycleId) {
        const cycle = await this.trainingCycleRepository.findById(updates.cycleId);
        if (!cycle) {
          this.logger.warn('Training cycle not found for plan update', {
            cycleId: updates.cycleId,
          });
          return Result.failure(new NotFoundError('Training cycle not found'));
        }
      }

      let updatedPlan = plan;

      // Update name and description using the available method
      if (updates.name !== undefined || updates.description !== undefined) {
        const detailsUpdate: { name?: string; description?: string } = {};
        if (updates.name !== undefined) detailsUpdate.name = updates.name;
        if (updates.description !== undefined) detailsUpdate.description = updates.description;
        updatedPlan = updatedPlan.cloneWithUpdatedDetails(detailsUpdate);
      }

      // Handle cycle assignment/removal
      if (updates.cycleId !== undefined) {
        if (updates.cycleId === null) {
          updatedPlan = updatedPlan.cloneWithRemovedCycle();
        } else {
          updatedPlan = updatedPlan.cloneWithAssignedCycle(updates.cycleId);
        }
      }

      // Notes would need to be handled through createUpdatedInstance if not available as a method
      if (updates.notes !== undefined) {
        // Since there's no specific clone method for notes, we'll need to use the private method
        // This suggests we should add the notes field to the cloneWithUpdatedDetails method
        // For now, we'll create a workaround
        const currentData = updatedPlan.toPlainObject();
        updatedPlan = TrainingPlanModel.hydrate(
          { ...currentData, notes: updates.notes, updatedAt: new Date() },
          updatedPlan.sessions
        );
      }

      const validation = updatedPlan.validate();
      if (!validation.success) {
        this.logger.error('Updated training plan validation failed', undefined, {
          planId,
          updates,
          errors: validation.error.issues,
        });
        return Result.failure(
          new ApplicationError('Training plan validation failed', validation.error.issues)
        );
      }

      const savedPlan = await this.trainingPlanRepository.save(updatedPlan);

      this.logger.info('Training plan updated successfully', {
        planId: savedPlan.id,
        updates,
      });

      return Result.success(savedPlan);
    } catch (_error) {
      this.logger.error('Failed to update training plan', _error as Error, { planId, updates });
      return Result.failure(new ApplicationError('Failed to update training plan', _error));
    }
  }

  /**
   * Updates a training cycle's basic information.
   * @param cycleId The training cycle ID to update
   * @param updates Object containing the fields to update
   * @returns A Result containing the updated TrainingCycleModel or an error
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
  ): Promise<Result<TrainingCycleModel, ApplicationError>> {
    try {
      this.logger.info('Updating training cycle', { cycleId, updates });

      const cycle = await this.trainingCycleRepository.findById(cycleId);
      if (!cycle) {
        this.logger.warn('Training cycle not found for update', { cycleId });
        return Result.failure(new NotFoundError('Training cycle not found'));
      }

      let updatedCycle = cycle;

      // Update name and goal using the available method
      const detailsUpdate: { name?: string; goal?: any } = {};
      if (updates.name !== undefined) detailsUpdate.name = updates.name;
      if (updates.goal !== undefined) detailsUpdate.goal = updates.goal as any;

      if (updates.name !== undefined || updates.goal !== undefined) {
        updatedCycle = updatedCycle.cloneWithUpdatedDetails(detailsUpdate);
      }

      // Update dates using the available method
      if (updates.startDate !== undefined || updates.endDate !== undefined) {
        const startDate = updates.startDate || cycle.startDate;
        const endDate = updates.endDate || cycle.endDate;
        updatedCycle = updatedCycle.cloneWithNewDates(startDate, endDate);
      }

      // Notes would need to be handled through createUpdatedInstance if not available as a method
      if (updates.notes !== undefined) {
        const currentData = updatedCycle.toPlainObject();
        updatedCycle = TrainingCycleModel.hydrate({
          ...currentData,
          notes: updates.notes,
          updatedAt: new Date(),
        });
      }

      const validation = updatedCycle.validate();
      if (!validation.success) {
        this.logger.error('Updated training cycle validation failed', undefined, {
          cycleId,
          updates,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Training cycle validation failed', validation.error.errors)
        );
      }

      const savedCycle = await this.trainingCycleRepository.save(updatedCycle);

      this.logger.info('Training cycle updated successfully', {
        cycleId: savedCycle.id,
        updates,
      });

      return Result.success(savedCycle);
    } catch (_error) {
      this.logger.error('Failed to update training cycle', _error as Error, { cycleId, updates });
      return Result.failure(new ApplicationError('Failed to update training cycle', _error));
    }
  }

  /**
   * Archives a training plan (soft delete).
   * @param planId The training plan ID to archive
   * @returns A Result containing the archived TrainingPlanModel or an error
   */
  async archiveTrainingPlan(planId: string): Promise<Result<TrainingPlanModel, ApplicationError>> {
    try {
      this.logger.info('Archiving training plan', { planId });

      const plan = await this.trainingPlanRepository.findById(planId);
      if (!plan) {
        this.logger.warn('Training plan not found for archiving', { planId });
        return Result.failure(new NotFoundError('Training plan not found'));
      }

      const archivedPlan = plan.cloneAsArchived();
      const savedPlan = await this.trainingPlanRepository.save(archivedPlan);

      this.logger.info('Training plan archived successfully', { planId });
      return Result.success(savedPlan);
    } catch (_error) {
      this.logger.error('Failed to archive training plan', _error as Error, { planId });
      return Result.failure(new ApplicationError('Failed to archive training plan', _error));
    }
  }

  /**
   * Permanently deletes a training plan from the system.
   * This operation cascades to delete all child entities (sessions, exercise groups, applied exercises).
   * @param planId The training plan ID to delete
   * @param deleteChildren Whether to delete all child entities (defaults to true)
   * @returns A Result indicating success or failure
   */
  async deleteTrainingPlan(
    planId: string,
    deleteChildren: boolean = true
  ): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting training plan', { planId, deleteChildren });

      const plan = await this.trainingPlanRepository.findById(planId);
      if (!plan) {
        this.logger.warn('Training plan not found for deletion', { planId });
        return Result.failure(new NotFoundError('Training plan not found'));
      }

      await this.trainingPlanRepository.delete(planId);

      this.logger.info('Training plan deleted successfully', { planId, deleteChildren });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete training plan', _error as Error, {
        planId,
        deleteChildren,
      });
      return Result.failure(new ApplicationError('Failed to delete training plan', _error));
    }
  }

  /**
   * Permanently deletes a training cycle from the system.
   * This operation also removes the cycle association from any related training plans.
   * @param cycleId The training cycle ID to delete
   * @returns A Result indicating success or failure
   */
  async deleteTrainingCycle(cycleId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting training cycle', { cycleId });

      const cycle = await this.trainingCycleRepository.findById(cycleId);
      if (!cycle) {
        this.logger.warn('Training cycle not found for deletion', { cycleId });
        return Result.failure(new NotFoundError('Training cycle not found'));
      }

      // Find and update any plans that reference this cycle
      const plansInCycle = await this.trainingPlanRepository.findAll(cycle.profileId, {
        cycleId,
      });

      for (const plan of plansInCycle) {
        const updatedPlan = plan.cloneWithRemovedCycle();
        await this.trainingPlanRepository.save(updatedPlan);
      }

      await this.trainingCycleRepository.delete(cycleId);

      this.logger.info('Training cycle deleted successfully', {
        cycleId,
        affectedPlans: plansInCycle.length,
      });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete training cycle', _error as Error, { cycleId });
      return Result.failure(new ApplicationError('Failed to delete training cycle', _error));
    }
  }
}
