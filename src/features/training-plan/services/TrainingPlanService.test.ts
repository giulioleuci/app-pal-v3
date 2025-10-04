import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { ITrainingCycleRepository } from '@/features/training-plan/domain/ITrainingCycleRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { TrainingCycleModel } from '@/features/training-plan/domain/TrainingCycleModel';
import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { createTestTrainingCycleModel, createTestTrainingPlanModel } from '@/test-factories';

import { TrainingPlanService } from './TrainingPlanService';

describe('TrainingPlanService', () => {
  let trainingPlanService: TrainingPlanService;
  let mockTrainingPlanRepository: jest.Mocked<ITrainingPlanRepository>;
  let mockTrainingCycleRepository: jest.Mocked<ITrainingCycleRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testPlanId = '550e8400-e29b-41d4-a716-446655440002';
  const testCycleId = '550e8400-e29b-41d4-a716-446655440003';

  const testTrainingPlan = createTestTrainingPlanModel({
    id: testPlanId,
    profileId: testProfileId,
    name: 'Test Training Plan',
    description: 'A test training plan',
    cycleId: testCycleId,
    order: 1, // Required when cycleId is provided
  });

  const testTrainingCycle = createTestTrainingCycleModel({
    id: testCycleId,
    profileId: testProfileId,
    name: 'Test Training Cycle',
    goal: 'strength',
  });

  beforeEach(() => {
    // Clear all domain event handlers before each test
    DomainEvents.clearHandlers();

    // Create mocks
    mockTrainingPlanRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockTrainingCycleRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    trainingPlanService = new TrainingPlanService(
      mockTrainingPlanRepository,
      mockTrainingCycleRepository,
      mockLogger
    );

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    DomainEvents.clearHandlers();
  });

  describe('createTrainingPlan', () => {
    it('should create a training plan successfully', async () => {
      // Arrange
      const savedPlan = createTestTrainingPlanModel({
        id: '550e8400-e29b-41d4-a716-446655440000',
        profileId: testProfileId,
        name: 'New Training Plan',
        description: 'A new training plan',
      });

      mockTrainingPlanRepository.save.mockResolvedValue(savedPlan);

      // Act
      const result = await trainingPlanService.createTrainingPlan(
        testProfileId,
        'New Training Plan',
        'A new training plan'
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const value = result.getValue();
        expect(value.name).toBe('New Training Plan');
        expect(value.profileId).toBe(testProfileId);
        expect(value.description).toBe('A new training plan');
      }

      expect(mockTrainingPlanRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new training plan', {
        profileId: testProfileId,
        name: 'New Training Plan',
        cycleId: undefined,
      });
    });

    it('should create a training plan with valid cycle', async () => {
      // Arrange
      const savedPlan = createTestTrainingPlanModel({
        id: '550e8400-e29b-41d4-a716-446655440000',
        profileId: testProfileId,
        name: 'New Training Plan',
        cycleId: testCycleId,
      });

      mockTrainingCycleRepository.findById.mockResolvedValue(testTrainingCycle);
      mockTrainingPlanRepository.save.mockResolvedValue(savedPlan);

      // Act
      const result = await trainingPlanService.createTrainingPlan(
        testProfileId,
        'New Training Plan',
        undefined,
        testCycleId
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTrainingCycleRepository.findById).toHaveBeenCalledWith(testCycleId);
      expect(mockTrainingPlanRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail when cycle does not exist', async () => {
      // Arrange
      mockTrainingCycleRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await trainingPlanService.createTrainingPlan(
        testProfileId,
        'New Training Plan',
        undefined,
        'non-existent-cycle-id'
      );

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toBe('Training cycle not found');
      }

      expect(mockTrainingPlanRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository error during creation', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockTrainingPlanRepository.save.mockRejectedValue(dbError);

      // Act
      const result = await trainingPlanService.createTrainingPlan(
        testProfileId,
        'New Training Plan'
      );

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe('Failed to create training plan');
      }

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create training plan', dbError, {
        profileId: testProfileId,
        name: 'New Training Plan',
        cycleId: undefined,
      });
    });
  });

  describe('createTrainingCycle', () => {
    it('should create a training cycle successfully', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-01');
      const savedCycle = createTestTrainingCycleModel({
        id: '550e8400-e29b-41d4-a716-446655440000',
        profileId: testProfileId,
        name: 'New Cycle',
        goal: 'strength',
        startDate,
        endDate,
      });

      mockTrainingCycleRepository.save.mockResolvedValue(savedCycle);

      // Act
      const result = await trainingPlanService.createTrainingCycle(
        testProfileId,
        'New Cycle',
        startDate,
        endDate,
        'strength',
        'Test notes'
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const value = result.getValue();
        expect(value.name).toBe('New Cycle');
        expect(value.goal).toBe('strength');
      }

      expect(mockTrainingCycleRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle repository error during cycle creation', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-01');
      mockTrainingCycleRepository.save.mockRejectedValue(dbError);

      // Act
      const result = await trainingPlanService.createTrainingCycle(
        testProfileId,
        'New Cycle',
        startDate,
        endDate,
        'strength'
      );

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(ApplicationError);
      }

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create training cycle', dbError, {
        profileId: testProfileId,
        name: 'New Cycle',
        goal: 'strength',
      });
    });
  });

  describe('getTrainingPlan', () => {
    it('should retrieve a training plan successfully', async () => {
      // Arrange
      mockTrainingPlanRepository.findById.mockResolvedValue(testTrainingPlan);

      // Act
      const result = await trainingPlanService.getTrainingPlan(testPlanId);

      // Assert
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const value = result.getValue();
        expect(value).toEqual(testTrainingPlan);
      }

      expect(mockTrainingPlanRepository.findById).toHaveBeenCalledWith(testPlanId);
    });

    it('should fail when training plan does not exist', async () => {
      // Arrange
      mockTrainingPlanRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await trainingPlanService.getTrainingPlan('non-existent-id');

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
        expect(result.error.message).toBe('Training plan not found');
      }
    });
  });

  describe('getTrainingCycle', () => {
    it('should retrieve a training cycle successfully', async () => {
      // Arrange
      mockTrainingCycleRepository.findById.mockResolvedValue(testTrainingCycle);

      // Act
      const result = await trainingPlanService.getTrainingCycle(testCycleId);

      // Assert
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const value = result.getValue();
        expect(value).toEqual(testTrainingCycle);
      }

      expect(mockTrainingCycleRepository.findById).toHaveBeenCalledWith(testCycleId);
    });

    it('should fail when training cycle does not exist', async () => {
      // Arrange
      mockTrainingCycleRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await trainingPlanService.getTrainingCycle('non-existent-id');

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('updateTrainingPlan', () => {
    it('should update training plan details successfully', async () => {
      // Arrange
      const updates = {
        name: 'Updated Plan Name',
        description: 'Updated description',
      };

      const updatedPlan = testTrainingPlan.cloneWithUpdatedDetails(updates);
      mockTrainingPlanRepository.findById.mockResolvedValue(testTrainingPlan);
      mockTrainingPlanRepository.save.mockResolvedValue(updatedPlan);

      // Act
      const result = await trainingPlanService.updateTrainingPlan(testPlanId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTrainingPlanRepository.findById).toHaveBeenCalledWith(testPlanId);
      expect(mockTrainingPlanRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update training plan cycle assignment', async () => {
      // Arrange
      const newCycleId = '550e8400-e29b-41d4-a716-446655440004';
      const updates = { cycleId: newCycleId };

      const newCycle = createTestTrainingCycleModel({
        id: newCycleId,
        profileId: testProfileId,
        name: 'New Test Cycle',
        goal: 'strength',
      });

      const updatedPlan = testTrainingPlan.cloneWithAssignedCycle(newCycleId);
      mockTrainingPlanRepository.findById.mockResolvedValue(testTrainingPlan);
      mockTrainingCycleRepository.findById.mockResolvedValue(newCycle);
      mockTrainingPlanRepository.save.mockResolvedValue(updatedPlan);

      // Act
      const result = await trainingPlanService.updateTrainingPlan(testPlanId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTrainingCycleRepository.findById).toHaveBeenCalledWith(newCycleId);
    });

    it('should remove cycle assignment when set to null', async () => {
      // Arrange
      const updates = { cycleId: null };
      const updatedPlan = testTrainingPlan.cloneWithRemovedCycle();

      mockTrainingPlanRepository.findById.mockResolvedValue(testTrainingPlan);
      mockTrainingPlanRepository.save.mockResolvedValue(updatedPlan);

      // Act
      const result = await trainingPlanService.updateTrainingPlan(testPlanId, updates);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTrainingCycleRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when training plan does not exist', async () => {
      // Arrange
      mockTrainingPlanRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await trainingPlanService.updateTrainingPlan(testPlanId, {
        name: 'Updated Name',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('archiveTrainingPlan', () => {
    it('should archive training plan successfully', async () => {
      // Arrange
      const archivedPlan = testTrainingPlan.cloneAsArchived();
      mockTrainingPlanRepository.findById.mockResolvedValue(testTrainingPlan);
      mockTrainingPlanRepository.save.mockResolvedValue(archivedPlan);

      // Act
      const result = await trainingPlanService.archiveTrainingPlan(testPlanId);

      // Assert
      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        const value = result.getValue();
        expect(value.isArchived).toBe(true);
      }

      expect(mockTrainingPlanRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteTrainingPlan', () => {
    it('should delete training plan successfully', async () => {
      // Arrange
      mockTrainingPlanRepository.findById.mockResolvedValue(testTrainingPlan);
      mockTrainingPlanRepository.delete.mockResolvedValue();

      // Act
      const result = await trainingPlanService.deleteTrainingPlan(testPlanId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTrainingPlanRepository.delete).toHaveBeenCalledWith(testPlanId);
    });

    it('should fail when training plan does not exist', async () => {
      // Arrange
      mockTrainingPlanRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await trainingPlanService.deleteTrainingPlan('non-existent-id');

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }

      expect(mockTrainingPlanRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteTrainingCycle', () => {
    it('should delete training cycle and update associated plans', async () => {
      // Arrange
      const plansInCycle = [testTrainingPlan];
      const updatedPlan = testTrainingPlan.cloneWithRemovedCycle();

      mockTrainingCycleRepository.findById.mockResolvedValue(testTrainingCycle);
      mockTrainingPlanRepository.findAll.mockResolvedValue(plansInCycle);
      mockTrainingPlanRepository.save.mockResolvedValue(updatedPlan);
      mockTrainingCycleRepository.delete.mockResolvedValue();

      // Act
      const result = await trainingPlanService.deleteTrainingCycle(testCycleId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTrainingPlanRepository.findAll).toHaveBeenCalledWith(testProfileId, {
        cycleId: testCycleId,
      });
      expect(mockTrainingPlanRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTrainingCycleRepository.delete).toHaveBeenCalledWith(testCycleId);
    });

    it('should fail when training cycle does not exist', async () => {
      // Arrange
      mockTrainingCycleRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await trainingPlanService.deleteTrainingCycle('non-existent-id');

      // Assert
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }

      expect(mockTrainingCycleRepository.delete).not.toHaveBeenCalled();
    });
  });
});
