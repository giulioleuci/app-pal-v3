import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILogger } from '@/app/services/ILogger';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { IExerciseRepository } from '@/features/exercise/domain/IExerciseRepository';
import { IExerciseTemplateRepository } from '@/features/exercise/domain/IExerciseTemplateRepository';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { IProfileRepository } from '@/features/profile/domain/IProfileRepository';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import {
  createTestExerciseModel,
  createTestMaxLogModel,
  createTestProfileModel,
  createTestTrainingPlanModel,
  createTestWeightRecordModel,
  createTestWorkoutLogModel,
} from '@/test-factories';

import { MaintenanceService, MaintenanceStatus } from './MaintenanceService';

describe('MaintenanceService', () => {
  let maintenanceService: MaintenanceService;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockExerciseRepository: jest.Mocked<IExerciseRepository>;
  let mockExerciseTemplateRepository: jest.Mocked<IExerciseTemplateRepository>;
  let mockTrainingPlanRepository: jest.Mocked<ITrainingPlanRepository>;
  let mockWorkoutLogRepository: jest.Mocked<IWorkoutLogRepository>;
  let mockMaxLogRepository: jest.Mocked<IMaxLogRepository>;
  let mockBodyMetricsRepository: jest.Mocked<IBodyMetricsRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockDatabase: any;

  const profileId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    // Create mocks
    mockProfileRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockExerciseRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockExerciseTemplateRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    mockTrainingPlanRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findByProfile: vi.fn(),
    };

    mockWorkoutLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findByProfile: vi.fn(),
      findByProfileAndDateRange: vi.fn(),
    };

    mockMaxLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findByProfile: vi.fn(),
      findByProfileAndExercise: vi.fn(),
    };

    mockBodyMetricsRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      findWeightRecordsByProfile: vi.fn(),
      findWeightRecordsByProfileAndDateRange: vi.fn(),
      findHeightRecordsByProfile: vi.fn(),
      findHeightRecordsByProfileAndDateRange: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Create mock database with collections
    mockDatabase = {
      collections: {
        get: vi.fn().mockImplementation((tableName: string) => {
          return {
            query: vi.fn().mockReturnValue({
              fetch: vi.fn().mockResolvedValue([]),
            }),
          };
        }),
      },
    };

    maintenanceService = new MaintenanceService(
      mockProfileRepository,
      mockExerciseRepository,
      mockExerciseTemplateRepository,
      mockTrainingPlanRepository,
      mockWorkoutLogRepository,
      mockMaxLogRepository,
      mockBodyMetricsRepository,
      mockLogger,
      mockDatabase
    );

    // Mock sleep function to speed up tests
    vi.spyOn(maintenanceService as any, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('bulkDelete', () => {
    describe('ALL option', () => {
      it('should successfully delete all data', async () => {
        // Arrange
        const testProfile = createTestProfileModel({ id: profileId });
        const testExercise = createTestExerciseModel({ id: 'exercise-1' });
        const testWorkout = createTestWorkoutLogModel({ id: 'workout-1', profileId });
        const testMaxLog = createTestMaxLogModel({ id: 'max-1', profileId });
        const testTrainingPlan = createTestTrainingPlanModel({ id: 'plan-1', profileId });
        const testWeightRecord = createTestWeightRecordModel({ id: 'weight-1', profileId });

        mockProfileRepository.findAll.mockResolvedValue([testProfile]);
        mockExerciseRepository.findAll.mockResolvedValue([testExercise]);
        mockExerciseTemplateRepository.findAll.mockResolvedValue([]);
        mockTrainingPlanRepository.findAll.mockResolvedValue([testTrainingPlan]);
        mockWorkoutLogRepository.findAll.mockResolvedValue([testWorkout]);
        mockMaxLogRepository.findAll.mockResolvedValue([testMaxLog]);
        mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue([testWeightRecord]);
        mockBodyMetricsRepository.findHeightRecordsByProfile.mockResolvedValue([]);

        // Mock successful deletions
        mockProfileRepository.delete.mockResolvedValue();
        mockExerciseRepository.delete.mockResolvedValue();
        mockTrainingPlanRepository.delete.mockResolvedValue();
        mockWorkoutLogRepository.delete.mockResolvedValue();
        mockMaxLogRepository.delete.mockResolvedValue();
        mockBodyMetricsRepository.delete.mockResolvedValue();

        const progressUpdates: MaintenanceStatus[] = [];
        const onProgress = (status: MaintenanceStatus) => {
          progressUpdates.push({ ...status });
        };

        // Act
        const result = await maintenanceService.bulkDelete('ALL', onProgress);

        // Assert
        expect(result.isSuccess).toBe(true);
        const cleanupResult = result.getValue()!;

        expect(cleanupResult.deletedProfiles).toBe(1);
        expect(cleanupResult.deletedExercises).toBe(1);
        expect(cleanupResult.deletedTrainingPlans).toBe(1);
        expect(cleanupResult.deletedWorkoutLogs).toBe(1);
        expect(cleanupResult.deletedMaxLogs).toBe(1);
        expect(cleanupResult.deletedBodyMetrics).toBe(1);
        expect(cleanupResult.totalDeleted).toBe(6);
        expect(cleanupResult.errors).toHaveLength(0);

        expect(progressUpdates.length).toBeGreaterThan(0);
        expect(progressUpdates[progressUpdates.length - 1].isComplete).toBe(true);

        expect(mockProfileRepository.delete).toHaveBeenCalledWith(profileId);
        expect(mockExerciseRepository.delete).toHaveBeenCalledWith('exercise-1');
        expect(mockWorkoutLogRepository.delete).toHaveBeenCalledWith('workout-1');
        expect(mockMaxLogRepository.delete).toHaveBeenCalledWith('max-1');
        expect(mockTrainingPlanRepository.delete).toHaveBeenCalledWith('plan-1');
        expect(mockBodyMetricsRepository.delete).toHaveBeenCalledWith('weight-1');

        expect(mockLogger.info).toHaveBeenCalledWith('Starting bulk delete operation', {
          option: 'ALL',
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Bulk delete operation completed', {
          option: 'ALL',
          totalDeleted: 6,
          errors: 0,
        });
      });

      it('should handle deletion errors gracefully', async () => {
        // Arrange
        const testProfile = createTestProfileModel({ id: profileId });
        const testExercise = createTestExerciseModel({ id: 'exercise-1' });

        mockProfileRepository.findAll.mockResolvedValue([testProfile]);
        mockExerciseRepository.findAll.mockResolvedValue([testExercise]);
        mockExerciseTemplateRepository.findAll.mockResolvedValue([]);
        mockTrainingPlanRepository.findAll.mockResolvedValue([]);
        mockWorkoutLogRepository.findAll.mockResolvedValue([]);
        mockMaxLogRepository.findAll.mockResolvedValue([]);
        mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue([]);
        mockBodyMetricsRepository.findHeightRecordsByProfile.mockResolvedValue([]);

        // Mock partial failures
        mockProfileRepository.delete.mockResolvedValue();
        mockExerciseRepository.delete.mockRejectedValue(new Error('Exercise deletion failed'));

        // Act
        const result = await maintenanceService.bulkDelete('ALL');

        // Assert
        expect(result.isSuccess).toBe(true);
        const cleanupResult = result.getValue()!;

        expect(cleanupResult.deletedProfiles).toBe(1);
        expect(cleanupResult.deletedExercises).toBe(0);
        expect(cleanupResult.totalDeleted).toBe(1);
        expect(cleanupResult.errors.length).toBeGreaterThan(0);
        expect(cleanupResult.errors[0]).toContain('Exercise deletion failed');
      });
    });

    describe('OLD_DATA option', () => {
      it('should successfully delete old data', async () => {
        // Arrange
        const oldDate = new Date('2020-01-01'); // Older than 2 years
        const recentDate = new Date(); // Recent date

        const oldWorkout = createTestWorkoutLogModel({
          id: 'old-workout',
          profileId,
          startTime: oldDate,
        });
        const recentWorkout = createTestWorkoutLogModel({
          id: 'recent-workout',
          profileId,
          startTime: recentDate,
        });

        const oldMaxLog = createTestMaxLogModel({
          id: 'old-max',
          profileId,
          date: oldDate,
        });
        const recentMaxLog = createTestMaxLogModel({
          id: 'recent-max',
          profileId,
          date: recentDate,
        });

        mockWorkoutLogRepository.findAll.mockResolvedValue([oldWorkout, recentWorkout]);
        mockMaxLogRepository.findAll.mockResolvedValue([oldMaxLog, recentMaxLog]);

        mockWorkoutLogRepository.delete.mockResolvedValue();
        mockMaxLogRepository.delete.mockResolvedValue();

        // Act
        const result = await maintenanceService.bulkDelete('OLD_DATA');

        // Assert
        expect(result.isSuccess).toBe(true);
        const cleanupResult = result.getValue()!;

        expect(cleanupResult.deletedWorkoutLogs).toBe(1);
        expect(cleanupResult.deletedMaxLogs).toBe(1);
        expect(cleanupResult.totalDeleted).toBe(2);

        // Verify only old records were deleted
        expect(mockWorkoutLogRepository.delete).toHaveBeenCalledWith('old-workout');
        expect(mockWorkoutLogRepository.delete).not.toHaveBeenCalledWith('recent-workout');
        expect(mockMaxLogRepository.delete).toHaveBeenCalledWith('old-max');
        expect(mockMaxLogRepository.delete).not.toHaveBeenCalledWith('recent-max');
      });

      it('should handle no old data gracefully', async () => {
        // Arrange
        const recentDate = new Date();
        const recentWorkout = createTestWorkoutLogModel({
          id: 'recent-workout',
          profileId,
          completedAt: recentDate,
        });

        mockWorkoutLogRepository.findAll.mockResolvedValue([recentWorkout]);
        mockMaxLogRepository.findAll.mockResolvedValue([]);

        // Act
        const result = await maintenanceService.bulkDelete('OLD_DATA');

        // Assert
        expect(result.isSuccess).toBe(true);
        const cleanupResult = result.getValue()!;

        expect(cleanupResult.deletedWorkoutLogs).toBe(0);
        expect(cleanupResult.deletedMaxLogs).toBe(0);
        expect(cleanupResult.totalDeleted).toBe(0);

        expect(mockWorkoutLogRepository.delete).not.toHaveBeenCalled();
        expect(mockMaxLogRepository.delete).not.toHaveBeenCalled();
      });
    });

    describe('INACTIVE_PROFILES option', () => {
      it('should successfully delete inactive profiles and their data', async () => {
        // Arrange
        const activeProfile = createTestProfileModel({ id: 'active-profile', isActive: true });
        const inactiveProfile = createTestProfileModel({
          id: 'inactive-profile',
          isActive: false,
        });

        mockProfileRepository.findAll.mockResolvedValue([activeProfile, inactiveProfile]);
        mockWorkoutLogRepository.findByProfile.mockResolvedValue([]);
        mockMaxLogRepository.findByProfile.mockResolvedValue([]);
        mockTrainingPlanRepository.findByProfile.mockResolvedValue([]);
        mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue([]);
        mockBodyMetricsRepository.findHeightRecordsByProfile.mockResolvedValue([]);

        mockProfileRepository.delete.mockResolvedValue();

        // Act
        const result = await maintenanceService.bulkDelete('INACTIVE_PROFILES');

        // Assert
        expect(result.isSuccess).toBe(true);
        const cleanupResult = result.getValue()!;

        expect(cleanupResult.deletedProfiles).toBe(1);
        expect(cleanupResult.totalDeleted).toBe(1);

        expect(mockProfileRepository.delete).toHaveBeenCalledWith('inactive-profile');
        expect(mockProfileRepository.delete).not.toHaveBeenCalledWith('active-profile');
      });

      it('should delete associated data for inactive profiles', async () => {
        // Arrange
        const inactiveProfile = createTestProfileModel({
          id: 'inactive-profile',
          isActive: false,
        });
        const associatedWorkout = createTestWorkoutLogModel({
          id: 'associated-workout',
          profileId: 'inactive-profile',
        });
        const associatedMaxLog = createTestMaxLogModel({
          id: 'associated-max',
          profileId: 'inactive-profile',
        });

        mockProfileRepository.findAll.mockResolvedValue([inactiveProfile]);
        mockWorkoutLogRepository.findByProfile.mockResolvedValue([associatedWorkout]);
        mockMaxLogRepository.findByProfile.mockResolvedValue([associatedMaxLog]);
        mockTrainingPlanRepository.findByProfile.mockResolvedValue([]);
        mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue([]);
        mockBodyMetricsRepository.findHeightRecordsByProfile.mockResolvedValue([]);

        mockProfileRepository.delete.mockResolvedValue();
        mockWorkoutLogRepository.delete.mockResolvedValue();
        mockMaxLogRepository.delete.mockResolvedValue();

        // Act
        const result = await maintenanceService.bulkDelete('INACTIVE_PROFILES');

        // Assert
        expect(result.isSuccess).toBe(true);
        const cleanupResult = result.getValue()!;

        expect(cleanupResult.deletedProfiles).toBe(1);
        expect(cleanupResult.deletedWorkoutLogs).toBe(1);
        expect(cleanupResult.deletedMaxLogs).toBe(1);
        expect(cleanupResult.totalDeleted).toBe(3);

        expect(mockWorkoutLogRepository.delete).toHaveBeenCalledWith('associated-workout');
        expect(mockMaxLogRepository.delete).toHaveBeenCalledWith('associated-max');
        expect(mockProfileRepository.delete).toHaveBeenCalledWith('inactive-profile');
      });
    });

    it('should return failure for invalid option', async () => {
      // Act
      const result = await maintenanceService.bulkDelete('INVALID_OPTION' as any);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toContain('Invalid bulk delete option');
    });

    it('should return failure when operation throws error', async () => {
      // Arrange
      const repositoryError = new Error('Critical repository error');
      mockProfileRepository.findAll.mockRejectedValue(repositoryError);

      // Act
      const result = await maintenanceService.bulkDelete('ALL');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to perform bulk delete operation');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to perform bulk delete operation',
        repositoryError,
        { option: 'ALL' }
      );
    });
  });

  describe('optimizeDatabase', () => {
    it('should successfully perform database optimization', async () => {
      // Act
      const result = await maintenanceService.optimizeDatabase();

      // Assert
      expect(result.isSuccess).toBe(true);
      const optimizationResult = result.getValue()!;

      expect(optimizationResult.message).toBe('Database optimization completed successfully');
      expect(optimizationResult.operationsPerformed).toHaveLength(4);
      expect(optimizationResult.operationsPerformed).toContain('Analyzed table statistics');
      expect(optimizationResult.operationsPerformed).toContain('Rebuilt indexes');
      expect(optimizationResult.operationsPerformed).toContain('Cleaned up orphaned records');
      expect(optimizationResult.operationsPerformed).toContain('Optimized query plans');

      expect(mockLogger.info).toHaveBeenCalledWith('Starting database optimization');
      expect(mockLogger.info).toHaveBeenCalledWith('Database optimization completed', {
        operationsCount: 4,
      });
    });

    it('should return failure when optimization throws error', async () => {
      // Arrange - Mock database.collections.get to throw an error
      const optimizationError = new Error('Database collection access failed');
      mockDatabase.collections.get.mockImplementation(() => {
        throw optimizationError;
      });

      // Act
      const result = await maintenanceService.optimizeDatabase();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to optimize database');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to optimize database',
        optimizationError
      );
    });
  });

  describe('validateDataIntegrity', () => {
    it('should successfully validate data integrity with no issues', async () => {
      // Arrange
      const validProfile = createTestProfileModel({ id: profileId });
      const validWorkout = createTestWorkoutLogModel({ id: 'workout-1', profileId });
      const validMaxLog = createTestMaxLogModel({ id: 'max-1', profileId });

      mockProfileRepository.findAll.mockResolvedValue([validProfile]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([validWorkout]);
      mockMaxLogRepository.findAll.mockResolvedValue([validMaxLog]);
      mockProfileRepository.findById.mockResolvedValue(validProfile);

      vi.spyOn(validProfile, 'validate').mockReturnValue({ success: true });

      // Act
      const result = await maintenanceService.validateDataIntegrity();

      // Assert
      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue()!;

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.issues).toHaveLength(0);
      expect(validationResult.totalRecordsChecked).toBe(3); // 1 profile + 1 workout + 1 max log

      expect(mockLogger.info).toHaveBeenCalledWith('Starting data integrity validation');
      expect(mockLogger.info).toHaveBeenCalledWith('Data integrity validation completed', {
        totalRecordsChecked: 3,
        issuesFound: 0,
      });
    });

    it('should detect profile validation issues', async () => {
      // Arrange
      const invalidProfile = createTestProfileModel({ id: profileId });

      mockProfileRepository.findAll.mockResolvedValue([invalidProfile]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([]);
      mockMaxLogRepository.findAll.mockResolvedValue([]);

      vi.spyOn(invalidProfile, 'validate').mockReturnValue({
        success: false,
        error: { errors: ['Name is required', 'Invalid date format'] },
      });

      // Act
      const result = await maintenanceService.validateDataIntegrity();

      // Assert
      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue()!;

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.issues).toHaveLength(1);
      expect(validationResult.issues[0]).toContain('Name is required, Invalid date format');
      expect(validationResult.totalRecordsChecked).toBe(1);
    });

    it('should detect orphaned workout logs', async () => {
      // Arrange
      const orphanedWorkout = createTestWorkoutLogModel({
        id: 'orphaned-workout',
        profileId: 'non-existent-profile',
      });

      mockProfileRepository.findAll.mockResolvedValue([]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([orphanedWorkout]);
      mockMaxLogRepository.findAll.mockResolvedValue([]);
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maintenanceService.validateDataIntegrity();

      // Assert
      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue()!;

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.issues).toHaveLength(1);
      expect(validationResult.issues[0]).toContain('orphaned profile reference');
      expect(validationResult.issues[0]).toContain('non-existent-profile');
    });

    it('should detect orphaned max logs', async () => {
      // Arrange
      const orphanedMaxLog = createTestMaxLogModel({
        id: 'orphaned-max',
        profileId: 'non-existent-profile',
      });

      mockProfileRepository.findAll.mockResolvedValue([]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([]);
      mockMaxLogRepository.findAll.mockResolvedValue([orphanedMaxLog]);
      mockProfileRepository.findById.mockResolvedValue(undefined);

      // Act
      const result = await maintenanceService.validateDataIntegrity();

      // Assert
      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue()!;

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.issues).toHaveLength(1);
      expect(validationResult.issues[0]).toContain('orphaned profile reference');
      expect(validationResult.issues[0]).toContain('non-existent-profile');
    });

    it('should return failure when validation throws error', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      mockProfileRepository.findAll.mockRejectedValue(validationError);

      // Act
      const result = await maintenanceService.validateDataIntegrity();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to validate data integrity');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to validate data integrity',
        validationError
      );
    });
  });
});
