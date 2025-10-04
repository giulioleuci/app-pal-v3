import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IWorkoutSessionRepository } from '@/features/training-plan/domain/IWorkoutSessionRepository';
import { SessionModel } from '@/features/training-plan/domain/SessionModel';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import {
  createTestSessionModel,
  createTestWorkoutLogModel,
  createTestWorkoutSessionData,
} from '@/test-factories';

import { WorkoutService } from './WorkoutService';

describe('WorkoutService', () => {
  let workoutService: WorkoutService;
  let mockWorkoutLogRepository: jest.Mocked<IWorkoutLogRepository>;
  let mockWorkoutSessionRepository: jest.Mocked<IWorkoutSessionRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  const testProfileId = '550e8400-e29b-41d4-a716-446655440001';
  const testSessionId = '550e8400-e29b-41d4-a716-446655440002';
  const testTrainingPlanId = '550e8400-e29b-41d4-a716-446655440003';
  const testTrainingPlanName = 'Test Training Plan';

  const testSession = createTestSessionModel({
    id: testSessionId,
    profileId: testProfileId,
    name: 'Test Session',
  });

  const testWorkoutLog = createTestWorkoutLogModel({
    id: '550e8400-e29b-41d4-a716-446655440004',
    profileId: testProfileId,
    sessionId: testSessionId,
    trainingPlanId: testTrainingPlanId,
  });

  beforeEach(() => {
    // Create mocks
    mockWorkoutLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findLastBySessionId: vi.fn(),
      delete: vi.fn(),
    };

    mockWorkoutSessionRepository = {
      save: vi.fn(),
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

    workoutService = new WorkoutService(
      mockWorkoutLogRepository,
      mockWorkoutSessionRepository,
      mockLogger
    );

    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe('startWorkoutFromPlan', () => {
    it('should successfully start a workout from a planned session', async () => {
      // Arrange
      mockWorkoutSessionRepository.findById.mockResolvedValue(testSession);
      const savedWorkout = createTestWorkoutLogModel({
        profileId: testProfileId,
        sessionId: testSessionId,
        trainingPlanId: testTrainingPlanId,
        trainingPlanName: testTrainingPlanName,
      });
      mockWorkoutLogRepository.save.mockResolvedValue(savedWorkout);
      const updatedSession = testSession.cloneWithIncrementedExecutionCount();
      mockWorkoutSessionRepository.save.mockResolvedValue(updatedSession);

      // Act
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(savedWorkout);
      expect(mockWorkoutSessionRepository.findById).toHaveBeenCalledWith(testSessionId);
      expect(mockWorkoutLogRepository.save).toHaveBeenCalledWith(expect.any(WorkoutLogModel));
      expect(mockWorkoutSessionRepository.save).toHaveBeenCalledWith(expect.any(SessionModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Starting workout from planned session', {
        profileId: testProfileId,
        sessionId: testSessionId,
        trainingPlanId: testTrainingPlanId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Workout started successfully', {
        workoutLogId: savedWorkout.id,
        profileId: testProfileId,
        sessionId: testSessionId,
        sessionName: testSession.name,
      });
    });

    it('should return failure when planned session does not exist', async () => {
      // Arrange
      mockWorkoutSessionRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Planned session not found');
      expect(mockWorkoutLogRepository.save).not.toHaveBeenCalled();
      expect(mockWorkoutSessionRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Planned session not found', {
        sessionId: testSessionId,
        profileId: testProfileId,
      });
    });

    it('should return failure when session does not belong to profile', async () => {
      // Arrange
      const differentProfileSession = createTestSessionModel({
        id: testSessionId,
        profileId: 'different-profile-id',
        name: 'Test Session',
      });
      mockWorkoutSessionRepository.findById.mockResolvedValue(differentProfileSession);

      // Act
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Session does not belong to profile');
      expect(mockWorkoutLogRepository.save).not.toHaveBeenCalled();
      expect(mockWorkoutSessionRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Session does not belong to profile', {
        sessionId: testSessionId,
        profileId: testProfileId,
      });
    });

    it('should handle workout start without training plan information', async () => {
      // Arrange
      mockWorkoutSessionRepository.findById.mockResolvedValue(testSession);
      const savedWorkout = createTestWorkoutLogModel({
        profileId: testProfileId,
        sessionId: testSessionId,
        trainingPlanName: 'Unknown Plan',
      });
      mockWorkoutLogRepository.save.mockResolvedValue(savedWorkout);
      const updatedSession = testSession.cloneWithIncrementedExecutionCount();
      mockWorkoutSessionRepository.save.mockResolvedValue(updatedSession);

      // Act
      const result = await workoutService.startWorkoutFromPlan(testProfileId, testSessionId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(savedWorkout);
      expect(mockWorkoutLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          trainingPlanName: 'Unknown Plan',
          trainingPlanId: undefined,
        })
      );
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      mockWorkoutSessionRepository.findById.mockResolvedValue(testSession);
      const repositoryError = new Error('Database connection failed');
      mockWorkoutLogRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.startWorkoutFromPlan(
        testProfileId,
        testSessionId,
        testTrainingPlanId,
        testTrainingPlanName
      );

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to start workout from plan');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start workout from plan',
        repositoryError,
        {
          profileId: testProfileId,
          sessionId: testSessionId,
          trainingPlanId: testTrainingPlanId,
        }
      );
    });
  });

  describe('getWorkoutLog', () => {
    it('should successfully retrieve a workout log by ID', async () => {
      // Arrange
      const workoutLogId = testWorkoutLog.id;
      mockWorkoutLogRepository.findById.mockResolvedValue(testWorkoutLog);

      // Act
      const result = await workoutService.getWorkoutLog(workoutLogId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(testWorkoutLog);
      expect(mockWorkoutLogRepository.findById).toHaveBeenCalledWith(workoutLogId);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving workout log', { workoutLogId });
      expect(mockLogger.info).toHaveBeenCalledWith('Workout log retrieved successfully', {
        workoutLogId,
      });
    });

    it('should return NotFoundError when workout log does not exist', async () => {
      // Arrange
      const workoutLogId = 'non-existent-id';
      mockWorkoutLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await workoutService.getWorkoutLog(workoutLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Workout log not found');
      expect(mockLogger.warn).toHaveBeenCalledWith('Workout log not found', { workoutLogId });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const workoutLogId = testWorkoutLog.id;
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.getWorkoutLog(workoutLogId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve workout log');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve workout log',
        repositoryError,
        {
          workoutLogId,
        }
      );
    });
  });

  describe('getWorkoutLogs', () => {
    it('should successfully retrieve all workout logs for a profile', async () => {
      // Arrange
      const workoutLogs = [testWorkoutLog, createTestWorkoutLogModel({ id: 'workout-2' })];
      mockWorkoutLogRepository.findAll.mockResolvedValue(workoutLogs);

      // Act
      const result = await workoutService.getWorkoutLogs(testProfileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(workoutLogs);
      expect(mockWorkoutLogRepository.findAll).toHaveBeenCalledWith(testProfileId, undefined);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving workout logs for profile', {
        profileId: testProfileId,
        filters: undefined,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Workout logs retrieved successfully', {
        profileId: testProfileId,
        count: workoutLogs.length,
      });
    });

    it('should successfully retrieve workout logs with date filters', async () => {
      // Arrange
      const filters = {
        dateRange: {
          from: new Date('2023-01-01'),
          to: new Date('2023-12-31'),
        },
      };
      const workoutLogs = [testWorkoutLog];
      mockWorkoutLogRepository.findAll.mockResolvedValue(workoutLogs);

      // Act
      const result = await workoutService.getWorkoutLogs(testProfileId, filters);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(workoutLogs);
      expect(mockWorkoutLogRepository.findAll).toHaveBeenCalledWith(testProfileId, filters);
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving workout logs for profile', {
        profileId: testProfileId,
        filters,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findAll.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.getWorkoutLogs(testProfileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve workout logs');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve workout logs',
        repositoryError,
        {
          profileId: testProfileId,
          filters: undefined,
        }
      );
    });
  });

  describe('getLastWorkoutForSession', () => {
    it('should successfully retrieve the last workout for a session', async () => {
      // Arrange
      mockWorkoutLogRepository.findLastBySessionId.mockResolvedValue(testWorkoutLog);

      // Act
      const result = await workoutService.getLastWorkoutForSession(testProfileId, testSessionId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(testWorkoutLog);
      expect(mockWorkoutLogRepository.findLastBySessionId).toHaveBeenCalledWith(
        testProfileId,
        testSessionId
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Retrieving last workout for session', {
        profileId: testProfileId,
        sessionId: testSessionId,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Last workout retrieved successfully', {
        profileId: testProfileId,
        sessionId: testSessionId,
        found: true,
      });
    });

    it('should return undefined when no last workout exists', async () => {
      // Arrange
      mockWorkoutLogRepository.findLastBySessionId.mockResolvedValue(undefined);

      // Act
      const result = await workoutService.getLastWorkoutForSession(testProfileId, testSessionId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Last workout retrieved successfully', {
        profileId: testProfileId,
        sessionId: testSessionId,
        found: false,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.findLastBySessionId.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.getLastWorkoutForSession(testProfileId, testSessionId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to retrieve last workout for session');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve last workout for session',
        repositoryError,
        {
          profileId: testProfileId,
          sessionId: testSessionId,
        }
      );
    });
  });

  describe('endWorkout', () => {
    it('should successfully end a workout', async () => {
      // Arrange
      const activeWorkout = createTestWorkoutLogModel({
        id: testWorkoutLog.id,
        endTime: undefined, // Not ended yet
      });
      const endedWorkout = activeWorkout.cloneAsEnded();
      mockWorkoutLogRepository.findById.mockResolvedValue(activeWorkout);
      mockWorkoutLogRepository.save.mockResolvedValue(endedWorkout);

      // Act
      const result = await workoutService.endWorkout(testWorkoutLog.id);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(endedWorkout);
      expect(mockWorkoutLogRepository.findById).toHaveBeenCalledWith(testWorkoutLog.id);
      expect(mockWorkoutLogRepository.save).toHaveBeenCalledWith(expect.any(WorkoutLogModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Ending workout', {
        workoutLogId: testWorkoutLog.id,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Workout ended successfully', {
        workoutLogId: endedWorkout.id,
        duration: endedWorkout.getDurationInMinutes(),
        totalVolume: endedWorkout.totalVolume,
      });
    });

    it('should return NotFoundError when workout log does not exist', async () => {
      // Arrange
      mockWorkoutLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await workoutService.endWorkout('non-existent-id');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Workout log not found');
      expect(mockWorkoutLogRepository.save).not.toHaveBeenCalled();
    });

    it('should return failure when workout is already completed', async () => {
      // Arrange
      const completedWorkout = createTestWorkoutLogModel({
        id: testWorkoutLog.id,
        endTime: new Date(), // Already ended
      });
      mockWorkoutLogRepository.findById.mockResolvedValue(completedWorkout);

      // Act
      const result = await workoutService.endWorkout(testWorkoutLog.id);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Workout is already completed');
      expect(mockWorkoutLogRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Workout is already completed', {
        workoutLogId: testWorkoutLog.id,
      });
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const activeWorkout = createTestWorkoutLogModel({
        id: testWorkoutLog.id,
        endTime: undefined,
      });
      mockWorkoutLogRepository.findById.mockResolvedValue(activeWorkout);
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.endWorkout(testWorkoutLog.id);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to end workout');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to end workout', repositoryError, {
        workoutLogId: testWorkoutLog.id,
      });
    });
  });

  describe('updateWorkoutMetadata', () => {
    it('should successfully update workout metadata', async () => {
      // Arrange
      const metadata = { notes: 'Great workout!', userRating: 5 };
      const updatedWorkout = testWorkoutLog.cloneWithUpdatedMetadata(metadata);
      mockWorkoutLogRepository.findById.mockResolvedValue(testWorkoutLog);
      mockWorkoutLogRepository.save.mockResolvedValue(updatedWorkout);

      // Act
      const result = await workoutService.updateWorkoutMetadata(testWorkoutLog.id, metadata);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(updatedWorkout);
      expect(mockWorkoutLogRepository.findById).toHaveBeenCalledWith(testWorkoutLog.id);
      expect(mockWorkoutLogRepository.save).toHaveBeenCalledWith(expect.any(WorkoutLogModel));
      expect(mockLogger.info).toHaveBeenCalledWith('Updating workout metadata', {
        workoutLogId: testWorkoutLog.id,
        metadata,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Workout metadata updated successfully', {
        workoutLogId: updatedWorkout.id,
        notes: true,
        userRating: metadata.userRating,
      });
    });

    it('should return NotFoundError when workout log does not exist', async () => {
      // Arrange
      const metadata = { notes: 'Test notes' };
      mockWorkoutLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await workoutService.updateWorkoutMetadata('non-existent-id', metadata);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Workout log not found');
      expect(mockWorkoutLogRepository.save).not.toHaveBeenCalled();
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      const metadata = { notes: 'Test notes' };
      mockWorkoutLogRepository.findById.mockResolvedValue(testWorkoutLog);
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.save.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.updateWorkoutMetadata(testWorkoutLog.id, metadata);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to update workout metadata');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update workout metadata',
        repositoryError,
        {
          workoutLogId: testWorkoutLog.id,
          metadata,
        }
      );
    });
  });

  describe('deleteWorkout', () => {
    it('should successfully delete a workout', async () => {
      // Arrange
      mockWorkoutLogRepository.findById.mockResolvedValue(testWorkoutLog);
      mockWorkoutLogRepository.delete.mockResolvedValue();

      // Act
      const result = await workoutService.deleteWorkout(testWorkoutLog.id);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeUndefined();
      expect(mockWorkoutLogRepository.findById).toHaveBeenCalledWith(testWorkoutLog.id);
      expect(mockWorkoutLogRepository.delete).toHaveBeenCalledWith(testWorkoutLog.id);
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting workout log', {
        workoutLogId: testWorkoutLog.id,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Workout log deleted successfully', {
        workoutLogId: testWorkoutLog.id,
      });
    });

    it('should return NotFoundError when workout log does not exist', async () => {
      // Arrange
      mockWorkoutLogRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await workoutService.deleteWorkout('non-existent-id');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toBe('Workout log not found');
      expect(mockWorkoutLogRepository.delete).not.toHaveBeenCalled();
    });

    it('should return failure when repository throws error', async () => {
      // Arrange
      mockWorkoutLogRepository.findById.mockResolvedValue(testWorkoutLog);
      const repositoryError = new Error('Database error');
      mockWorkoutLogRepository.delete.mockRejectedValue(repositoryError);

      // Act
      const result = await workoutService.deleteWorkout(testWorkoutLog.id);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to delete workout log');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete workout log',
        repositoryError,
        {
          workoutLogId: testWorkoutLog.id,
        }
      );
    });
  });
});
