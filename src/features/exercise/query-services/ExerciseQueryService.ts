import type { Query } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { Exercise } from '@/app/db/model/Exercise';
import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseService } from '@/features/exercise/services/ExerciseService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { type ExerciseData } from '@/shared/types';

/**
 * Query service that acts as an adapter between the Exercise Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the ExerciseService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all exercise-related data operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class ExerciseQueryService {
  constructor(@inject(ExerciseService) private readonly exerciseService: ExerciseService) {}

  /**
   * Creates a new exercise for a profile.
   * @param exerciseData The exercise data to create (without id, createdAt, updatedAt)
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the created ExerciseModel
   */
  async createExercise(
    exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExerciseModel | null> {
    const result = await this.exerciseService.createExercise(exerciseData);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves an exercise by its ID for a specific profile.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to retrieve
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the ExerciseModel
   */
  async getExercise(profileId: string, exerciseId: string): Promise<ExerciseModel> {
    const result = await this.exerciseService.getExercise(profileId, exerciseId);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Retrieves all exercises for a specific profile.
   * @param profileId The profile ID
   * @throws {ApplicationError} When the operation fails
   * @returns Query for Exercise models for reactive observation
   */
  getAllExercises(profileId: string): Query<Exercise> {
    const collection = database.get<Exercise>('exercises');
    return collection.query(Q.where('profile_id', profileId));
  }

  /**
   * Retrieves multiple exercises by their IDs for a specific profile.
   * @param profileId The profile ID
   * @param exerciseIds Array of exercise IDs to retrieve
   * @throws {ApplicationError} When the operation fails
   * @returns Query for Exercise models for reactive observation
   */
  getExercisesByIds(profileId: string, exerciseIds: string[]): Query<Exercise> {
    const collection = database.get<Exercise>('exercises');
    return collection.query(Q.where('profile_id', profileId), Q.where('id', Q.oneOf(exerciseIds)));
  }

  /**
   * Updates an existing exercise.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to update
   * @param updates The updates to apply to the exercise
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated ExerciseModel
   */
  async updateExercise(
    profileId: string,
    exerciseId: string,
    updates: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ExerciseModel> {
    const result = await this.exerciseService.updateExercise(profileId, exerciseId, updates);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Adds a substitution to an existing exercise.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to add substitution to
   * @param substituteExerciseId The ID of the substitute exercise
   * @param priority The priority of the substitution (1-5)
   * @param reason Optional reason for the substitution
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated ExerciseModel
   */
  async addSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string,
    priority: number,
    reason?: string
  ): Promise<ExerciseModel> {
    const result = await this.exerciseService.addSubstitution(
      profileId,
      exerciseId,
      substituteExerciseId,
      priority,
      reason
    );
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Removes a substitution from an existing exercise.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to remove substitution from
   * @param substituteExerciseId The ID of the substitute exercise to remove
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to the updated ExerciseModel
   */
  async removeSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string
  ): Promise<ExerciseModel> {
    const result = await this.exerciseService.removeSubstitution(
      profileId,
      exerciseId,
      substituteExerciseId
    );
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Permanently deletes an exercise from the system.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID to delete
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when deletion is complete
   */
  async deleteExercise(profileId: string, exerciseId: string): Promise<void> {
    const result = await this.exerciseService.deleteExercise(profileId, exerciseId);
    if (result.isFailure) {
      throw result.error;
    }
  }

  /**
   * Saves multiple exercises in bulk.
   * @param exercises Array of ExerciseModels to save
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving when bulk save is complete
   */
  async saveBulkExercises(exercises: ExerciseModel[]): Promise<void> {
    const result = await this.exerciseService.saveBulkExercises(exercises);
    if (result.isFailure) {
      throw result.error;
    }
  }
}
