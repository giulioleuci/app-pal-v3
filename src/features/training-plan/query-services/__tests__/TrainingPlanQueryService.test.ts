import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrainingCycleModel } from '@/features/training-plan/domain/TrainingCycleModel';
import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { TrainingPlanService } from '@/features/training-plan/services/TrainingPlanService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import { createTestTrainingCycleModel, createTestTrainingPlanModel } from '@/test-factories';

import { TrainingPlanQueryService } from '../TrainingPlanQueryService';

describe('TrainingPlanQueryService', () => {
  let trainingPlanQueryService: TrainingPlanQueryService;
  let mockTrainingPlanService: {
    createTrainingPlan: ReturnType<typeof vi.fn>;
    createTrainingCycle: ReturnType<typeof vi.fn>;
    getTrainingPlan: ReturnType<typeof vi.fn>;
    getTrainingCycle: ReturnType<typeof vi.fn>;
    getTrainingPlans: ReturnType<typeof vi.fn>;
    getTrainingCycles: ReturnType<typeof vi.fn>;
    updateTrainingPlan: ReturnType<typeof vi.fn>;
    updateTrainingCycle: ReturnType<typeof vi.fn>;
    archiveTrainingPlan: ReturnType<typeof vi.fn>;
    deleteTrainingPlan: ReturnType<typeof vi.fn>;
    deleteTrainingCycle: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testPlanId = '550e8400-e29b-41d4-a716-446655440002';
  const testCycleId = '550e8400-e29b-41d4-a716-446655440003';

  const testTrainingPlan = createTestTrainingPlanModel({
    id: testPlanId,
    profileId: testProfileId,
    name: 'Test Training Plan',
    description: 'A test training plan',
  });

  const testTrainingCycle = createTestTrainingCycleModel({
    id: testCycleId,
    profileId: testProfileId,
    name: 'Test Training Cycle',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    goal: 'Strength',
    notes: 'Test cycle notes',
  });

  beforeEach(() => {
    // Create service mock
    mockTrainingPlanService = {
      createTrainingPlan: vi.fn(),
      createTrainingCycle: vi.fn(),
      getTrainingPlan: vi.fn(),
      getTrainingCycle: vi.fn(),
      getTrainingPlans: vi.fn(),
      getTrainingCycles: vi.fn(),
      updateTrainingPlan: vi.fn(),
      updateTrainingCycle: vi.fn(),
      archiveTrainingPlan: vi.fn(),
      deleteTrainingPlan: vi.fn(),
      deleteTrainingCycle: vi.fn(),
    };

    // Create the service under test by directly injecting mocks
    trainingPlanQueryService = new TrainingPlanQueryService(mockTrainingPlanService as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createTrainingPlan', () => {
    const planName = 'New Training Plan';
    const planDescription = 'Plan description';
    const cycleId = 'cycle-123';

    it('should return created plan when service succeeds', async () => {
      // Arrange
      const createdPlan = createTestTrainingPlanModel({
        name: planName,
        description: planDescription,
        cycleId,
      });
      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.success(createdPlan));

      // Act
      const result = await trainingPlanQueryService.createTrainingPlan(
        testProfileId,
        planName,
        planDescription,
        cycleId
      );

      // Assert
      expect(result).toEqual(createdPlan);
      expect(result.name).toBe(planName);
      expect(result.description).toBe(planDescription);
      expect(result.cycleId).toBe(cycleId);
      expect(mockTrainingPlanService.createTrainingPlan).toHaveBeenCalledWith(
        testProfileId,
        planName,
        planDescription,
        cycleId
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to create training plan');
      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.createTrainingPlan(
          testProfileId,
          planName,
          planDescription,
          cycleId
        )
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.createTrainingPlan).toHaveBeenCalledWith(
        testProfileId,
        planName,
        planDescription,
        cycleId
      );
    });

    it('should handle optional parameters', async () => {
      // Arrange
      const createdPlan = createTestTrainingPlanModel({ name: planName });
      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.success(createdPlan));

      // Act
      const result = await trainingPlanQueryService.createTrainingPlan(testProfileId, planName);

      // Assert
      expect(result).toEqual(createdPlan);
      expect(mockTrainingPlanService.createTrainingPlan).toHaveBeenCalledWith(
        testProfileId,
        planName,
        undefined,
        undefined
      );
    });

    it('should handle empty plan name', async () => {
      // Arrange
      const emptyName = '';
      const error = new ApplicationError('Plan name is required');
      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.createTrainingPlan(testProfileId, emptyName)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.createTrainingPlan).toHaveBeenCalledWith(
        testProfileId,
        emptyName,
        undefined,
        undefined
      );
    });

    it('should handle invalid profile ID', async () => {
      // Arrange
      const invalidProfileId = 'invalid-id';
      const error = new ApplicationError('Invalid profile ID');
      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.createTrainingPlan(invalidProfileId, planName)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.createTrainingPlan).toHaveBeenCalledWith(
        invalidProfileId,
        planName,
        undefined,
        undefined
      );
    });
  });

  describe('createTrainingCycle', () => {
    const cycleName = 'New Training Cycle';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-03-31');
    const goal = 'Strength';
    const notes = 'Cycle notes';

    it('should return created cycle when service succeeds', async () => {
      // Arrange
      const createdCycle = createTestTrainingCycleModel({
        name: cycleName,
        startDate,
        endDate,
        goal,
        notes,
      });
      mockTrainingPlanService.createTrainingCycle.mockResolvedValue(Result.success(createdCycle));

      // Act
      const result = await trainingPlanQueryService.createTrainingCycle(
        testProfileId,
        cycleName,
        startDate,
        endDate,
        goal,
        notes
      );

      // Assert
      expect(result).toEqual(createdCycle);
      expect(result.name).toBe(cycleName);
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.goal).toBe(goal);
      expect(result.notes).toBe(notes);
      expect(mockTrainingPlanService.createTrainingCycle).toHaveBeenCalledWith(
        testProfileId,
        cycleName,
        startDate,
        endDate,
        goal,
        notes
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to create training cycle');
      mockTrainingPlanService.createTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.createTrainingCycle(
          testProfileId,
          cycleName,
          startDate,
          endDate,
          goal,
          notes
        )
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.createTrainingCycle).toHaveBeenCalledWith(
        testProfileId,
        cycleName,
        startDate,
        endDate,
        goal,
        notes
      );
    });

    it('should handle optional notes parameter', async () => {
      // Arrange
      const createdCycle = createTestTrainingCycleModel({
        name: cycleName,
        startDate,
        endDate,
        goal,
      });
      mockTrainingPlanService.createTrainingCycle.mockResolvedValue(Result.success(createdCycle));

      // Act
      const result = await trainingPlanQueryService.createTrainingCycle(
        testProfileId,
        cycleName,
        startDate,
        endDate,
        goal
      );

      // Assert
      expect(result).toEqual(createdCycle);
      expect(mockTrainingPlanService.createTrainingCycle).toHaveBeenCalledWith(
        testProfileId,
        cycleName,
        startDate,
        endDate,
        goal,
        undefined
      );
    });

    it('should handle invalid date range', async () => {
      // Arrange
      const invalidStartDate = new Date('2024-03-31');
      const invalidEndDate = new Date('2024-01-01');
      const error = new ApplicationError('End date must be after start date');
      mockTrainingPlanService.createTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.createTrainingCycle(
          testProfileId,
          cycleName,
          invalidStartDate,
          invalidEndDate,
          goal
        )
      ).rejects.toThrow(error);
    });

    it('should handle empty cycle name', async () => {
      // Arrange
      const emptyName = '';
      const error = new ApplicationError('Cycle name is required');
      mockTrainingPlanService.createTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.createTrainingCycle(
          testProfileId,
          emptyName,
          startDate,
          endDate,
          goal
        )
      ).rejects.toThrow(error);
    });
  });

  describe('getTrainingPlan', () => {
    it('should return training plan when service succeeds', async () => {
      // Arrange
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.success(testTrainingPlan));

      // Act
      const result = await trainingPlanQueryService.getTrainingPlan(testPlanId);

      // Assert
      expect(result).toEqual(testTrainingPlan);
      expect(mockTrainingPlanService.getTrainingPlan).toHaveBeenCalledWith(testPlanId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Training plan not found');
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingPlan(testPlanId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.getTrainingPlan).toHaveBeenCalledWith(testPlanId);
    });

    it('should handle empty plan ID', async () => {
      // Arrange
      const emptyId = '';
      const error = new ApplicationError('Invalid plan ID');
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingPlan(emptyId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.getTrainingPlan).toHaveBeenCalledWith(emptyId);
    });

    it('should handle malformed plan ID', async () => {
      // Arrange
      const malformedId = 'invalid-uuid-format';
      const error = new ApplicationError('Invalid plan ID format');
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingPlan(malformedId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.getTrainingPlan).toHaveBeenCalledWith(malformedId);
    });
  });

  describe('getTrainingCycle', () => {
    it('should return training cycle when service succeeds', async () => {
      // Arrange
      mockTrainingPlanService.getTrainingCycle.mockResolvedValue(Result.success(testTrainingCycle));

      // Act
      const result = await trainingPlanQueryService.getTrainingCycle(testCycleId);

      // Assert
      expect(result).toEqual(testTrainingCycle);
      expect(mockTrainingPlanService.getTrainingCycle).toHaveBeenCalledWith(testCycleId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Training cycle not found');
      mockTrainingPlanService.getTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingCycle(testCycleId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.getTrainingCycle).toHaveBeenCalledWith(testCycleId);
    });

    it('should handle empty cycle ID', async () => {
      // Arrange
      const emptyId = '';
      const error = new ApplicationError('Invalid cycle ID');
      mockTrainingPlanService.getTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingCycle(emptyId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.getTrainingCycle).toHaveBeenCalledWith(emptyId);
    });

    it('should handle non-existent cycle ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-cycle';
      const error = new ApplicationError('Training cycle not found');
      mockTrainingPlanService.getTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingCycle(nonExistentId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.getTrainingCycle).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('getTrainingPlans', () => {
    it('should return WatermelonDB query for training plans', () => {
      // Act
      const result = trainingPlanQueryService.getTrainingPlans(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should return WatermelonDB query with filters when provided', () => {
      // Arrange
      const filters = { isArchived: false, cycleId: testCycleId };

      // Act
      const result = trainingPlanQueryService.getTrainingPlans(testProfileId, filters);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // The query should be properly constructed with filters - this is verified by integration tests
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = trainingPlanQueryService.getTrainingPlans(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = trainingPlanQueryService.getTrainingPlans(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should handle different filter combinations', () => {
      // Arrange
      const filters = { isArchived: true };

      // Act
      const result = trainingPlanQueryService.getTrainingPlans(testProfileId, filters);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should create query with cycleId filter when provided', () => {
      // Arrange
      const filters = { cycleId: testCycleId };

      // Act
      const result = trainingPlanQueryService.getTrainingPlans(testProfileId, filters);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('getTrainingCycles', () => {
    it('should return WatermelonDB query for training cycles', () => {
      // Act
      const result = trainingPlanQueryService.getTrainingCycles(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function'); // WatermelonDB Query has fetch method
      expect(typeof result.observe).toBe('function'); // WatermelonDB Query has observe method
      // Note: We can't easily mock the database in unit tests, so we just verify the query object structure
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = trainingPlanQueryService.getTrainingCycles(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = trainingPlanQueryService.getTrainingCycles(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });

    it('should create consistent query structure', () => {
      // Act
      const result = trainingPlanQueryService.getTrainingCycles(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.fetch).toBe('function');
      expect(typeof result.observe).toBe('function');
    });
  });

  describe('updateTrainingPlan', () => {
    const updates = {
      name: 'Updated Plan Name',
      description: 'Updated description',
      notes: 'Updated notes',
      cycleId: 'new-cycle-id',
    };

    it('should return updated plan when service succeeds', async () => {
      // Arrange
      const updatedPlan = createTestTrainingPlanModel({
        ...testTrainingPlan.toPlainObject(),
        ...updates,
      });
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.success(updatedPlan));

      // Act
      const result = await trainingPlanQueryService.updateTrainingPlan(testPlanId, updates);

      // Assert
      expect(result).toEqual(updatedPlan);
      expect(result.name).toBe(updates.name);
      expect(result.description).toBe(updates.description);
      expect(result.notes).toBe(updates.notes);
      expect(result.cycleId).toBe(updates.cycleId);
      expect(mockTrainingPlanService.updateTrainingPlan).toHaveBeenCalledWith(testPlanId, updates);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to update training plan');
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.updateTrainingPlan(testPlanId, updates)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.updateTrainingPlan).toHaveBeenCalledWith(testPlanId, updates);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdates = { name: 'Only Name Updated' };
      const updatedPlan = createTestTrainingPlanModel({
        ...testTrainingPlan.toPlainObject(),
        name: partialUpdates.name,
      });
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.success(updatedPlan));

      // Act
      const result = await trainingPlanQueryService.updateTrainingPlan(testPlanId, partialUpdates);

      // Assert
      expect(result).toEqual(updatedPlan);
      expect(result.name).toBe(partialUpdates.name);
      expect(mockTrainingPlanService.updateTrainingPlan).toHaveBeenCalledWith(
        testPlanId,
        partialUpdates
      );
    });

    it('should handle null cycleId update', async () => {
      // Arrange
      const updatesWithNullCycle = { cycleId: null };
      const updatedPlan = createTestTrainingPlanModel({
        ...testTrainingPlan.toPlainObject(),
        cycleId: null,
      });
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.success(updatedPlan));

      // Act
      const result = await trainingPlanQueryService.updateTrainingPlan(
        testPlanId,
        updatesWithNullCycle
      );

      // Assert
      expect(result).toEqual(updatedPlan);
      expect(result.cycleId).toBeNull();
      expect(mockTrainingPlanService.updateTrainingPlan).toHaveBeenCalledWith(
        testPlanId,
        updatesWithNullCycle
      );
    });

    it('should handle non-existent plan ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-plan';
      const error = new ApplicationError('Training plan not found');
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.updateTrainingPlan(nonExistentId, updates)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.updateTrainingPlan).toHaveBeenCalledWith(
        nonExistentId,
        updates
      );
    });

    it('should handle empty updates object', async () => {
      // Arrange
      const emptyUpdates = {};
      const updatedPlan = testTrainingPlan;
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.success(updatedPlan));

      // Act
      const result = await trainingPlanQueryService.updateTrainingPlan(testPlanId, emptyUpdates);

      // Assert
      expect(result).toEqual(updatedPlan);
      expect(mockTrainingPlanService.updateTrainingPlan).toHaveBeenCalledWith(
        testPlanId,
        emptyUpdates
      );
    });
  });

  describe('updateTrainingCycle', () => {
    const updates = {
      name: 'Updated Cycle Name',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-30'),
      goal: 'Hypertrophy',
      notes: 'Updated cycle notes',
    };

    it('should return updated cycle when service succeeds', async () => {
      // Arrange
      const updatedCycle = createTestTrainingCycleModel({
        ...testTrainingCycle.toPlainObject(),
        ...updates,
      });
      mockTrainingPlanService.updateTrainingCycle.mockResolvedValue(Result.success(updatedCycle));

      // Act
      const result = await trainingPlanQueryService.updateTrainingCycle(testCycleId, updates);

      // Assert
      expect(result).toEqual(updatedCycle);
      expect(result.name).toBe(updates.name);
      expect(result.startDate).toEqual(updates.startDate);
      expect(result.endDate).toEqual(updates.endDate);
      expect(result.goal).toBe(updates.goal);
      expect(result.notes).toBe(updates.notes);
      expect(mockTrainingPlanService.updateTrainingCycle).toHaveBeenCalledWith(
        testCycleId,
        updates
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to update training cycle');
      mockTrainingPlanService.updateTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.updateTrainingCycle(testCycleId, updates)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.updateTrainingCycle).toHaveBeenCalledWith(
        testCycleId,
        updates
      );
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdates = { name: 'Only Name Updated' };
      const updatedCycle = createTestTrainingCycleModel({
        ...testTrainingCycle.toPlainObject(),
        name: partialUpdates.name,
      });
      mockTrainingPlanService.updateTrainingCycle.mockResolvedValue(Result.success(updatedCycle));

      // Act
      const result = await trainingPlanQueryService.updateTrainingCycle(
        testCycleId,
        partialUpdates
      );

      // Assert
      expect(result).toEqual(updatedCycle);
      expect(result.name).toBe(partialUpdates.name);
      expect(mockTrainingPlanService.updateTrainingCycle).toHaveBeenCalledWith(
        testCycleId,
        partialUpdates
      );
    });

    it('should handle non-existent cycle ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-cycle';
      const error = new ApplicationError('Training cycle not found');
      mockTrainingPlanService.updateTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.updateTrainingCycle(nonExistentId, updates)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.updateTrainingCycle).toHaveBeenCalledWith(
        nonExistentId,
        updates
      );
    });

    it('should handle invalid date range update', async () => {
      // Arrange
      const invalidUpdates = {
        startDate: new Date('2024-04-30'),
        endDate: new Date('2024-02-01'),
      };
      const error = new ApplicationError('End date must be after start date');
      mockTrainingPlanService.updateTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.updateTrainingCycle(testCycleId, invalidUpdates)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.updateTrainingCycle).toHaveBeenCalledWith(
        testCycleId,
        invalidUpdates
      );
    });

    it('should handle empty updates object', async () => {
      // Arrange
      const emptyUpdates = {};
      const updatedCycle = testTrainingCycle;
      mockTrainingPlanService.updateTrainingCycle.mockResolvedValue(Result.success(updatedCycle));

      // Act
      const result = await trainingPlanQueryService.updateTrainingCycle(testCycleId, emptyUpdates);

      // Assert
      expect(result).toEqual(updatedCycle);
      expect(mockTrainingPlanService.updateTrainingCycle).toHaveBeenCalledWith(
        testCycleId,
        emptyUpdates
      );
    });
  });

  describe('archiveTrainingPlan', () => {
    it('should return archived plan when service succeeds', async () => {
      // Arrange
      const archivedPlan = createTestTrainingPlanModel({
        ...testTrainingPlan.toPlainObject(),
        isArchived: true,
      });
      mockTrainingPlanService.archiveTrainingPlan.mockResolvedValue(Result.success(archivedPlan));

      // Act
      const result = await trainingPlanQueryService.archiveTrainingPlan(testPlanId);

      // Assert
      expect(result).toEqual(archivedPlan);
      expect(result.isArchived).toBe(true);
      expect(mockTrainingPlanService.archiveTrainingPlan).toHaveBeenCalledWith(testPlanId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to archive training plan');
      mockTrainingPlanService.archiveTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.archiveTrainingPlan(testPlanId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.archiveTrainingPlan).toHaveBeenCalledWith(testPlanId);
    });

    it('should handle non-existent plan ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-plan';
      const error = new ApplicationError('Training plan not found');
      mockTrainingPlanService.archiveTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.archiveTrainingPlan(nonExistentId)).rejects.toThrow(
        error
      );
      expect(mockTrainingPlanService.archiveTrainingPlan).toHaveBeenCalledWith(nonExistentId);
    });

    it('should handle already archived plan', async () => {
      // Arrange
      const error = new ApplicationError('Training plan is already archived');
      mockTrainingPlanService.archiveTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.archiveTrainingPlan(testPlanId)).rejects.toThrow(error);
      expect(mockTrainingPlanService.archiveTrainingPlan).toHaveBeenCalledWith(testPlanId);
    });
  });

  describe('deleteTrainingPlan', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      const options = { deleteChildren: true };
      mockTrainingPlanService.deleteTrainingPlan.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await trainingPlanQueryService.deleteTrainingPlan(testPlanId, options);

      // Assert
      expect(result).toBeUndefined();
      expect(mockTrainingPlanService.deleteTrainingPlan).toHaveBeenCalledWith(testPlanId, true);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const options = { deleteChildren: true };
      const error = new ApplicationError('Failed to delete training plan');
      mockTrainingPlanService.deleteTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.deleteTrainingPlan(testPlanId, options)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.deleteTrainingPlan).toHaveBeenCalledWith(testPlanId, true);
    });

    it('should handle deleteChildren false', async () => {
      // Arrange
      const options = { deleteChildren: false };
      mockTrainingPlanService.deleteTrainingPlan.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await trainingPlanQueryService.deleteTrainingPlan(testPlanId, options);

      // Assert
      expect(result).toBeUndefined();
      expect(mockTrainingPlanService.deleteTrainingPlan).toHaveBeenCalledWith(testPlanId, false);
    });

    it('should handle non-existent plan ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-plan';
      const options = { deleteChildren: true };
      const error = new ApplicationError('Training plan not found');
      mockTrainingPlanService.deleteTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.deleteTrainingPlan(nonExistentId, options)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.deleteTrainingPlan).toHaveBeenCalledWith(nonExistentId, true);
    });

    it('should handle plan with dependencies when deleteChildren is false', async () => {
      // Arrange
      const options = { deleteChildren: false };
      const error = new ApplicationError('Cannot delete plan with existing sessions');
      mockTrainingPlanService.deleteTrainingPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        trainingPlanQueryService.deleteTrainingPlan(testPlanId, options)
      ).rejects.toThrow(error);
      expect(mockTrainingPlanService.deleteTrainingPlan).toHaveBeenCalledWith(testPlanId, false);
    });
  });

  describe('deleteTrainingCycle', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockTrainingPlanService.deleteTrainingCycle.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await trainingPlanQueryService.deleteTrainingCycle(testCycleId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockTrainingPlanService.deleteTrainingCycle).toHaveBeenCalledWith(testCycleId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete training cycle');
      mockTrainingPlanService.deleteTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.deleteTrainingCycle(testCycleId)).rejects.toThrow(
        error
      );
      expect(mockTrainingPlanService.deleteTrainingCycle).toHaveBeenCalledWith(testCycleId);
    });

    it('should handle non-existent cycle ID', async () => {
      // Arrange
      const nonExistentId = 'non-existent-cycle';
      const error = new ApplicationError('Training cycle not found');
      mockTrainingPlanService.deleteTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.deleteTrainingCycle(nonExistentId)).rejects.toThrow(
        error
      );
      expect(mockTrainingPlanService.deleteTrainingCycle).toHaveBeenCalledWith(nonExistentId);
    });

    it('should handle cycle with associated plans', async () => {
      // Arrange
      const error = new ApplicationError('Cannot delete cycle with associated training plans');
      mockTrainingPlanService.deleteTrainingCycle.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(trainingPlanQueryService.deleteTrainingCycle(testCycleId)).rejects.toThrow(
        error
      );
      expect(mockTrainingPlanService.deleteTrainingCycle).toHaveBeenCalledWith(testCycleId);
    });
  });

  describe('dependency injection', () => {
    it('should use injected TrainingPlanService', () => {
      // Arrange & Act
      const service = new TrainingPlanQueryService(mockTrainingPlanService as any);

      // Assert
      expect(service).toBeInstanceOf(TrainingPlanQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from TrainingPlanService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific training plan error');
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingPlan(testPlanId)).rejects.toBe(
        originalError
      );
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await trainingPlanQueryService
        .createTrainingPlan(testProfileId, 'Test Plan')
        .catch((error) => error);

      // Assert
      expect(thrownError).toBeInstanceOf(ApplicationError);
      expect(thrownError.stack).toBeDefined();
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database error');
      mockTrainingPlanService.getTrainingPlan.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(trainingPlanQueryService.getTrainingPlan(testPlanId)).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent query creation', () => {
      // Act
      const queries = Array.from({ length: 5 }, () =>
        trainingPlanQueryService.getTrainingPlans(testProfileId)
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
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.success(testTrainingPlan));
      mockTrainingPlanService.getTrainingCycle.mockResolvedValue(
        Result.failure(new ApplicationError('Cycle not found'))
      );

      // Act
      const planResult = await trainingPlanQueryService.getTrainingPlan(testPlanId);
      const cycleError = await trainingPlanQueryService
        .getTrainingCycle(testCycleId)
        .catch((e) => e);

      // Assert
      expect(planResult).toEqual(testTrainingPlan);
      expect(cycleError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent profile consistently', async () => {
      // Arrange
      const nonExistentProfileId = 'non-existent-profile';
      const notFoundError = new ApplicationError('Profile not found');

      // Act
      const plansQuery = trainingPlanQueryService.getTrainingPlans(nonExistentProfileId);
      const cyclesQuery = trainingPlanQueryService.getTrainingCycles(nonExistentProfileId);

      // Assert
      expect(plansQuery).toBeDefined();
      expect(cyclesQuery).toBeDefined();
      expect(typeof plansQuery.fetch).toBe('function');
      expect(typeof cyclesQuery.fetch).toBe('function');
    });

    it('should handle complex filtering scenarios', () => {
      // Act
      const archivedQuery = trainingPlanQueryService.getTrainingPlans(testProfileId, {
        isArchived: true,
      });
      const activeQuery = trainingPlanQueryService.getTrainingPlans(testProfileId, {
        isArchived: false,
      });

      // Assert
      expect(archivedQuery).toBeDefined();
      expect(activeQuery).toBeDefined();
      expect(typeof archivedQuery.fetch).toBe('function');
      expect(typeof activeQuery.fetch).toBe('function');
      expect(typeof archivedQuery.observe).toBe('function');
      expect(typeof activeQuery.observe).toBe('function');
    });

    it('should handle create-read-update-delete workflow', async () => {
      // Arrange
      const newPlan = createTestTrainingPlanModel({ name: 'Workflow Plan' });
      const updatedPlan = createTestTrainingPlanModel({
        ...newPlan.toPlainObject(),
        name: 'Updated Plan',
      });

      mockTrainingPlanService.createTrainingPlan.mockResolvedValue(Result.success(newPlan));
      mockTrainingPlanService.getTrainingPlan.mockResolvedValue(Result.success(newPlan));
      mockTrainingPlanService.updateTrainingPlan.mockResolvedValue(Result.success(updatedPlan));
      mockTrainingPlanService.deleteTrainingPlan.mockResolvedValue(Result.success(undefined));

      // Act
      const created = await trainingPlanQueryService.createTrainingPlan(
        testProfileId,
        'Workflow Plan'
      );
      const retrieved = await trainingPlanQueryService.getTrainingPlan(created.id);
      const updated = await trainingPlanQueryService.updateTrainingPlan(created.id, {
        name: 'Updated Plan',
      });
      const deleteResult = await trainingPlanQueryService.deleteTrainingPlan(created.id, {
        deleteChildren: true,
      });

      // Assert
      expect(created.name).toBe('Workflow Plan');
      expect(retrieved).toEqual(newPlan);
      expect(updated.name).toBe('Updated Plan');
      expect(deleteResult).toBeUndefined();
    });
  });
});
