import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { IExerciseRepository } from '@/features/exercise/domain/IExerciseRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { type ExerciseData } from '@/shared/types';
import { createTestExerciseModel } from '@/test-factories';

import { ExerciseService } from './ExerciseService';

describe('ExerciseService', () => {
  let exerciseService: ExerciseService;
  let mockExerciseRepository: jest.Mocked<IExerciseRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testExerciseId = '550e8400-e29b-41d4-a716-446655440002';
  const testSubstituteId = '550e8400-e29b-41d4-a716-446655440003';

  const testExercise = createTestExerciseModel({
    id: testExerciseId,
    profileId: testProfileId,
    name: 'Bench Press',
    category: 'strength',
  });

  const testSubstituteExercise = createTestExerciseModel({
    id: testSubstituteId,
    profileId: testProfileId,
    name: 'Dumbbell Press',
    category: 'strength',
  });

  beforeEach(() => {
    // Create mocks
    mockExerciseRepository = {
      save: vi.fn(),
      saveBulk: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    exerciseService = new ExerciseService(mockExerciseRepository, mockLogger);

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    });

    // Mock ExerciseModel validation to return success by default
    vi.spyOn(ExerciseModel.prototype, 'validate').mockReturnValue({
      success: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe('createExercise', () => {
    const validExerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'> = {
      profileId: testProfileId,
      name: 'New Exercise',
      description: 'Test exercise description',
      category: 'strength',
      movementType: 'push',
      difficulty: 'intermediate',
      equipment: ['barbell'],
      muscleActivation: { chest: 1.0, triceps: 0.7 },
      counterType: 'reps',
      jointType: 'compound',
      substitutions: [],
    };

    it('should successfully create a new exercise', async () => {
      // Arrange
      const expectedExercise = createTestExerciseModel({
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...validExerciseData,
      });
      mockExerciseRepository.save.mockResolvedValue(expectedExercise);

      // Act
      const result = await exerciseService.createExercise(validExerciseData);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(expectedExercise);
      expect(mockExerciseRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new exercise', {
        profileId: validExerciseData.profileId,
        name: validExerciseData.name,
        category: validExerciseData.category,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise created successfully', {
        exerciseId: expectedExercise.id,
        profileId: expectedExercise.profileId,
        name: expectedExercise.name,
      });
    });

    it('should return failure when exercise validation fails', async () => {
      // Arrange
      const invalidExerciseData = { ...validExerciseData, name: '' }; // Empty name should fail validation
      vi.spyOn(ExerciseModel.prototype, 'validate').mockReturnValueOnce({
        success: false,
        error: { errors: ['Name is required'] },
      });

      // Act
      const result = await exerciseService.createExercise(invalidExerciseData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Exercise validation failed');
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Exercise validation failed',
        undefined,
        expect.objectContaining({
          profileId: invalidExerciseData.profileId,
          name: invalidExerciseData.name,
          errors: ['Name is required'],
        })
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockExerciseRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.createExercise(validExerciseData);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to create exercise');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create exercise', repositoryError, {
        profileId: validExerciseData.profileId,
        name: validExerciseData.name,
      });
    });
  });

  describe('getExercise', () => {
    it('should successfully retrieve an exercise by ID', async () => {
      // Arrange
      mockExerciseRepository.findById.mockResolvedValue(testExercise);

      // Act
      const result = await exerciseService.getExercise(testProfileId, testExerciseId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(testExercise);
      expect(mockExerciseRepository.findById).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving exercise', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise retrieved successfully', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
      });
    });

    it('should return NotFoundError when exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      mockExerciseRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await exerciseService.getExercise(testProfileId, nonExistentId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Exercise not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('Exercise not found', {
        profileId: testProfileId,
        exerciseId: nonExistentId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.getExercise(testProfileId, testExerciseId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve exercise');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve exercise',
        repositoryError,
        { profileId: testProfileId, exerciseId: testExerciseId }
      );
    });
  });

  describe('getAllExercises', () => {
    it('should successfully retrieve all exercises', async () => {
      // Arrange
      const exercises = [
        testExercise,
        createTestExerciseModel({ id: 'exercise-2', profileId: testProfileId }),
      ];
      mockExerciseRepository.findAll.mockResolvedValue(exercises);

      // Act
      const result = await exerciseService.getAllExercises(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(exercises);
      expect(mockExerciseRepository.findAll).toHaveBeenCalledWith(testProfileId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving all exercises for profile', {
        profileId: testProfileId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('All exercises retrieved successfully', {
        profileId: testProfileId,
        count: exercises.length,
      });
    });

    it('should return empty array when no exercises exist', async () => {
      // Arrange
      mockExerciseRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await exerciseService.getAllExercises(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('All exercises retrieved successfully', {
        profileId: testProfileId,
        count: 0,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findAll.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.getAllExercises(testProfileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve all exercises');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve all exercises',
        repositoryError,
        { profileId: testProfileId }
      );
    });
  });

  describe('getExercisesByIds', () => {
    it('should successfully retrieve exercises by IDs', async () => {
      // Arrange
      const exerciseIds = [testExerciseId, 'exercise-2'];
      const exercises = [
        testExercise,
        createTestExerciseModel({ id: 'exercise-2', profileId: testProfileId }),
      ];
      mockExerciseRepository.findByIds.mockResolvedValue(exercises);

      // Act
      const result = await exerciseService.getExercisesByIds(testProfileId, exerciseIds);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(exercises);
      expect(mockExerciseRepository.findByIds).toHaveBeenCalledWith(testProfileId, exerciseIds);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving exercises by IDs', {
        profileId: testProfileId,
        exerciseIds,
        count: exerciseIds.length,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercises retrieved successfully', {
        profileId: testProfileId,
        requested: exerciseIds.length,
        found: exercises.length,
      });
    });

    it('should return empty array when no exercises found', async () => {
      // Arrange
      const exerciseIds = ['non-existent-1', 'non-existent-2'];
      mockExerciseRepository.findByIds.mockResolvedValue([]);

      // Act
      const result = await exerciseService.getExercisesByIds(testProfileId, exerciseIds);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Exercises retrieved successfully', {
        profileId: testProfileId,
        requested: exerciseIds.length,
        found: 0,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const exerciseIds = [testExerciseId, 'exercise-2'];
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findByIds.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.getExercisesByIds(testProfileId, exerciseIds);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve exercises by IDs');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve exercises by IDs',
        repositoryError,
        {
          profileId: testProfileId,
          exerciseIds,
        }
      );
    });
  });

  describe('updateExercise', () => {
    const updates = {
      name: 'Updated Exercise Name',
      description: 'Updated description',
      difficulty: 'advanced' as const,
    };

    it('should successfully update an exercise', async () => {
      // Arrange
      const updatedExercise = testExercise.cloneWithUpdatedDetails(updates);
      mockExerciseRepository.findById.mockResolvedValue(testExercise);
      mockExerciseRepository.save.mockResolvedValue(updatedExercise);

      // Act
      const result = await exerciseService.updateExercise(testProfileId, testExerciseId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedExercise);
      expect(mockExerciseRepository.findById).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(expect.any(ExerciseModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Updating exercise', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
        updates,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise updated successfully', {
        exerciseId: updatedExercise.id,
        profileId: updatedExercise.profileId,
        name: updatedExercise.name,
      });
    });

    it('should return NotFoundError when exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      mockExerciseRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await exerciseService.updateExercise(testProfileId, nonExistentId, updates);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Exercise not found');
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Exercise not found for update', {
        profileId: testProfileId,
        exerciseId: nonExistentId,
      });
    });

    it('should return failure when updated exercise validation fails', async () => {
      // Arrange
      const invalidUpdates = { name: '' }; // Empty name should fail validation
      mockExerciseRepository.findById.mockResolvedValue(testExercise);
      vi.spyOn(ExerciseModel.prototype, 'validate').mockReturnValueOnce({
        success: false,
        error: { errors: ['Name is required'] },
      });

      // Act
      const result = await exerciseService.updateExercise(
        testProfileId,
        testExerciseId,
        invalidUpdates
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Exercise validation failed');
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Updated exercise validation failed',
        undefined,
        expect.objectContaining({
          profileId: testProfileId,
          exerciseId: testExerciseId,
          updates: invalidUpdates,
          errors: ['Name is required'],
        })
      );
    });

    it('should return failure when repository throws error on save', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findById.mockResolvedValue(testExercise);
      mockExerciseRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.updateExercise(testProfileId, testExerciseId, updates);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to update exercise');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update exercise', repositoryError, {
        profileId: testProfileId,
        exerciseId: testExerciseId,
        updates,
      });
    });
  });

  describe('addSubstitution', () => {
    const priority = 3;
    const reason = 'Better muscle activation';

    it('should successfully add a substitution to an exercise', async () => {
      // Arrange
      const updatedExercise = testExercise.cloneWithAddedSubstitution(
        testSubstituteId,
        priority,
        reason
      );
      mockExerciseRepository.findById
        .mockResolvedValueOnce(testExercise) // For original exercise
        .mockResolvedValueOnce(testSubstituteExercise); // For substitute exercise
      mockExerciseRepository.save.mockResolvedValue(updatedExercise);

      // Act
      const result = await exerciseService.addSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority,
        reason
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedExercise);
      expect(mockExerciseRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockExerciseRepository.findById).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockExerciseRepository.findById).toHaveBeenCalledWith(testProfileId, testSubstituteId);
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(expect.any(ExerciseModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Adding exercise substitution', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
        substituteExerciseId: testSubstituteId,
        priority,
        reason,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise substitution added successfully', {
        exerciseId: testExerciseId,
        substituteExerciseId: testSubstituteId,
        priority,
      });
    });

    it('should return NotFoundError when original exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      mockExerciseRepository.findById.mockResolvedValueOnce(undefined);

      // Act
      const result = await exerciseService.addSubstitution(
        testProfileId,
        nonExistentId,
        testSubstituteId,
        priority,
        reason
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Exercise not found');
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Exercise not found for substitution', {
        profileId: testProfileId,
        exerciseId: nonExistentId,
      });
    });

    it('should return NotFoundError when substitute exercise does not exist', async () => {
      // Arrange
      const nonExistentSubstituteId = 'non-existent-substitute';
      mockExerciseRepository.findById
        .mockResolvedValueOnce(testExercise) // For original exercise
        .mockResolvedValueOnce(undefined); // For substitute exercise

      // Act
      const result = await exerciseService.addSubstitution(
        testProfileId,
        testExerciseId,
        nonExistentSubstituteId,
        priority,
        reason
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Substitute exercise not found');
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Substitute exercise not found', {
        profileId: testProfileId,
        substituteExerciseId: nonExistentSubstituteId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findById
        .mockResolvedValueOnce(testExercise)
        .mockResolvedValueOnce(testSubstituteExercise);
      mockExerciseRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.addSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId,
        priority,
        reason
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to add exercise substitution');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to add exercise substitution',
        repositoryError,
        {
          profileId: testProfileId,
          exerciseId: testExerciseId,
          substituteExerciseId: testSubstituteId,
          priority,
        }
      );
    });
  });

  describe('removeSubstitution', () => {
    it('should successfully remove a substitution from an exercise', async () => {
      // Arrange
      const exerciseWithSub = testExercise.cloneWithAddedSubstitution(testSubstituteId, 3);
      const updatedExercise = exerciseWithSub.cloneWithRemovedSubstitution(testSubstituteId);
      mockExerciseRepository.findById.mockResolvedValue(exerciseWithSub);
      mockExerciseRepository.save.mockResolvedValue(updatedExercise);

      // Act
      const result = await exerciseService.removeSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedExercise);
      expect(mockExerciseRepository.findById).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(expect.any(ExerciseModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Removing exercise substitution', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
        substituteExerciseId: testSubstituteId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise substitution removed successfully', {
        exerciseId: testExerciseId,
        substituteExerciseId: testSubstituteId,
      });
    });

    it('should return NotFoundError when exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      mockExerciseRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await exerciseService.removeSubstitution(
        testProfileId,
        nonExistentId,
        testSubstituteId
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Exercise not found');
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Exercise not found for substitution removal', {
        profileId: testProfileId,
        exerciseId: nonExistentId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findById.mockResolvedValue(testExercise);
      mockExerciseRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.removeSubstitution(
        testProfileId,
        testExerciseId,
        testSubstituteId
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to remove exercise substitution');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to remove exercise substitution',
        repositoryError,
        {
          profileId: testProfileId,
          exerciseId: testExerciseId,
          substituteExerciseId: testSubstituteId,
        }
      );
    });
  });

  describe('deleteExercise', () => {
    it('should successfully delete an exercise', async () => {
      // Arrange
      mockExerciseRepository.findById.mockResolvedValue(testExercise);
      mockExerciseRepository.delete.mockResolvedValue();

      // Act
      const result = await exerciseService.deleteExercise(testProfileId, testExerciseId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockExerciseRepository.findById).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockExerciseRepository.delete).toHaveBeenCalledWith(testProfileId, testExerciseId);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting exercise permanently', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Exercise deleted successfully', {
        profileId: testProfileId,
        exerciseId: testExerciseId,
      });
    });

    it('should return NotFoundError when exercise does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      mockExerciseRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await exerciseService.deleteExercise(testProfileId, nonExistentId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Exercise not found');
      expect(mockExerciseRepository.delete).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Exercise not found for deletion', {
        profileId: testProfileId,
        exerciseId: nonExistentId,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockExerciseRepository.findById.mockResolvedValue(testExercise);
      mockExerciseRepository.delete.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.deleteExercise(testProfileId, testExerciseId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete exercise');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete exercise', repositoryError, {
        profileId: testProfileId,
        exerciseId: testExerciseId,
      });
    });
  });

  describe('saveBulkExercises', () => {
    it('should successfully save multiple exercises in bulk', async () => {
      // Arrange
      const exercises = [
        testExercise,
        createTestExerciseModel({ id: 'exercise-2', profileId: testProfileId }),
        createTestExerciseModel({ id: 'exercise-3', profileId: testProfileId }),
      ];
      mockExerciseRepository.saveBulk.mockResolvedValue();

      // Act
      const result = await exerciseService.saveBulkExercises(exercises);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockExerciseRepository.saveBulk).toHaveBeenCalledWith(exercises);
      expect(mockLogger.info).toHaveBeenCalledWith('Saving exercises in bulk', {
        count: exercises.length,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Bulk exercises saved successfully', {
        count: exercises.length,
      });
    });

    it('should return failure when any exercise validation fails', async () => {
      // Arrange
      const validExercise = testExercise;
      const invalidExercise = createTestExerciseModel({
        id: 'invalid-exercise',
        profileId: testProfileId,
      });
      const exercises = [validExercise, invalidExercise];

      // Mock validation: first exercise passes, second fails
      vi.spyOn(ExerciseModel.prototype, 'validate')
        .mockReturnValueOnce({ success: true })
        .mockReturnValueOnce({
          success: false,
          error: { errors: ['Invalid exercise data'] },
        });

      // Act
      const result = await exerciseService.saveBulkExercises(exercises);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Exercise validation failed');
      expect(mockExerciseRepository.saveBulk).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Bulk exercise validation failed',
        undefined,
        expect.objectContaining({
          exerciseId: invalidExercise.id,
          errors: ['Invalid exercise data'],
        })
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const exercises = [testExercise];
      const repositoryError = new Error('Database error');
      mockExerciseRepository.saveBulk.mockRejectedValue(repositoryError);

      // Act
      const result = await exerciseService.saveBulkExercises(exercises);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to save bulk exercises');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save bulk exercises',
        repositoryError,
        {
          count: exercises.length,
        }
      );
    });

    it('should handle empty exercises array', async () => {
      // Arrange
      const exercises: ExerciseModel[] = [];
      mockExerciseRepository.saveBulk.mockResolvedValue();

      // Act
      const result = await exerciseService.saveBulkExercises(exercises);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockExerciseRepository.saveBulk).toHaveBeenCalledWith(exercises);
      expect(mockLogger.info).toHaveBeenCalledWith('Saving exercises in bulk', {
        count: 0,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Bulk exercises saved successfully', {
        count: 0,
      });
    });
  });

  describe('immutability tests', () => {
    it('should not mutate the original exercise when updating', async () => {
      // Arrange
      const originalExercise = createTestExerciseModel({
        id: testExerciseId,
        profileId: testProfileId,
        name: 'Original Name',
      });
      const updates = { name: 'Updated Name' };
      const updatedExercise = originalExercise.cloneWithUpdatedDetails(updates);

      mockExerciseRepository.findById.mockResolvedValue(originalExercise);
      mockExerciseRepository.save.mockResolvedValue(updatedExercise);

      // Store original state
      const originalName = originalExercise.name;

      // Act
      await exerciseService.updateExercise(testProfileId, testExerciseId, updates);

      // Assert
      expect(originalExercise.name).toBe(originalName);
      expect(updatedExercise.name).toBe('Updated Name');
      expect(originalExercise).not.toBe(updatedExercise);
    });

    it('should not mutate the original exercise when adding substitution', async () => {
      // Arrange
      const originalExercise = createTestExerciseModel({
        id: testExerciseId,
        profileId: testProfileId,
        substitutions: [],
      });
      const substituteExercise = createTestExerciseModel({
        id: testSubstituteId,
        profileId: testProfileId,
      });
      const updatedExercise = originalExercise.cloneWithAddedSubstitution(testSubstituteId, 3);

      mockExerciseRepository.findById
        .mockResolvedValueOnce(originalExercise)
        .mockResolvedValueOnce(substituteExercise);
      mockExerciseRepository.save.mockResolvedValue(updatedExercise);

      // Store original substitutions count
      const originalSubstitutionsCount = originalExercise.substitutions.length;

      // Act
      await exerciseService.addSubstitution(testProfileId, testExerciseId, testSubstituteId, 3);

      // Assert
      expect(originalExercise.substitutions.length).toBe(originalSubstitutionsCount);
      expect(updatedExercise.substitutions.length).toBe(1);
      expect(originalExercise).not.toBe(updatedExercise);
    });
  });
});
