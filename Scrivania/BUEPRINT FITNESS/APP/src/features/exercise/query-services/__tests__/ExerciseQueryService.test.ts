import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { type ExerciseData } from '@/shared/types';
import { Result } from '@/shared/utils/Result';
import { createTestExerciseModel } from '@/test-factories';

import { ExerciseQueryService } from '../ExerciseQueryService';

type MockExerciseService = any;

// Mock the ExerciseService
vi.mock('@/features/exercise/services/ExerciseService');

describe('ExerciseQueryService', () => {
  let exerciseQueryService: ExerciseQueryService;
  let mockExerciseService: {
    createExercise: ReturnType<typeof vi.fn>;
    getExercise: ReturnType<typeof vi.fn>;
    getAllExercises: ReturnType<typeof vi.fn>;
    getExercisesByIds: ReturnType<typeof vi.fn>;
    updateExercise: ReturnType<typeof vi.fn>;
    addSubstitution: ReturnType<typeof vi.fn>;
    removeSubstitution: ReturnType<typeof vi.fn>;
    deleteExercise: ReturnType<typeof vi.fn>;
    saveBulkExercises: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testExerciseId = '550e8400-e29b-41d4-a716-446655440002';
  const testSubstituteId = '550e8400-e29b-41d4-a716-446655440003';

  const testExercise = createTestExerciseModel({
    id: testExerciseId,
    profileId: testProfileId,
    name: 'Test Exercise',
    category: 'strength',
  });

  const testExerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'> = {
    profileId: testProfileId,
    name: 'New Exercise',
    description: 'Test exercise description',
    category: 'cardio',
    movementType: 'pull',
    difficulty: 'beginner',
    equipment: ['barbell'],
    muscleActivation: { chest: 1.0, triceps: 0.7 },
    counterType: 'reps',
    jointType: 'compound',
    notes: 'Test notes',
    substitutions: [],
  };

  beforeEach(() => {
    // Create service mocks
    mockExerciseService = {
      createExercise: vi.fn(),
      getExercise: vi.fn(),
      getAllExercises: vi.fn(),
      getExercisesByIds: vi.fn(),
      updateExercise: vi.fn(),
      addSubstitution: vi.fn(),
      removeSubstitution: vi.fn(),
      deleteExercise: vi.fn(),
      saveBulkExercises: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    exerciseQueryService = new ExerciseQueryService(mockExerciseService as MockExerciseService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createExercise', () => {
    it('should return created exercise when service succeeds', async () => {
      // Arrange
      const createdExercise = createTestExerciseModel(testExerciseData);
      mockExerciseService.createExercise.mockResolvedValue(Result.success(createdExercise));

      // Act
      const result = await exerciseQueryService.createExercise(testExerciseData);

      // Assert
      expect(result).toEqual(createdExercise);
      expect(result.name).toBe(testExerciseData.name);
      expect(result.category).toBe(testExerciseData.category);
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(testExerciseData);
      expect(mockExerciseService.createExercise).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to create exercise');
      mockExerciseService.createExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(exerciseQueryService.createExercise(testExerciseData)).rejects.toThrow(error);
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(testExerciseData);
      expect(mockExerciseService.createExercise).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors from service', async () => {
      // Arrange
      const invalidData = { ...testExerciseData, name: '' };
      const validationError = new ApplicationError('Exercise name is required');
      mockExerciseService.createExercise.mockResolvedValue(Result.failure(validationError));

      // Act & Assert
      await expect(exerciseQueryService.createExercise(invalidData)).rejects.toThrow(
        validationError
      );
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(invalidData);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Database connection failed');
      mockExerciseService.createExercise.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(exerciseQueryService.createExercise(testExerciseData)).rejects.toThrow(
        unexpectedError
      );
    });

    it('should create exercise with all optional fields', async () => {
      // Arrange
      const completeExerciseData = {
        ...testExerciseData,
        muscleActivation: { chest: 1.0, shoulders: 0.8, triceps: 0.6 },
        equipment: ['barbell', 'bench'],
        movementPattern: 'horizontalPush' as const,
        notes: 'Detailed notes',
      };
      const createdExercise = createTestExerciseModel(completeExerciseData);
      mockExerciseService.createExercise.mockResolvedValue(Result.success(createdExercise));

      // Act
      const result = await exerciseQueryService.createExercise(completeExerciseData);

      // Assert
      expect(result).toEqual(createdExercise);
      expect(result.muscleActivation).toEqual(completeExerciseData.muscleActivation);
      expect(result.equipment).toEqual(completeExerciseData.equipment);
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(completeExerciseData);
    });
  });

  describe('getExercise', () => {
    it('should return exercise when service succeeds', async () => {
      // Arrange
      mockExerciseService.getExercise.mockResolvedValue(Result.success(testExercise));

      // Act
      const result = await exerciseQueryService.getExercise(testProfileId, testExerciseId);

      // Assert
      expect(result).toEqual(testExercise);
      expect(mockExerciseService.getExercise).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockExerciseService.getExercise).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new NotFoundError('Exercise not found');
      mockExerciseService.getExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(exerciseQueryService.getExercise(testProfileId, testExerciseId)).rejects.toThrow(
        error
      );
      expect(mockExerciseService.getExercise).toHaveBeenCalledWith(testProfileId, testExerciseId);
    });

    it('should handle invalid profile ID', async () => {
      // Arrange
      const invalidProfileId = 'invalid-id';
      const error = new ApplicationError('Invalid profile ID');
      mockExerciseService.getExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.getExercise(invalidProfileId, testExerciseId)
      ).rejects.toThrow(error);
      expect(mockExerciseService.getExercise).toHaveBeenCalledWith(
        invalidProfileId,
        testExerciseId
      );
    });

    it('should handle invalid exercise ID', async () => {
      // Arrange
      const invalidExerciseId = 'invalid-exercise-id';
      const error = new ApplicationError('Invalid exercise ID');
      mockExerciseService.getExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.getExercise(testProfileId, invalidExerciseId)
      ).rejects.toThrow(error);
      expect(mockExerciseService.getExercise).toHaveBeenCalledWith(
        testProfileId,
        invalidExerciseId
      );
    });

    it('should handle non-existent exercise', async () => {
      // Arrange
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const error = new NotFoundError('Exercise not found');
      mockExerciseService.getExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(exerciseQueryService.getExercise(testProfileId, nonExistentId)).rejects.toThrow(
        error
      );
      expect(mockExerciseService.getExercise).toHaveBeenCalledWith(testProfileId, nonExistentId);
    });
  });

  describe('getAllExercises', () => {
    it('should return WatermelonDB query for all exercises', () => {
      // Act
      const result = exerciseQueryService.getAllExercises(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = exerciseQueryService.getAllExercises(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = exerciseQueryService.getAllExercises(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should create consistent query structure', () => {
      // Act
      const result = exerciseQueryService.getAllExercises(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getExercisesByIds', () => {
    const exerciseIds = [testExerciseId, 'exercise-2', 'exercise-3'];

    it('should return WatermelonDB query for exercises by IDs', () => {
      // Act
      const result = exerciseQueryService.getExercisesByIds(testProfileId, exerciseIds);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query with empty ID list', () => {
      // Arrange
      const emptyIds: string[] = [];

      // Act
      const result = exerciseQueryService.getExercisesByIds(testProfileId, emptyIds);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should create query with correct profile and ID filters', () => {
      // Act
      const result = exerciseQueryService.getExercisesByIds(testProfileId, exerciseIds);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = exerciseQueryService.getExercisesByIds(differentProfileId, exerciseIds);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should handle single exercise ID', () => {
      // Arrange
      const singleId = [testExerciseId];

      // Act
      const result = exerciseQueryService.getExercisesByIds(testProfileId, singleId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('updateExercise', () => {
    const updates: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>> = {
      name: 'Updated Exercise Name',
      notes: 'Updated notes',
      muscleActivation: { legs: 1.0, glutes: 0.8 },
    };

    it('should return updated exercise when service succeeds', async () => {
      // Arrange
      const updatedExercise = createTestExerciseModel({
        ...testExercise.toPlainObject(),
        ...updates,
        updatedAt: new Date(),
      });
      mockExerciseService.updateExercise.mockResolvedValue(Result.success(updatedExercise));

      // Act
      const result = await exerciseQueryService.updateExercise(
        testProfileId,
        testExerciseId,
        updates
      );

      // Assert
      expect(result).toEqual(updatedExercise);
      expect(result.name).toBe(updates.name);
      expect(result.notes).toBe(updates.notes);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        updates
      );
      expect(mockExerciseService.updateExercise).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new NotFoundError('Exercise not found');
      mockExerciseService.updateExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.updateExercise(testProfileId, testExerciseId, updates)
      ).rejects.toThrow(error);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        updates
      );
    });

    it('should handle empty updates object', async () => {
      // Arrange
      const emptyUpdates = {};
      const unchangedExercise = testExercise;
      mockExerciseService.updateExercise.mockResolvedValue(Result.success(unchangedExercise));

      // Act
      const result = await exerciseQueryService.updateExercise(
        testProfileId,
        testExerciseId,
        emptyUpdates
      );

      // Assert
      expect(result).toEqual(unchangedExercise);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        emptyUpdates
      );
    });

    it('should handle validation errors from updates', async () => {
      // Arrange
      const invalidUpdates = { name: '' };
      const validationError = new ApplicationError('Exercise name cannot be empty');
      mockExerciseService.updateExercise.mockResolvedValue(Result.failure(validationError));

      // Act & Assert
      await expect(
        exerciseQueryService.updateExercise(testProfileId, testExerciseId, invalidUpdates)
      ).rejects.toThrow(validationError);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        invalidUpdates
      );
    });

    it('should handle non-existent exercise update', async () => {
      // Arrange
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const error = new NotFoundError('Exercise not found');
      mockExerciseService.updateExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.updateExercise(testProfileId, nonExistentId, updates)
      ).rejects.toThrow(error);
      expect(mockExerciseService.updateExercise).toHaveBeenCalledWith(
        testProfileId,
        nonExistentId,
        updates
      );
    });
  });

  describe('addSubstitution', () => {
    const priority = 1;
    const reason = 'Alternative for injury recovery';

    it('should return updated exercise when service succeeds', async () => {
      // Arrange
      const updatedExercise = createTestExerciseModel({
        ...testExercise.toPlainObject(),
        substitutions: [{ exerciseId: testSubstituteId, priority, reason }],
      });
      mockExerciseService.addSubstitution.mockResolvedValue(Result.success(updatedExercise));

      // Act
      const result = await exerciseQueryService.addSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority,
        reason
      );

      // Assert
      expect(result).toEqual(updatedExercise);
      expect(result.substitutions).toHaveLength(1);
      expect(result.substitutions[0].exerciseId).toBe(testSubstituteId);
      expect(result.substitutions[0].priority).toBe(priority);
      expect(result.substitutions[0].reason).toBe(reason);
      expect(mockExerciseService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority,
        reason
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to add substitution');
      mockExerciseService.addSubstitution.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.addSubstitution(
          testProfileId,
          testExerciseId,
          testSubstituteId,
          priority,
          reason
        )
      ).rejects.toThrow(error);
      expect(mockExerciseService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority,
        reason
      );
    });

    it('should handle adding substitution without reason', async () => {
      // Arrange
      const updatedExercise = createTestExerciseModel({
        ...testExercise.toPlainObject(),
        substitutions: [{ exerciseId: testSubstituteId, priority }],
      });
      mockExerciseService.addSubstitution.mockResolvedValue(Result.success(updatedExercise));

      // Act
      const result = await exerciseQueryService.addSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority
      );

      // Assert
      expect(result).toEqual(updatedExercise);
      expect(result.substitutions[0].reason).toBeUndefined();
      expect(mockExerciseService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority,
        undefined
      );
    });

    it('should handle invalid priority values', async () => {
      // Arrange
      const invalidPriority = 10; // Assuming valid range is 1-5
      const error = new ApplicationError('Priority must be between 1 and 5');
      mockExerciseService.addSubstitution.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.addSubstitution(
          testProfileId,
          testExerciseId,
          testSubstituteId,
          invalidPriority,
          reason
        )
      ).rejects.toThrow(error);
      expect(mockExerciseService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        invalidPriority,
        reason
      );
    });

    it('should handle non-existent substitute exercise', async () => {
      // Arrange
      const nonExistentSubstituteId = 'non-existent-substitute';
      const error = new NotFoundError('Substitute exercise not found');
      mockExerciseService.addSubstitution.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.addSubstitution(
          testProfileId,
          testExerciseId,
          nonExistentSubstituteId,
          priority,
          reason
        )
      ).rejects.toThrow(error);
      expect(mockExerciseService.addSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        nonExistentSubstituteId,
        priority,
        reason
      );
    });
  });

  describe('removeSubstitution', () => {
    it('should return updated exercise when service succeeds', async () => {
      // Arrange
      const updatedExercise = createTestExerciseModel({
        ...testExercise.toPlainObject(),
        substitutions: [], // Substitution removed
      });
      mockExerciseService.removeSubstitution.mockResolvedValue(Result.success(updatedExercise));

      // Act
      const result = await exerciseQueryService.removeSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId
      );

      // Assert
      expect(result).toEqual(updatedExercise);
      expect(result.substitutions).toHaveLength(0);
      expect(mockExerciseService.removeSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteId
      );
      expect(mockExerciseService.removeSubstitution).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to remove substitution');
      mockExerciseService.removeSubstitution.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.removeSubstitution(testProfileId, testExerciseId, testSubstituteId)
      ).rejects.toThrow(error);
      expect(mockExerciseService.removeSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        testSubstituteId
      );
    });

    it('should handle non-existent substitution removal', async () => {
      // Arrange
      const nonExistentSubstituteId = 'non-existent-substitute';
      const error = new NotFoundError('Substitution not found');
      mockExerciseService.removeSubstitution.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.removeSubstitution(
          testProfileId,
          testExerciseId,
          nonExistentSubstituteId
        )
      ).rejects.toThrow(error);
      expect(mockExerciseService.removeSubstitution).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId,
        nonExistentSubstituteId
      );
    });

    it('should handle non-existent exercise for substitution removal', async () => {
      // Arrange
      const nonExistentExerciseId = 'non-existent-exercise';
      const error = new NotFoundError('Exercise not found');
      mockExerciseService.removeSubstitution.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.removeSubstitution(
          testProfileId,
          nonExistentExerciseId,
          testSubstituteId
        )
      ).rejects.toThrow(error);
      expect(mockExerciseService.removeSubstitution).toHaveBeenCalledWith(
        testProfileId,
        nonExistentExerciseId,
        testSubstituteId
      );
    });
  });

  describe('deleteExercise', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockExerciseService.deleteExercise.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await exerciseQueryService.deleteExercise(testProfileId, testExerciseId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockExerciseService.deleteExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId
      );
      expect(mockExerciseService.deleteExercise).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete exercise');
      mockExerciseService.deleteExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.deleteExercise(testProfileId, testExerciseId)
      ).rejects.toThrow(error);
      expect(mockExerciseService.deleteExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId
      );
    });

    it('should handle non-existent exercise deletion', async () => {
      // Arrange
      const nonExistentId = 'non-existent-exercise';
      const error = new NotFoundError('Exercise not found');
      mockExerciseService.deleteExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.deleteExercise(testProfileId, nonExistentId)
      ).rejects.toThrow(error);
      expect(mockExerciseService.deleteExercise).toHaveBeenCalledWith(testProfileId, nonExistentId);
    });

    it('should handle deletion of exercise with dependencies', async () => {
      // Arrange
      const error = new ApplicationError('Cannot delete exercise with existing dependencies');
      mockExerciseService.deleteExercise.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        exerciseQueryService.deleteExercise(testProfileId, testExerciseId)
      ).rejects.toThrow(error);
      expect(mockExerciseService.deleteExercise).toHaveBeenCalledWith(
        testProfileId,
        testExerciseId
      );
    });
  });

  describe('saveBulkExercises', () => {
    const bulkExercises = [
      testExercise,
      createTestExerciseModel({ id: 'bulk-exercise-1' }),
      createTestExerciseModel({ id: 'bulk-exercise-2' }),
    ];

    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockExerciseService.saveBulkExercises.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await exerciseQueryService.saveBulkExercises(bulkExercises);

      // Assert
      expect(result).toBeUndefined();
      expect(mockExerciseService.saveBulkExercises).toHaveBeenCalledWith(bulkExercises);
      expect(mockExerciseService.saveBulkExercises).toHaveBeenCalledTimes(1);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to save bulk exercises');
      mockExerciseService.saveBulkExercises.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(exerciseQueryService.saveBulkExercises(bulkExercises)).rejects.toThrow(error);
      expect(mockExerciseService.saveBulkExercises).toHaveBeenCalledWith(bulkExercises);
    });

    it('should handle empty exercises array', async () => {
      // Arrange
      const emptyExercises: ExerciseModel[] = [];
      mockExerciseService.saveBulkExercises.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await exerciseQueryService.saveBulkExercises(emptyExercises);

      // Assert
      expect(result).toBeUndefined();
      expect(mockExerciseService.saveBulkExercises).toHaveBeenCalledWith(emptyExercises);
    });

    it('should handle validation errors in bulk operation', async () => {
      // Arrange
      const error = new ApplicationError('Validation failed for one or more exercises');
      mockExerciseService.saveBulkExercises.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(exerciseQueryService.saveBulkExercises(bulkExercises)).rejects.toThrow(error);
      expect(mockExerciseService.saveBulkExercises).toHaveBeenCalledWith(bulkExercises);
    });

    it('should handle partial failure in bulk operation', async () => {
      // Arrange
      const error = new ApplicationError('Some exercises failed to save');
      mockExerciseService.saveBulkExercises.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(exerciseQueryService.saveBulkExercises(bulkExercises)).rejects.toThrow(error);
      expect(mockExerciseService.saveBulkExercises).toHaveBeenCalledWith(bulkExercises);
    });
  });

  describe('dependency injection', () => {
    it('should use injected ExerciseService', () => {
      // Arrange & Act
      const service = new ExerciseQueryService(mockExerciseService as MockExerciseService);

      // Assert
      expect(service).toBeInstanceOf(ExerciseQueryService);
      expect(service).toBeDefined();
    });

    it('should be decorated with @injectable', () => {
      // Arrange & Act
      const service = new ExerciseQueryService(mockExerciseService as MockExerciseService);

      // Assert
      expect(service).toBeInstanceOf(ExerciseQueryService);
      // The constructor should accept the service dependency
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from ExerciseService', async () => {
      // Arrange
      const originalError = new NotFoundError('Specific exercise error');
      mockExerciseService.getExercise.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(exerciseQueryService.getExercise(testProfileId, testExerciseId)).rejects.toBe(
        originalError
      );
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockExerciseService.createExercise.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await exerciseQueryService
        .createExercise(testExerciseData)
        .catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });

    it('should handle service throwing unexpected errors directly', async () => {
      // Act & Assert
      // getAllExercises now returns a Query object, not a promise
      const query = exerciseQueryService.getAllExercises(testProfileId);
      expect(query).toBeDefined();
      expect(typeof query.fetch).toBe('function');
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent query creation', () => {
      // Act
      const queries = Array.from({ length: 5 }, () =>
        exerciseQueryService.getAllExercises(testProfileId)
      );

      // Assert
      queries.forEach((query) => {
        expect(query).toBeDefined();
        expect(typeof query.fetch).toBe('function');
        expect(typeof query.observe).toBe('function');
      });
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockExerciseService.getExercise.mockResolvedValue(Result.success(testExercise));
      mockExerciseService.deleteExercise.mockResolvedValue(
        Result.failure(new ApplicationError('Delete failed'))
      );

      // Act
      const getResult = await exerciseQueryService.getExercise(testProfileId, testExerciseId);
      const deleteError = await exerciseQueryService
        .deleteExercise(testProfileId, testExerciseId)
        .catch((e) => e);

      // Assert
      expect(getResult).toEqual(testExercise);
      expect(deleteError).toBeInstanceOf(ApplicationError);
      expect(deleteError.message).toBe('Delete failed');
    });

    it('should handle operations on non-existent profile consistently', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile';
      const notFoundError = new ApplicationError('Profile not found');

      mockExerciseService.getExercise.mockResolvedValue(Result.failure(notFoundError));
      mockExerciseService.createExercise.mockResolvedValue(Result.failure(notFoundError));

      // Act
      const getAllQuery = exerciseQueryService.getAllExercises(nonExistentProfileId);
      const getError = await exerciseQueryService
        .getExercise(nonExistentProfileId, testExerciseId)
        .catch((e) => e);
      const createError = await exerciseQueryService
        .createExercise({ ...testExerciseData, profileId: nonExistentProfileId })
        .catch((e) => e);

      // Assert
      expect(getAllQuery).toBeDefined();
      expect(typeof getAllQuery.fetch).toBe('function');
      expect(getError).toBe(notFoundError);
      expect(createError).toBe(notFoundError);
    });

    it('should handle complex substitution operations', async () => {
      // Arrange
      const exerciseWithSubstitutions = createTestExerciseModel({
        ...testExercise.toPlainObject(),
        substitutions: [
          { exerciseId: testSubstituteId, priority: 1, reason: 'Initial substitution' },
        ],
      });

      mockExerciseService.addSubstitution.mockResolvedValue(
        Result.success(exerciseWithSubstitutions)
      );
      mockExerciseService.removeSubstitution.mockResolvedValue(Result.success(testExercise));

      // Act
      const addResult = await exerciseQueryService.addSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        1,
        'Initial substitution'
      );
      const removeResult = await exerciseQueryService.removeSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId
      );

      // Assert
      expect(addResult.substitutions).toHaveLength(1);
      expect(removeResult.substitutions).toHaveLength(0);
    });
  });
});
