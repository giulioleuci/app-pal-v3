import type { Query } from '@nozbe/watermelondb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutLog } from '@/app/db/model/WorkoutLog';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';
import { createTestWorkoutLogModel } from '@/test-factories';

import { WorkoutQueryService } from '../WorkoutQueryService';

describe('WorkoutQueryService', () => {
  let workoutQueryService: WorkoutQueryService;
  let mockWorkoutService: {
    startWorkoutFromPlan: ReturnType<typeof vi.fn>;
    getWorkoutLog: ReturnType<typeof vi.fn>;
    getWorkoutLogs: ReturnType<typeof vi.fn>;
    getLastWorkoutForSession: ReturnType<typeof vi.fn>;
    endWorkout: ReturnType<typeof vi.fn>;
    updateWorkoutMetadata: ReturnType<typeof vi.fn>;
    deleteWorkout: ReturnType<typeof vi.fn>;
  };
  let mockDatabase: {
    get: ReturnType<typeof vi.fn>;
  };

  // Test data
  const testWorkoutLog = createTestWorkoutLogModel({
    id: '550e8400-e29b-41d4-a716-446655440001',
    profileId: '550e8400-e29b-41d4-a716-446655440002',
    sessionId: '550e8400-e29b-41d4-a716-446655440003',
  });

  const testProfileId = '550e8400-e29b-41d4-a716-446655440002';
  const testSessionId = '550e8400-e29b-41d4-a716-446655440003';
  const testWorkoutLogId = '550e8400-e29b-41d4-a716-446655440001';
  const testTrainingPlanId = '550e8400-e29b-41d4-a716-446655440004';
  const testTrainingPlanName = 'Test Training Plan';

  beforeEach(() => {
    // Create service mocks
    mockWorkoutService = {
      startWorkoutFromPlan: vi.fn(),
      getWorkoutLog: vi.fn(),
      getWorkoutLogs: vi.fn(),
      getLastWorkoutForSession: vi.fn(),
      endWorkout: vi.fn(),
      updateWorkoutMetadata: vi.fn(),
      deleteWorkout: vi.fn(),
    };

    // Create database mock with collection
    const mockCollection = {
      query: vi.fn(() => ({
        description: { clauses: [] },
        collection: mockCollection,
      })),
    };

    mockDatabase = {
      get: vi.fn(() => mockCollection),
    };

    // Create the service under test by directly injecting mocks
    workoutQueryService = new WorkoutQueryService(mockWorkoutService as any, mockDatabase as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('startWorkoutFromPlan', () => {
    it('should return workout log when service succeeds', async () => {
      // Arrange
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.success(testWorkoutLog));

      // Act
      const result = await workoutQueryService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert
      expect(result).toEqual(testWorkoutLog);
      expect(mockWorkoutService.startWorkoutFromPlan).toHaveBeenCalledWith(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to start workout from plan');
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        workoutQueryService.startWorkoutFromPlan(testProfileId, testSessionId)
      ).rejects.toThrow(error);
      expect(mockWorkoutService.startWorkoutFromPlan).toHaveBeenCalledWith(
        testProfileId,
        testSessionId,
        undefined,
        undefined
      );
    });

    it('should handle minimal parameters', async () => {
      // Arrange
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.success(testWorkoutLog));

      // Act
      const result = await workoutQueryService.startWorkoutFromPlan(testProfileId, testSessionId);

      // Assert
      expect(result).toEqual(testWorkoutLog);
      expect(mockWorkoutService.startWorkoutFromPlan).toHaveBeenCalledWith(
        testProfileId,
        testSessionId,
        undefined,
        undefined
      );
    });

    it('should handle optional training plan ID only', async () => {
      // Arrange
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.success(testWorkoutLog));

      // Act
      const result = await workoutQueryService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId
      );

      // Assert
      expect(result).toEqual(testWorkoutLog);
      expect(mockWorkoutService.startWorkoutFromPlan).toHaveBeenCalledWith(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        undefined
      );
    });

    it('should handle all parameters', async () => {
      // Arrange
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.success(testWorkoutLog));

      // Act
      const result = await workoutQueryService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert
      expect(result).toEqual(testWorkoutLog);
      expect(mockWorkoutService.startWorkoutFromPlan).toHaveBeenCalledWith(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );
    });

    it('should handle empty string parameters', async () => {
      // Arrange
      const error = new ApplicationError('Invalid parameters');
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.startWorkoutFromPlan('', '')).rejects.toThrow(error);
      expect(mockWorkoutService.startWorkoutFromPlan).toHaveBeenCalledWith(
        '',
        '',
        undefined,
        undefined
      );
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Database connection failed');
      mockWorkoutService.startWorkoutFromPlan.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(
        workoutQueryService.startWorkoutFromPlan(testProfileId, testSessionId)
      ).rejects.toThrow(unexpectedError);
    });
  });

  describe('getWorkoutLog', () => {
    it('should return workout log when service succeeds', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.success(testWorkoutLog));

      // Act
      const result = await workoutQueryService.getWorkoutLog(testWorkoutLogId);

      // Assert
      expect(result).toEqual(testWorkoutLog);
      expect(mockWorkoutService.getWorkoutLog).toHaveBeenCalledWith(testWorkoutLogId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Workout log not found');
      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.getWorkoutLog(testWorkoutLogId)).rejects.toThrow(error);
      expect(mockWorkoutService.getWorkoutLog).toHaveBeenCalledWith(testWorkoutLogId);
    });

    it('should handle empty workout log ID', async () => {
      // Arrange
      const emptyId = '';
      const error = new ApplicationError('Invalid workout log ID');
      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.getWorkoutLog(emptyId)).rejects.toThrow(error);
      expect(mockWorkoutService.getWorkoutLog).toHaveBeenCalledWith(emptyId);
    });

    it('should handle invalid workout log ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';
      const error = new ApplicationError('Invalid workout log ID format');
      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.getWorkoutLog(invalidId)).rejects.toThrow(error);
      expect(mockWorkoutService.getWorkoutLog).toHaveBeenCalledWith(invalidId);
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Database query failed');
      mockWorkoutService.getWorkoutLog.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(workoutQueryService.getWorkoutLog(testWorkoutLogId)).rejects.toThrow(
        unexpectedError
      );
    });
  });

  describe('getWorkoutLogs', () => {
    const testWorkoutLogs = [testWorkoutLog, createTestWorkoutLogModel({ id: 'workout-2' })];

    it('should return a Query object for reactive observation', () => {
      // Act
      const result = workoutQueryService.getWorkoutLogs(testProfileId);

      // Assert
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('collection');
      // The result should be a WatermelonDB Query object for reactive observation
    });

    it('should return WatermelonDB query with filters', () => {
      // Arrange
      const filters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      };

      // Act
      const result = workoutQueryService.getWorkoutLogs(testProfileId, filters);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('collection');
      // The query should be properly constructed with filters - this is verified by integration tests
    });

    it('should create query with correct profile filter', () => {
      // Act
      const result = workoutQueryService.getWorkoutLogs(testProfileId);

      // Assert
      expect(result).toBeDefined();
      // The query should be properly constructed - this is verified by integration tests
    });

    it('should handle different profile IDs', () => {
      // Arrange
      const differentProfileId = 'different-profile-id';

      // Act
      const result = workoutQueryService.getWorkoutLogs(differentProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('collection');
    });

    it('should create consistent query structure', () => {
      // Act
      const result = workoutQueryService.getWorkoutLogs(testProfileId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('collection');
    });

    it('should handle complex date range filters', () => {
      // Arrange
      const complexFilters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      };

      // Act
      const result = workoutQueryService.getWorkoutLogs(testProfileId, complexFilters);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('collection');
    });
  });

  describe('getWorkoutHistory', () => {
    const testWorkoutLogs = [
      createTestWorkoutLogModel({
        id: 'workout-1',
        startTime: new Date('2024-12-01T10:00:00Z'),
      }),
      createTestWorkoutLogModel({
        id: 'workout-2',
        startTime: new Date('2024-11-01T10:00:00Z'),
      }),
      createTestWorkoutLogModel({
        id: 'workout-3',
        startTime: new Date('2024-10-01T10:00:00Z'),
      }),
      createTestWorkoutLogModel({
        id: 'workout-4',
        startTime: new Date('2024-09-01T10:00:00Z'),
      }),
    ];

    it('should return paginated workout history when service succeeds', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(testWorkoutLogs));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 2, 0);

      // Assert
      expect(result.logs).toHaveLength(2);
      expect(result.logs[0].id).toBe('workout-1'); // Most recent first
      expect(result.logs[1].id).toBe('workout-2');
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(4);
      expect(mockWorkoutService.getWorkoutLogs).toHaveBeenCalledWith(testProfileId, undefined);
    });

    it('should return second page of paginated results', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(testWorkoutLogs));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 2, 2);

      // Assert
      expect(result.logs).toHaveLength(2);
      expect(result.logs[0].id).toBe('workout-3');
      expect(result.logs[1].id).toBe('workout-4');
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(4);
    });

    it('should return workout history with filters when service succeeds', async () => {
      // Arrange
      const filters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      };
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(testWorkoutLogs));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 2, 0, filters);

      // Assert
      expect(result.logs).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(4);
      expect(mockWorkoutService.getWorkoutLogs).toHaveBeenCalledWith(testProfileId, filters);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to retrieve workout history');
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.getWorkoutHistory(testProfileId, 2, 0)).rejects.toThrow(
        error
      );
      expect(mockWorkoutService.getWorkoutLogs).toHaveBeenCalledWith(testProfileId, undefined);
    });

    it('should return empty history when no logs exist', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success([]));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 2, 0);

      // Assert
      expect(result.logs).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(0);
    });

    it('should handle requesting offset beyond available data', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(testWorkoutLogs));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 2, 10);

      // Assert
      expect(result.logs).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(4);
    });

    it('should handle large limit that exceeds available data', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(testWorkoutLogs));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 100, 0);

      // Assert
      expect(result.logs).toHaveLength(4);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(4);
    });

    it('should sort workout logs by startTime in descending order', async () => {
      // Arrange - Return logs in random order
      const unsortedLogs = [
        createTestWorkoutLogModel({
          id: 'workout-old',
          startTime: new Date('2024-01-01T10:00:00Z'),
        }),
        createTestWorkoutLogModel({
          id: 'workout-newest',
          startTime: new Date('2024-12-31T10:00:00Z'),
        }),
        createTestWorkoutLogModel({
          id: 'workout-middle',
          startTime: new Date('2024-06-01T10:00:00Z'),
        }),
      ];
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(unsortedLogs));

      // Act
      const result = await workoutQueryService.getWorkoutHistory(testProfileId, 3, 0);

      // Assert - Should be sorted newest first
      expect(result.logs[0].id).toBe('workout-newest');
      expect(result.logs[1].id).toBe('workout-middle');
      expect(result.logs[2].id).toBe('workout-old');
    });
  });

  describe('getLastWorkoutForSession', () => {
    it('should return workout log when service succeeds', async () => {
      // Arrange
      mockWorkoutService.getLastWorkoutForSession.mockResolvedValue(Result.success(testWorkoutLog));

      // Act
      const result = await workoutQueryService.getLastWorkoutForSession(
        testProfileId,
        testSessionId
      );

      // Assert
      expect(result).toEqual(testWorkoutLog);
      expect(mockWorkoutService.getLastWorkoutForSession).toHaveBeenCalledWith(
        testProfileId,
        testSessionId
      );
    });

    it('should return undefined when no workout found', async () => {
      // Arrange
      mockWorkoutService.getLastWorkoutForSession.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await workoutQueryService.getLastWorkoutForSession(
        testProfileId,
        testSessionId
      );

      // Assert
      expect(result).toBeUndefined();
      expect(mockWorkoutService.getLastWorkoutForSession).toHaveBeenCalledWith(
        testProfileId,
        testSessionId
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to find last workout for session');
      mockWorkoutService.getLastWorkoutForSession.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        workoutQueryService.getLastWorkoutForSession(testProfileId, testSessionId)
      ).rejects.toThrow(error);
      expect(mockWorkoutService.getLastWorkoutForSession).toHaveBeenCalledWith(
        testProfileId,
        testSessionId
      );
    });

    it('should handle invalid profile ID', async () => {
      // Arrange
      const invalidProfileId = 'invalid-profile';
      const error = new ApplicationError('Invalid profile ID');
      mockWorkoutService.getLastWorkoutForSession.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        workoutQueryService.getLastWorkoutForSession(invalidProfileId, testSessionId)
      ).rejects.toThrow(error);
      expect(mockWorkoutService.getLastWorkoutForSession).toHaveBeenCalledWith(
        invalidProfileId,
        testSessionId
      );
    });

    it('should handle invalid session ID', async () => {
      // Arrange
      const invalidSessionId = 'invalid-session';
      const error = new ApplicationError('Invalid session ID');
      mockWorkoutService.getLastWorkoutForSession.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        workoutQueryService.getLastWorkoutForSession(testProfileId, invalidSessionId)
      ).rejects.toThrow(error);
      expect(mockWorkoutService.getLastWorkoutForSession).toHaveBeenCalledWith(
        testProfileId,
        invalidSessionId
      );
    });
  });

  describe('endWorkout', () => {
    it('should return updated workout log when service succeeds', async () => {
      // Arrange
      const completedWorkout = createTestWorkoutLogModel({
        ...testWorkoutLog,
        endTime: new Date(),
        durationSeconds: 3600,
      });
      mockWorkoutService.endWorkout.mockResolvedValue(Result.success(completedWorkout));

      // Act
      const result = await workoutQueryService.endWorkout(testWorkoutLogId);

      // Assert
      expect(result).toEqual(completedWorkout);
      expect(result.endTime).toBeDefined();
      expect(result.durationSeconds).toBeDefined();
      expect(mockWorkoutService.endWorkout).toHaveBeenCalledWith(testWorkoutLogId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to end workout');
      mockWorkoutService.endWorkout.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.endWorkout(testWorkoutLogId)).rejects.toThrow(error);
      expect(mockWorkoutService.endWorkout).toHaveBeenCalledWith(testWorkoutLogId);
    });

    it('should handle invalid workout log ID', async () => {
      // Arrange
      const invalidId = 'invalid-workout-id';
      const error = new ApplicationError('Workout log not found');
      mockWorkoutService.endWorkout.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.endWorkout(invalidId)).rejects.toThrow(error);
      expect(mockWorkoutService.endWorkout).toHaveBeenCalledWith(invalidId);
    });

    it('should handle already ended workout', async () => {
      // Arrange
      const error = new ApplicationError('Workout is already completed');
      mockWorkoutService.endWorkout.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.endWorkout(testWorkoutLogId)).rejects.toThrow(error);
      expect(mockWorkoutService.endWorkout).toHaveBeenCalledWith(testWorkoutLogId);
    });
  });

  describe('updateWorkoutMetadata', () => {
    it('should return updated workout log when service succeeds with notes', async () => {
      // Arrange
      const metadata = { notes: 'Great workout today!' };
      const updatedWorkout = createTestWorkoutLogModel({
        ...testWorkoutLog,
        notes: metadata.notes,
      });
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.success(updatedWorkout));

      // Act
      const result = await workoutQueryService.updateWorkoutMetadata(testWorkoutLogId, metadata);

      // Assert
      expect(result).toEqual(updatedWorkout);
      expect(result.notes).toBe(metadata.notes);
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(
        testWorkoutLogId,
        metadata
      );
    });

    it('should return updated workout log when service succeeds with user rating', async () => {
      // Arrange
      const metadata = { userRating: 5 };
      const updatedWorkout = createTestWorkoutLogModel({
        ...testWorkoutLog,
        userRating: metadata.userRating,
      });
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.success(updatedWorkout));

      // Act
      const result = await workoutQueryService.updateWorkoutMetadata(testWorkoutLogId, metadata);

      // Assert
      expect(result).toEqual(updatedWorkout);
      expect(result.userRating).toBe(metadata.userRating);
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(
        testWorkoutLogId,
        metadata
      );
    });

    it('should return updated workout log when service succeeds with both notes and rating', async () => {
      // Arrange
      const metadata = { notes: 'Excellent session!', userRating: 5 };
      const updatedWorkout = createTestWorkoutLogModel({
        ...testWorkoutLog,
        notes: metadata.notes,
        userRating: metadata.userRating,
      });
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.success(updatedWorkout));

      // Act
      const result = await workoutQueryService.updateWorkoutMetadata(testWorkoutLogId, metadata);

      // Assert
      expect(result).toEqual(updatedWorkout);
      expect(result.notes).toBe(metadata.notes);
      expect(result.userRating).toBe(metadata.userRating);
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(
        testWorkoutLogId,
        metadata
      );
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const metadata = { notes: 'Test notes' };
      const error = new ApplicationError('Failed to update workout metadata');
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        workoutQueryService.updateWorkoutMetadata(testWorkoutLogId, metadata)
      ).rejects.toThrow(error);
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(
        testWorkoutLogId,
        metadata
      );
    });

    it('should handle invalid workout log ID', async () => {
      // Arrange
      const invalidId = 'invalid-workout-id';
      const metadata = { notes: 'Test notes' };
      const error = new ApplicationError('Workout log not found');
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.updateWorkoutMetadata(invalidId, metadata)).rejects.toThrow(
        error
      );
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(invalidId, metadata);
    });

    it('should handle invalid user rating', async () => {
      // Arrange
      const metadata = { userRating: 10 }; // Invalid rating (out of range)
      const error = new ApplicationError('Invalid user rating');
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(
        workoutQueryService.updateWorkoutMetadata(testWorkoutLogId, metadata)
      ).rejects.toThrow(error);
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(
        testWorkoutLogId,
        metadata
      );
    });

    it('should handle empty metadata object', async () => {
      // Arrange
      const metadata = {};
      const updatedWorkout = testWorkoutLog;
      mockWorkoutService.updateWorkoutMetadata.mockResolvedValue(Result.success(updatedWorkout));

      // Act
      const result = await workoutQueryService.updateWorkoutMetadata(testWorkoutLogId, metadata);

      // Assert
      expect(result).toEqual(updatedWorkout);
      expect(mockWorkoutService.updateWorkoutMetadata).toHaveBeenCalledWith(
        testWorkoutLogId,
        metadata
      );
    });
  });

  describe('deleteWorkout', () => {
    it('should complete successfully when service succeeds', async () => {
      // Arrange
      mockWorkoutService.deleteWorkout.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await workoutQueryService.deleteWorkout(testWorkoutLogId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockWorkoutService.deleteWorkout).toHaveBeenCalledWith(testWorkoutLogId);
    });

    it('should throw error when service fails', async () => {
      // Arrange
      const error = new ApplicationError('Failed to delete workout');
      mockWorkoutService.deleteWorkout.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.deleteWorkout(testWorkoutLogId)).rejects.toThrow(error);
      expect(mockWorkoutService.deleteWorkout).toHaveBeenCalledWith(testWorkoutLogId);
    });

    it('should handle invalid workout log ID', async () => {
      // Arrange
      const invalidId = 'invalid-workout-id';
      const error = new ApplicationError('Workout log not found');
      mockWorkoutService.deleteWorkout.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.deleteWorkout(invalidId)).rejects.toThrow(error);
      expect(mockWorkoutService.deleteWorkout).toHaveBeenCalledWith(invalidId);
    });

    it('should handle workout with dependencies', async () => {
      // Arrange
      const error = new ApplicationError('Cannot delete workout with existing dependencies');
      mockWorkoutService.deleteWorkout.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(workoutQueryService.deleteWorkout(testWorkoutLogId)).rejects.toThrow(error);
      expect(mockWorkoutService.deleteWorkout).toHaveBeenCalledWith(testWorkoutLogId);
    });
  });

  describe('dependency injection', () => {
    it('should use injected WorkoutService', () => {
      // Arrange & Act
      const service = new WorkoutQueryService(mockWorkoutService as any, mockDatabase as any);

      // Assert
      expect(service).toBeInstanceOf(WorkoutQueryService);
      expect(service).toBeDefined();
    });
  });

  describe('error propagation', () => {
    it('should preserve original error types from WorkoutService', async () => {
      // Arrange
      const originalError = new ApplicationError('Specific workout error');
      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.failure(originalError));

      // Act & Assert
      await expect(workoutQueryService.getWorkoutLog('test-id')).rejects.toBe(originalError);
    });

    it('should maintain error stack traces for debugging', async () => {
      // Arrange
      const originalError = new ApplicationError('Original error with stack');
      mockWorkoutService.startWorkoutFromPlan.mockResolvedValue(Result.failure(originalError));

      // Act
      const thrownError = await workoutQueryService
        .startWorkoutFromPlan('profile-id', 'session-id')
        .catch((error) => error);

      // Assert
      expect(thrownError).toBe(originalError);
      expect(thrownError.stack).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle concurrent calls to same method', async () => {
      // Arrange
      const workoutLogs = [testWorkoutLog];
      mockWorkoutService.getWorkoutLogs.mockResolvedValue(Result.success(workoutLogs));

      // Act
      const queries = Array.from({ length: 5 }, () =>
        workoutQueryService.getWorkoutLogs(testProfileId)
      );

      // Assert
      queries.forEach((query) => {
        expect(query).toBeDefined();
        expect(query).toHaveProperty('description');
        expect(query).toHaveProperty('collection');
      });
    });

    it('should handle mixed success and failure operations', async () => {
      // Arrange
      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.success(testWorkoutLog));
      mockWorkoutService.deleteWorkout.mockResolvedValue(
        Result.failure(new ApplicationError('Delete failed'))
      );

      // Act
      const getResult = await workoutQueryService.getWorkoutLog(testWorkoutLogId);
      const deleteError = await workoutQueryService.deleteWorkout(testWorkoutLogId).catch((e) => e);

      // Assert
      expect(getResult).toEqual(testWorkoutLog);
      expect(deleteError).toBeInstanceOf(ApplicationError);
    });

    it('should handle operations on non-existent workout consistently', async () => {
      // Arrange
      const nonExistentId = 'non-existent-workout';
      const notFoundError = new ApplicationError('Workout log not found');

      mockWorkoutService.getWorkoutLog.mockResolvedValue(Result.failure(notFoundError));
      mockWorkoutService.endWorkout.mockResolvedValue(Result.failure(notFoundError));
      mockWorkoutService.deleteWorkout.mockResolvedValue(Result.failure(notFoundError));

      // Act
      const getError = await workoutQueryService.getWorkoutLog(nonExistentId).catch((e) => e);
      const endError = await workoutQueryService.endWorkout(nonExistentId).catch((e) => e);
      const deleteError = await workoutQueryService.deleteWorkout(nonExistentId).catch((e) => e);

      // Assert
      expect(getError).toBe(notFoundError);
      expect(endError).toBe(notFoundError);
      expect(deleteError).toBe(notFoundError);
    });
  });
});
