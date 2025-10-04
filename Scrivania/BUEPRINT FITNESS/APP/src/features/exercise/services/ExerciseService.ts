import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { IExerciseRepository } from '@/features/exercise/domain/IExerciseRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { type ExerciseData } from '@/shared/types';
import { Result } from '@/shared/utils/Result';

/**
 * Application service responsible for orchestrating exercise-related operations.
 * This service acts as a stateless coordinator between the domain layer and persistence layer,
 * handling all use cases related to exercise management.
 */
@injectable()
export class ExerciseService {
  constructor(
    @inject('IExerciseRepository') private readonly exerciseRepository: IExerciseRepository,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  /**
   * Creates a new exercise for a profile.
   * @param exerciseData The exercise data to create
   * @returns A Result containing the created ExerciseModel or an error
   */
  async createExercise(
    exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<ExerciseModel, ApplicationError>> {
    try {
      this.logger.info('Creating new exercise', {
        profileId: exerciseData.profileId,
        name: exerciseData.name,
        category: exerciseData.category,
      });

      const completeExerciseData: ExerciseData = {
        ...exerciseData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const exercise = ExerciseModel.hydrate(completeExerciseData);
      const validation = exercise.validate();

      if (!validation.success) {
        this.logger.error('Exercise validation failed', undefined, {
          profileId: exerciseData.profileId,
          name: exerciseData.name,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Exercise validation failed', validation.error.errors)
        );
      }

      const savedExercise = await this.exerciseRepository.save(exercise);

      this.logger.info('Exercise created successfully', {
        exerciseId: savedExercise.id,
        profileId: savedExercise.profileId,
        name: savedExercise.name,
      });

      return Result.success(savedExercise);
    } catch (_error) {
      this.logger.error('Failed to create exercise', _error as Error, {
        profileId: exerciseData.profileId,
        name: exerciseData.name,
      });
      return Result.failure(new ApplicationError('Failed to create exercise', _error));
    }
  }

  /**
   * Retrieves an exercise by its ID for a specific profile.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to search for
   * @returns A Result containing the ExerciseModel or an error
   */
  async getExercise(
    profileId: string,
    exerciseId: string
  ): Promise<Result<ExerciseModel, ApplicationError>> {
    try {
      this.logger.info('Retrieving exercise', { profileId, exerciseId });

      const exercise = await this.exerciseRepository.findById(profileId, exerciseId);
      if (!exercise) {
        this.logger.warn('Exercise not found', { profileId, exerciseId });
        return Result.failure(new NotFoundError('Exercise not found'));
      }

      this.logger.info('Exercise retrieved successfully', { profileId, exerciseId });
      return Result.success(exercise);
    } catch (_error) {
      this.logger.error('Failed to retrieve exercise', _error as Error, { profileId, exerciseId });
      return Result.failure(new ApplicationError('Failed to retrieve exercise', _error));
    }
  }

  /**
   * Retrieves all exercises for a specific profile.
   * @param profileId The profile ID
   * @returns A Result containing an array of ExerciseModels or an error
   */
  async getAllExercises(profileId: string): Promise<Result<ExerciseModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving all exercises for profile', { profileId });

      const exercises = await this.exerciseRepository.findAll(profileId);

      this.logger.info('All exercises retrieved successfully', {
        profileId,
        count: exercises.length,
      });

      return Result.success(exercises);
    } catch (_error) {
      this.logger.error('Failed to retrieve all exercises', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to retrieve all exercises', _error));
    }
  }

  /**
   * Retrieves multiple exercises by their IDs for a specific profile.
   * @param profileId The profile ID
   * @param exerciseIds Array of exercise IDs to retrieve
   * @returns A Result containing an array of ExerciseModels or an error
   */
  async getExercisesByIds(
    profileId: string,
    exerciseIds: string[]
  ): Promise<Result<ExerciseModel[], ApplicationError>> {
    try {
      this.logger.info('Retrieving exercises by IDs', {
        profileId,
        exerciseIds,
        count: exerciseIds.length,
      });

      const exercises = await this.exerciseRepository.findByIds(profileId, exerciseIds);

      this.logger.info('Exercises retrieved successfully', {
        profileId,
        requested: exerciseIds.length,
        found: exercises.length,
      });

      return Result.success(exercises);
    } catch (_error) {
      this.logger.error('Failed to retrieve exercises by IDs', _error as Error, {
        profileId,
        exerciseIds,
      });
      return Result.failure(new ApplicationError('Failed to retrieve exercises by IDs', _error));
    }
  }

  /**
   * Updates an existing exercise.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to update
   * @param updates The updates to apply to the exercise
   * @returns A Result containing the updated ExerciseModel or an error
   */
  async updateExercise(
    profileId: string,
    exerciseId: string,
    updates: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<ExerciseModel, ApplicationError>> {
    try {
      this.logger.info('Updating exercise', { profileId, exerciseId, updates });

      const exercise = await this.exerciseRepository.findById(profileId, exerciseId);
      if (!exercise) {
        this.logger.warn('Exercise not found for update', { profileId, exerciseId });
        return Result.failure(new NotFoundError('Exercise not found'));
      }

      const updatedExercise = exercise.cloneWithUpdatedDetails(updates);
      const validation = updatedExercise.validate();

      if (!validation.success) {
        this.logger.error('Updated exercise validation failed', undefined, {
          profileId,
          exerciseId,
          updates,
          errors: validation.error.errors,
        });
        return Result.failure(
          new ApplicationError('Exercise validation failed', validation.error.errors)
        );
      }

      const savedExercise = await this.exerciseRepository.save(updatedExercise);

      this.logger.info('Exercise updated successfully', {
        exerciseId: savedExercise.id,
        profileId: savedExercise.profileId,
        name: savedExercise.name,
      });

      return Result.success(savedExercise);
    } catch (_error) {
      this.logger.error('Failed to update exercise', _error as Error, {
        profileId,
        exerciseId,
        updates,
      });
      return Result.failure(new ApplicationError('Failed to update exercise', _error));
    }
  }

  /**
   * Adds a substitution to an existing exercise.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to add substitution to
   * @param substituteExerciseId The ID of the substitute exercise
   * @param priority The priority of the substitution (1-5)
   * @param reason Optional reason for the substitution
   * @returns A Result containing the updated ExerciseModel or an error
   */
  async addSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string,
    priority: number,
    reason?: string
  ): Promise<Result<ExerciseModel, ApplicationError>> {
    try {
      this.logger.info('Adding exercise substitution', {
        profileId,
        exerciseId,
        substituteExerciseId,
        priority,
        reason,
      });

      const exercise = await this.exerciseRepository.findById(profileId, exerciseId);
      if (!exercise) {
        this.logger.warn('Exercise not found for substitution', { profileId, exerciseId });
        return Result.failure(new NotFoundError('Exercise not found'));
      }

      // Verify substitute exercise exists
      const substituteExercise = await this.exerciseRepository.findById(
        profileId,
        substituteExerciseId
      );
      if (!substituteExercise) {
        this.logger.warn('Substitute exercise not found', { profileId, substituteExerciseId });
        return Result.failure(new NotFoundError('Substitute exercise not found'));
      }

      const updatedExercise = exercise.cloneWithAddedSubstitution(
        substituteExerciseId,
        priority,
        reason
      );
      const savedExercise = await this.exerciseRepository.save(updatedExercise);

      this.logger.info('Exercise substitution added successfully', {
        exerciseId,
        substituteExerciseId,
        priority,
      });

      return Result.success(savedExercise);
    } catch (_error) {
      this.logger.error('Failed to add exercise substitution', _error as Error, {
        profileId,
        exerciseId,
        substituteExerciseId,
        priority,
      });
      return Result.failure(new ApplicationError('Failed to add exercise substitution', _error));
    }
  }

  /**
   * Removes a substitution from an existing exercise.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to remove substitution from
   * @param substituteExerciseId The ID of the substitute exercise to remove
   * @returns A Result containing the updated ExerciseModel or an error
   */
  async removeSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string
  ): Promise<Result<ExerciseModel, ApplicationError>> {
    try {
      this.logger.info('Removing exercise substitution', {
        profileId,
        exerciseId,
        substituteExerciseId,
      });

      const exercise = await this.exerciseRepository.findById(profileId, exerciseId);
      if (!exercise) {
        this.logger.warn('Exercise not found for substitution removal', { profileId, exerciseId });
        return Result.failure(new NotFoundError('Exercise not found'));
      }

      const updatedExercise = exercise.cloneWithRemovedSubstitution(substituteExerciseId);
      const savedExercise = await this.exerciseRepository.save(updatedExercise);

      this.logger.info('Exercise substitution removed successfully', {
        exerciseId,
        substituteExerciseId,
      });

      return Result.success(savedExercise);
    } catch (_error) {
      this.logger.error('Failed to remove exercise substitution', _error as Error, {
        profileId,
        exerciseId,
        substituteExerciseId,
      });
      return Result.failure(new ApplicationError('Failed to remove exercise substitution', _error));
    }
  }

  /**
   * Permanently deletes an exercise from the system.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to delete
   * @returns A Result indicating success or failure
   */
  async deleteExercise(
    profileId: string,
    exerciseId: string
  ): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Deleting exercise permanently', { profileId, exerciseId });

      const exercise = await this.exerciseRepository.findById(profileId, exerciseId);
      if (!exercise) {
        this.logger.warn('Exercise not found for deletion', { profileId, exerciseId });
        return Result.failure(new NotFoundError('Exercise not found'));
      }

      await this.exerciseRepository.delete(profileId, exerciseId);

      this.logger.info('Exercise deleted successfully', { profileId, exerciseId });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete exercise', _error as Error, { profileId, exerciseId });
      return Result.failure(new ApplicationError('Failed to delete exercise', _error));
    }
  }

  /**
   * Saves multiple exercises in bulk.
   * @param exercises Array of ExerciseModels to save
   * @returns A Result indicating success or failure
   */
  async saveBulkExercises(exercises: ExerciseModel[]): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.info('Saving exercises in bulk', { count: exercises.length });

      // Validate all exercises before saving
      for (const exercise of exercises) {
        const validation = exercise.validate();
        if (!validation.success) {
          this.logger.error('Bulk exercise validation failed', undefined, {
            exerciseId: exercise.id,
            errors: validation.error.errors,
          });
          return Result.failure(
            new ApplicationError('Exercise validation failed', validation.error.errors)
          );
        }
      }

      await this.exerciseRepository.saveBulk(exercises);

      this.logger.info('Bulk exercises saved successfully', { count: exercises.length });
      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to save bulk exercises', _error as Error, {
        count: exercises.length,
      });
      return Result.failure(new ApplicationError('Failed to save bulk exercises', _error));
    }
  }
}
