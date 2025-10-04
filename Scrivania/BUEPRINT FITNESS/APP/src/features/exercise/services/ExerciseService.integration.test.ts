import { Database } from '@nozbe/watermelondb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { ExerciseRepository } from '@/features/exercise/data/ExerciseRepository';
import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { type ExerciseData } from '@/shared/types';
import { createTestDatabase } from '@/test-database';
import { createTestExerciseData, createTestExerciseModel } from '@/test-factories';

import { ExerciseService } from './ExerciseService';

describe('ExerciseService Integration Tests', () => {
  let exerciseService: ExerciseService;
  let exerciseRepository: ExerciseRepository;
  let mockLogger: jest.Mocked<ILogger>;
  let testDb: Database;

  beforeEach(() => {
    // Create a test database instance
    testDb = createTestDatabase();

    // Create real repository instance with test database
    exerciseRepository = new ExerciseRepository(testDb);

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    exerciseService = new ExerciseService(exerciseRepository, mockLogger);

    // Mock crypto for consistent testing and WatermelonDB compatibility
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440003'),
      getRandomValues: vi.fn((arr) => {
        // Fill the array with pseudo-random values for testing
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    });
  });

  afterEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();

    // Clean up database
    if (testDb) {
      await testDb.delete();
    }
  });

  describe('createExercise - Integration Test', () => {
    it('should successfully create exercise with real persistence', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      // Use a complete muscle activation object with all required keys
      const inputData = {
        profileId,
        name: 'Test Exercise',
        description: 'A test exercise',
        category: 'strength' as const,
        movementType: 'push' as const,
        difficulty: 'intermediate' as const,
        equipment: ['barbell'] as const,
        muscleActivation: {
          chest: 1.0,
          lats: 0.0,
          upper_back: 0.0,
          lower_back: 0.0,
          shoulders: 0.3,
          biceps: 0.0,
          triceps: 0.7,
          forearms: 0.0,
          quadriceps: 0.0,
          hamstrings: 0.0,
          calves: 0.0,
          abdominals: 0.1,
          glutes: 0.0,
        },
        counterType: 'reps' as const,
        jointType: 'compound' as const,
        substitutions: [],
      };

      // Act - Execute the vertical slice
      const result = await exerciseService.createExercise(inputData);

      // Assert - Verify the complete flow
      expect(result.isSuccess).toBe(true);

      const createdExercise = result.getValue();
      expect(createdExercise.id).toBe('550e8400-e29b-41d4-a716-446655440003');
      expect(createdExercise.profileId).toBe(profileId);
      expect(createdExercise.name).toBe('Test Exercise');
      expect(createdExercise.description).toBe('A test exercise');
      expect(createdExercise.category).toBe('strength');

      // Verify exercise was persisted in repository
      const retrievedExercise = await exerciseRepository.findById(
        profileId,
        '550e8400-e29b-41d4-a716-446655440003'
      );
      expect(retrievedExercise).toBeDefined();
      expect(retrievedExercise!.name).toBe('Test Exercise');
      expect(retrievedExercise!.profileId).toBe(profileId);

      // Verify logging was called
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new exercise', {
        profileId,
        name: 'Test Exercise',
        category: 'strength',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise created successfully', {
        exerciseId: '550e8400-e29b-41d4-a716-446655440003',
        profileId,
        name: 'Test Exercise',
      });
    });

    it('should handle exercise creation with complex muscle activation data', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const complexMuscleActivation = {
        chest: 0.9,
        lats: 0.0,
        upper_back: 0.0,
        lower_back: 0.0,
        shoulders: 0.6,
        biceps: 0.0,
        triceps: 0.7,
        forearms: 0.0,
        quadriceps: 0.0,
        hamstrings: 0.0,
        calves: 0.0,
        abdominals: 0.3,
        glutes: 0.0,
      };

      const exerciseData = {
        profileId,
        name: 'Complex Exercise',
        description: 'An exercise with complex muscle activation',
        category: 'strength' as const,
        movementType: 'push' as const,
        difficulty: 'advanced' as const,
        equipment: ['barbell', 'bench'] as const,
        muscleActivation: complexMuscleActivation,
        counterType: 'reps' as const,
        jointType: 'compound' as const,
        substitutions: [],
      };

      // Act
      const result = await exerciseService.createExercise(exerciseData);

      // Assert
      expect(result.isSuccess).toBe(true);
      const createdExercise = result.getValue();
      expect(createdExercise.muscleActivation).toEqual(complexMuscleActivation);

      // Verify persistence with complex data
      const retrievedExercise = await exerciseRepository.findById(profileId, createdExercise.id);
      expect(retrievedExercise!.muscleActivation).toEqual(complexMuscleActivation);
      expect(retrievedExercise!.equipment).toEqual(['barbell', 'bench']);
    });

    it('should handle exercise validation failures', async () => {
      // Arrange - Create invalid exercise data (empty name should fail validation)
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const invalidExerciseData = {
        profileId,
        name: '', // Invalid: empty name
        description: 'Invalid exercise',
        category: 'strength' as const,
        movementType: 'push' as const,
        difficulty: 'beginner' as const,
        equipment: ['bodyweight'] as const,
        muscleActivation: {
          chest: 1.0,
          lats: 0.0,
          upper_back: 0.0,
          lower_back: 0.0,
          shoulders: 0.0,
          biceps: 0.0,
          triceps: 0.0,
          forearms: 0.0,
          quadriceps: 0.0,
          hamstrings: 0.0,
          calves: 0.0,
          abdominals: 0.0,
          glutes: 0.0,
        },
        counterType: 'reps' as const,
        jointType: 'isolation' as const,
        substitutions: [],
      };

      // Act
      const result = await exerciseService.createExercise(invalidExerciseData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);

      // Verify nothing was persisted
      const allExercises = await exerciseRepository.findAll(profileId);
      expect(allExercises).toHaveLength(0);

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith('Exercise validation failed', undefined, {
        profileId,
        name: '',
        errors: undefined, // The error structure might be different
      });
    });

    it('should handle database persistence errors gracefully', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const inputData = {
        profileId,
        name: 'Test Exercise',
        description: 'A test exercise',
        category: 'strength' as const,
        movementType: 'push' as const,
        difficulty: 'intermediate' as const,
        equipment: ['barbell'] as const,
        muscleActivation: {
          chest: 1.0,
          lats: 0.0,
          upper_back: 0.0,
          lower_back: 0.0,
          shoulders: 0.3,
          biceps: 0.0,
          triceps: 0.7,
          forearms: 0.0,
          quadriceps: 0.0,
          hamstrings: 0.0,
          calves: 0.0,
          abdominals: 0.1,
          glutes: 0.0,
        },
        counterType: 'reps' as const,
        jointType: 'compound' as const,
        substitutions: [],
      };

      // Mock repository save to throw an error
      const originalSave = exerciseRepository.save;
      exerciseRepository.save = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await exerciseService.createExercise(inputData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create exercise',
        expect.any(Error),
        {
          profileId,
          name: 'Test Exercise',
        }
      );

      // Restore original method
      exerciseRepository.save = originalSave;
    });
  });

  describe('deleteExercise - Integration Test', () => {
    it('should successfully delete exercise with real persistence', async () => {
      // Arrange - First create an exercise to delete
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const exerciseData = createTestExerciseData({
        profileId,
        name: 'Exercise to Delete',
      });
      const exercise = createTestExerciseModel(exerciseData);

      // Save exercise to repository first
      await exerciseRepository.save(exercise);

      // Verify exercise exists
      const existingExercise = await exerciseRepository.findById(profileId, exercise.id);
      expect(existingExercise).toBeDefined();

      // Act - Delete the exercise
      const result = await exerciseService.deleteExercise(profileId, exercise.id);

      // Assert - Verify deletion was successful
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();

      // Verify exercise was removed from repository
      const deletedExercise = await exerciseRepository.findById(profileId, exercise.id);
      expect(deletedExercise).toBeUndefined();

      // Verify logging was called
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting exercise permanently', {
        profileId,
        exerciseId: exercise.id,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise deleted successfully', {
        profileId,
        exerciseId: exercise.id,
      });
    });

    it('should handle deletion of non-existent exercise', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const nonExistentExerciseId = '550e8400-e29b-41d4-a716-446655440999';

      // Act - Try to delete non-existent exercise
      const result = await exerciseService.deleteExercise(profileId, nonExistentExerciseId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);

      // Verify error logging
      expect(mockLogger.warn).toHaveBeenCalledWith('Exercise not found for deletion', {
        profileId,
        exerciseId: nonExistentExerciseId,
      });
    });

    it('should handle profile isolation in deletion', async () => {
      // Arrange - Create exercises for different profiles
      const profileId1 = '550e8400-e29b-41d4-a716-446655440001';
      const profileId2 = '550e8400-e29b-41d4-a716-446655440002';

      const exercise1Data = createTestExerciseData({
        profileId: profileId1,
        name: 'Profile 1 Exercise',
      });
      const exercise2Data = createTestExerciseData({
        profileId: profileId2,
        name: 'Profile 2 Exercise',
      });

      const exercise1 = createTestExerciseModel(exercise1Data);
      const exercise2 = createTestExerciseModel(exercise2Data);

      // Save both exercises
      await exerciseRepository.save(exercise1);
      await exerciseRepository.save(exercise2);

      // Act - Try to delete Profile 1's exercise using Profile 2's ID
      const result = await exerciseService.deleteExercise(profileId2, exercise1.id);

      // Assert - Should fail because exercise belongs to different profile
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);

      // Verify the exercise still exists for its correct profile
      const stillExists = await exerciseRepository.findById(profileId1, exercise1.id);
      expect(stillExists).toBeDefined();
      expect(stillExists!.name).toBe('Profile 1 Exercise');
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const exerciseData = createTestExerciseData({ profileId });
      const exercise = createTestExerciseModel(exerciseData);

      // Save exercise first
      await exerciseRepository.save(exercise);

      // Mock repository delete to throw an error
      const originalDelete = exerciseRepository.delete;
      exerciseRepository.delete = vi.fn().mockRejectedValue(new Error('Database deletion failed'));

      // Act
      const result = await exerciseService.deleteExercise(profileId, exercise.id);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete exercise',
        expect.any(Error),
        {
          profileId,
          exerciseId: exercise.id,
        }
      );

      // Restore original method
      exerciseRepository.delete = originalDelete;
    });

    it('should handle bulk operations and verify data integrity', async () => {
      // Arrange - Create multiple exercises
      const profileId = '550e8400-e29b-41d4-a716-446655440001';
      const exerciseCount = 5;
      const exercises: ExerciseModel[] = [];

      for (let i = 0; i < exerciseCount; i++) {
        const exerciseData = createTestExerciseData({
          profileId,
          name: `Bulk Exercise ${i + 1}`,
        });
        const exercise = createTestExerciseModel(exerciseData);
        exercises.push(exercise);
        await exerciseRepository.save(exercise);
      }

      // Verify all exercises exist
      const allExercises = await exerciseRepository.findAll(profileId);
      expect(allExercises).toHaveLength(exerciseCount);

      // Act - Delete exercises one by one
      for (const exercise of exercises.slice(0, 3)) {
        const result = await exerciseService.deleteExercise(profileId, exercise.id);
        expect(result.isSuccess).toBe(true);
      }

      // Assert - Verify partial deletion
      const remainingExercises = await exerciseRepository.findAll(profileId);
      expect(remainingExercises).toHaveLength(2);
      expect(remainingExercises.map((e) => e.name).sort()).toEqual([
        'Bulk Exercise 4',
        'Bulk Exercise 5',
      ]);
    });
  });

  describe('Full Exercise Lifecycle Integration', () => {
    it('should handle complete CRUD operations with persistence integrity', async () => {
      // Arrange
      const profileId = '550e8400-e29b-41d4-a716-446655440001';

      // Act & Assert - Create
      const createData = {
        profileId,
        name: 'Lifecycle Exercise',
        description: 'Exercise for lifecycle testing',
        category: 'strength' as const,
        movementType: 'pull' as const,
        difficulty: 'intermediate' as const,
        equipment: ['dumbbell'] as const,
        muscleActivation: {
          chest: 0.0,
          lats: 1.0,
          upper_back: 0.8,
          lower_back: 0.0,
          shoulders: 0.3,
          biceps: 0.6,
          triceps: 0.0,
          forearms: 0.0,
          quadriceps: 0.0,
          hamstrings: 0.0,
          calves: 0.0,
          abdominals: 0.1,
          glutes: 0.0,
        },
        counterType: 'reps' as const,
        jointType: 'compound' as const,
        substitutions: [],
      };

      const createResult = await exerciseService.createExercise(createData);
      expect(createResult.isSuccess).toBe(true);

      const exerciseId = createResult.getValue().id;

      // Act & Assert - Read
      const readResult = await exerciseService.getExercise(profileId, exerciseId);
      expect(readResult.isSuccess).toBe(true);
      expect(readResult.getValue().name).toBe('Lifecycle Exercise');

      // Act & Assert - Update
      const updateResult = await exerciseService.updateExercise(profileId, exerciseId, {
        name: 'Updated Lifecycle Exercise',
        difficulty: 'advanced',
      });
      expect(updateResult.isSuccess).toBe(true);
      expect(updateResult.getValue().name).toBe('Updated Lifecycle Exercise');
      expect(updateResult.getValue().difficulty).toBe('advanced');

      // Verify persistence after update
      const verifyUpdateResult = await exerciseService.getExercise(profileId, exerciseId);
      expect(verifyUpdateResult.getValue().name).toBe('Updated Lifecycle Exercise');
      expect(verifyUpdateResult.getValue().difficulty).toBe('advanced');

      // Act & Assert - List all
      const listResult = await exerciseService.getAllExercises(profileId);
      expect(listResult.isSuccess).toBe(true);
      expect(listResult.getValue()).toHaveLength(1);

      // Act & Assert - Delete
      const deleteResult = await exerciseService.deleteExercise(profileId, exerciseId);
      expect(deleteResult.isSuccess).toBe(true);

      // Verify deletion
      const finalListResult = await exerciseService.getAllExercises(profileId);
      expect(finalListResult.getValue()).toHaveLength(0);
    });

    it('should handle exercise substitutions with real persistence', async () => {
      // Arrange - Create main exercise and substitute exercise
      const profileId = '550e8400-e29b-41d4-a716-446655440001';

      // Create main exercise
      const mainExerciseData = {
        profileId,
        name: 'Main Exercise',
        description: 'Primary exercise',
        category: 'strength' as const,
        movementType: 'push' as const,
        difficulty: 'intermediate' as const,
        equipment: ['barbell'] as const,
        muscleActivation: {
          chest: 1.0,
          lats: 0.0,
          upper_back: 0.0,
          lower_back: 0.0,
          shoulders: 0.3,
          biceps: 0.0,
          triceps: 0.7,
          forearms: 0.0,
          quadriceps: 0.0,
          hamstrings: 0.0,
          calves: 0.0,
          abdominals: 0.1,
          glutes: 0.0,
        },
        counterType: 'reps' as const,
        jointType: 'compound' as const,
        substitutions: [],
      };

      const createMainResult = await exerciseService.createExercise(mainExerciseData);
      expect(createMainResult.isSuccess).toBe(true);
      const mainExerciseId = createMainResult.getValue().id;

      // Reset UUID mock for substitute exercise
      vi.mocked(crypto.randomUUID).mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440004');

      // Create substitute exercise
      const substituteExerciseData = {
        profileId,
        name: 'Substitute Exercise',
        description: 'Alternative exercise',
        category: 'strength' as const,
        movementType: 'push' as const,
        difficulty: 'beginner' as const,
        equipment: ['dumbbell'] as const,
        muscleActivation: {
          chest: 0.9,
          lats: 0.0,
          upper_back: 0.0,
          lower_back: 0.0,
          shoulders: 0.3,
          biceps: 0.0,
          triceps: 0.5,
          forearms: 0.0,
          quadriceps: 0.0,
          hamstrings: 0.0,
          calves: 0.0,
          abdominals: 0.1,
          glutes: 0.0,
        },
        counterType: 'reps' as const,
        jointType: 'compound' as const,
        substitutions: [],
      };

      const createSubResult = await exerciseService.createExercise(substituteExerciseData);
      expect(createSubResult.isSuccess).toBe(true);
      const substituteExerciseId = createSubResult.getValue().id;

      // Act - Add substitution
      const addSubResult = await exerciseService.addSubstitution(
        profileId,
        mainExerciseId,
        substituteExerciseId,
        1,
        'Equipment not available'
      );

      // Assert
      expect(addSubResult.isSuccess).toBe(true);
      const updatedExercise = addSubResult.getValue();
      expect(updatedExercise.substitutions).toHaveLength(1);
      expect(updatedExercise.substitutions[0].exerciseId).toBe(substituteExerciseId);
      expect(updatedExercise.substitutions[0].priority).toBe(1);
      expect(updatedExercise.substitutions[0].reason).toBe('Equipment not available');

      // Verify persistence of substitution
      const retrievedExercise = await exerciseRepository.findById(profileId, mainExerciseId);
      expect(retrievedExercise!.substitutions).toHaveLength(1);
      expect(retrievedExercise!.substitutions[0].exerciseId).toBe(substituteExerciseId);

      // Act - Remove substitution
      const removeSubResult = await exerciseService.removeSubstitution(
        profileId,
        mainExerciseId,
        substituteExerciseId
      );

      // Assert
      expect(removeSubResult.isSuccess).toBe(true);
      expect(removeSubResult.getValue().substitutions).toHaveLength(0);

      // Verify persistence of substitution removal
      const finalRetrievedExercise = await exerciseRepository.findById(profileId, mainExerciseId);
      expect(finalRetrievedExercise!.substitutions).toHaveLength(0);
    });
  });
});
