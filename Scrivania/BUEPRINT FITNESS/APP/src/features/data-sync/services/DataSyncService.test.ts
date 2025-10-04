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
import { ConflictError } from '@/shared/errors/ConflictError';
import {
  createTestExerciseModel,
  createTestMaxLogModel,
  createTestProfileModel,
  createTestWeightRecordModel,
  createTestWorkoutLogModel,
} from '@/test-factories';

import { DataSyncService, ExportData, ExportStatus, ImportStatus } from './DataSyncService';

describe('DataSyncService', () => {
  let dataSyncService: DataSyncService;
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
      saveWeight: vi.fn(),
      saveHeight: vi.fn(),
      findWeightRecordsByProfile: vi.fn(),
      findWeightRecordsByProfileAndDateRange: vi.fn(),
      findHeightRecordsByProfile: vi.fn(),
      findHeightRecordsByProfileAndDateRange: vi.fn(),
      findWeightHistory: vi.fn(),
      findHeightHistory: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockDatabase = {
      write: vi.fn().mockImplementation((fn) => fn()),
      get: vi.fn().mockReturnValue({
        find: vi.fn().mockRejectedValue(new Error('Record not found')),
        create: vi.fn().mockImplementation((fn) => {
          const record = { _raw: {} };
          fn(record);
          return record;
        }),
        update: vi.fn().mockImplementation((fn) => fn({ _raw: {} })),
      }),
    };

    dataSyncService = new DataSyncService(
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
    vi.spyOn(dataSyncService as any, 'sleep').mockResolvedValue(undefined);

    // Mock crypto for WatermelonDB compatibility
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440007'),
      getRandomValues: vi.fn((arr) => {
        // Fill the array with pseudo-random values for testing
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  describe('exportData', () => {
    it('should successfully export user data', async () => {
      // Arrange
      const testProfile = createTestProfileModel({ id: profileId });
      const testExercise = createTestExerciseModel({ id: 'exercise-1' });
      const testWorkout = createTestWorkoutLogModel({ id: 'workout-1', profileId });
      const testMaxLog = createTestMaxLogModel({ id: 'max-1', profileId });
      const testWeightRecord = createTestWeightRecordModel({ id: 'weight-1', profileId });

      mockProfileRepository.findById.mockResolvedValue(testProfile);
      mockExerciseRepository.findAll.mockResolvedValue([testExercise]);
      mockExerciseTemplateRepository.findAll.mockResolvedValue([]);
      mockTrainingPlanRepository.findAll.mockResolvedValue([]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([testWorkout]);
      mockMaxLogRepository.findAll.mockResolvedValue([testMaxLog]);
      mockBodyMetricsRepository.findWeightRecordsByProfile.mockResolvedValue([testWeightRecord]);
      mockBodyMetricsRepository.findHeightRecordsByProfile.mockResolvedValue([]);
      mockBodyMetricsRepository.findWeightHistory.mockResolvedValue([testWeightRecord]);
      mockBodyMetricsRepository.findHeightHistory.mockResolvedValue([]);

      const progressUpdates: ExportStatus[] = [];
      const onProgress = (status: ExportStatus) => {
        progressUpdates.push({ ...status });
      };

      // Act
      const result = await dataSyncService.exportData(profileId, onProgress);

      // Debug - Log error if not successful
      if (!result.isSuccess) {
        console.error('Export failed:', result.error);
      }

      // Assert
      expect(result.isSuccess).toBe(true);
      const exportData = result.getValue()!;

      expect(exportData.profiles).toHaveLength(1);
      expect(exportData.exercises).toHaveLength(1);
      expect(exportData.workoutLogs).toHaveLength(1);
      expect(exportData.maxLogs).toHaveLength(1);
      expect(exportData.bodyMetrics).toHaveLength(1);
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.exportedAt).toBeInstanceOf(Date);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].isComplete).toBe(true);

      expect(mockLogger.info).toHaveBeenCalledWith('Starting data export', { profileId });
      expect(mockLogger.info).toHaveBeenCalledWith('Data export completed successfully', {
        profileId,
        totalRecords: 5,
        errors: 0,
      });
    });

    it('should handle profile not found', async () => {
      // Arrange
      mockProfileRepository.findById.mockResolvedValue(undefined);
      mockExerciseRepository.findAll.mockResolvedValue([]);
      mockExerciseTemplateRepository.findAll.mockResolvedValue([]);
      mockTrainingPlanRepository.findAll.mockResolvedValue([]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([]);
      mockMaxLogRepository.findAll.mockResolvedValue([]);
      mockBodyMetricsRepository.findWeightHistory.mockResolvedValue([]);
      mockBodyMetricsRepository.findHeightHistory.mockResolvedValue([]);

      // Act
      const result = await dataSyncService.exportData(profileId);

      // Assert
      expect(result.isSuccess).toBe(true);
      const exportData = result.getValue()!;
      expect(exportData.profiles).toHaveLength(0);
    });

    it('should handle export errors gracefully', async () => {
      // Arrange
      const repositoryError = new Error('Repository error');
      mockProfileRepository.findById.mockRejectedValue(repositoryError);

      // Act
      const result = await dataSyncService.exportData(profileId);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ApplicationError);
      expect(result.error?.message).toBe('Failed to export data');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to export data', repositoryError, {
        profileId,
      });
    });

    it('should provide progress updates during export', async () => {
      // Arrange
      mockProfileRepository.findById.mockResolvedValue(createTestProfileModel({ id: profileId }));
      mockExerciseRepository.findAll.mockResolvedValue([]);
      mockExerciseTemplateRepository.findAll.mockResolvedValue([]);
      mockTrainingPlanRepository.findAll.mockResolvedValue([]);
      mockWorkoutLogRepository.findAll.mockResolvedValue([]);
      mockMaxLogRepository.findAll.mockResolvedValue([]);
      mockBodyMetricsRepository.findWeightHistory.mockResolvedValue([]);
      mockBodyMetricsRepository.findHeightHistory.mockResolvedValue([]);

      let finalStatus: ExportStatus | undefined;
      const onProgress = (status: ExportStatus) => {
        finalStatus = status;
      };

      // Act
      const result = await dataSyncService.exportData(profileId, onProgress);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(finalStatus).toBeDefined();
      expect(finalStatus!.isComplete).toBe(true);
      expect(finalStatus!.totalRecords).toBe(1);
      expect(finalStatus!.processedRecords).toBe(1);
    });
  });

  describe('importData', () => {
    const createTestImportData = (): ExportData => ({
      profiles: [createTestProfileModel({ id: profileId })],
      exercises: [createTestExerciseModel({ id: 'exercise-1' })],
      exerciseTemplates: [],
      trainingPlans: [],
      workoutLogs: [createTestWorkoutLogModel({ id: 'workout-1', profileId })],
      maxLogs: [createTestMaxLogModel({ id: 'max-1', profileId })],
      bodyMetrics: [createTestWeightRecordModel({ id: 'weight-1', profileId, weight: 75 })],
      exportedAt: new Date(),
      version: '1.0.0',
    });

    it('should successfully import data', async () => {
      // Arrange
      const importData = createTestImportData();

      mockProfileRepository.save.mockResolvedValue(importData.profiles[0]);
      mockExerciseRepository.save.mockResolvedValue(importData.exercises[0]);
      mockWorkoutLogRepository.save.mockResolvedValue(importData.workoutLogs[0]);
      mockMaxLogRepository.save.mockResolvedValue(importData.maxLogs[0]);
      mockBodyMetricsRepository.saveWeight.mockResolvedValue(importData.bodyMetrics[0]);

      const progressUpdates: ImportStatus[] = [];
      const onProgress = (status: ImportStatus) => {
        progressUpdates.push({ ...status });
      };

      // Act
      const result = await dataSyncService.importData(importData, onProgress);

      // Assert
      expect(result.isSuccess).toBe(true);
      const status = result.getValue()!;

      expect(status.isComplete).toBe(true);
      expect(status.totalRecords).toBe(5);
      expect(status.processedRecords).toBe(5);
      expect(status.successfulRecords).toBe(5);
      expect(status.failedRecords).toBe(0);
      expect(status.errors).toHaveLength(0);

      // Service uses direct database operations instead of repository.save() for performance
      expect(mockDatabase.write).toHaveBeenCalled();
      expect(mockBodyMetricsRepository.saveWeight).toHaveBeenCalledTimes(1); // Body metrics still uses repository method

      expect(mockLogger.info).toHaveBeenCalledWith('Starting data import', {
        version: '1.0.0',
        totalRecords: 5,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Data import completed', {
        totalRecords: 5,
        successfulRecords: 5,
        failedRecords: 0,
        errors: 0,
      });
    });

    it('should handle version mismatch with warning', async () => {
      // Arrange
      const importData = createTestImportData();
      importData.version = '0.9.0'; // Incompatible version

      mockProfileRepository.save.mockResolvedValue(importData.profiles[0]);
      mockExerciseRepository.save.mockResolvedValue(importData.exercises[0]);
      mockWorkoutLogRepository.save.mockResolvedValue(importData.workoutLogs[0]);
      mockMaxLogRepository.save.mockResolvedValue(importData.maxLogs[0]);
      mockBodyMetricsRepository.saveWeight.mockResolvedValue(importData.bodyMetrics[0]);

      // Act
      const result = await dataSyncService.importData(importData);

      // Assert
      expect(result.isSuccess).toBe(true);
      const status = result.getValue()!;

      expect(status.errors.length).toBeGreaterThan(0);
      expect(status.errors[0]).toContain('Incompatible data version');

      expect(mockLogger.warn).toHaveBeenCalledWith('Import version mismatch', {
        importVersion: '0.9.0',
        supportedVersion: '1.0.0',
      });
    });

    it('should handle individual record import failures', async () => {
      // Arrange
      const importData = createTestImportData();

      // Mock database to fail for exercises collection
      const exerciseCollection = {
        find: vi.fn().mockRejectedValue(new Error('Record not found')),
        create: vi.fn().mockRejectedValue(new Error('Exercise save failed')),
        update: vi.fn(),
      };

      mockDatabase.get.mockImplementation((collectionName: string) => {
        if (collectionName === 'exercises') {
          return exerciseCollection;
        }
        // Return normal mock for other collections
        return {
          find: vi.fn().mockRejectedValue(new Error('Record not found')),
          create: vi.fn().mockImplementation((fn) => {
            const record = { _raw: {} };
            fn(record);
            return record;
          }),
          update: vi.fn().mockImplementation((fn) => fn({ _raw: {} })),
        };
      });

      mockBodyMetricsRepository.saveWeight.mockResolvedValue(importData.bodyMetrics[0]);

      // Act
      const result = await dataSyncService.importData(importData);

      // Assert
      expect(result.isSuccess).toBe(true);
      const status = result.getValue()!;

      expect(status.isComplete).toBe(true);
      expect(status.totalRecords).toBe(5);
      expect(status.processedRecords).toBe(5);
      expect(status.successfulRecords).toBe(4);
      expect(status.failedRecords).toBe(1);
      expect(status.errors.length).toBe(1);
      expect(status.errors[0]).toContain('Failed to import exercises record');
    });

    it('should handle complete import failure', async () => {
      // Arrange
      const importData = createTestImportData();
      const repositoryError = new Error('Critical repository error');

      // Mock database to fail for all collections
      mockDatabase.get.mockReturnValue({
        find: vi.fn().mockRejectedValue(new Error('Record not found')),
        create: vi.fn().mockRejectedValue(repositoryError),
        update: vi.fn().mockRejectedValue(repositoryError),
      });

      // Also mock body metrics repository to fail
      mockBodyMetricsRepository.saveWeight.mockRejectedValue(repositoryError);

      // Act
      const result = await dataSyncService.importData(importData);

      // Assert - Service should fail with ConflictError when all records fail (100% failure rate >= 50% threshold)
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ConflictError);
      expect(result.error?.message).toBe('import.conflicts.detected');

      // Verify the error contains conflict details (added as custom property)
      if (result.error instanceof ConflictError) {
        const errorWithConflicts = result.error as any;
        expect(errorWithConflicts.conflicts).toBeDefined();
        expect(Array.isArray(errorWithConflicts.conflicts)).toBe(true);
        expect(errorWithConflicts.conflicts.length).toBeGreaterThan(0);
        // Verify the structure of conflict objects
        expect(errorWithConflicts.conflicts[0]).toHaveProperty('message');
        expect(errorWithConflicts.conflicts[0]).toHaveProperty('type', 'import_failure');
        expect(errorWithConflicts.conflicts[0]).toHaveProperty('index');
      }
    });

    it('should provide progress updates during import', async () => {
      // Arrange
      const importData = createTestImportData();

      mockProfileRepository.save.mockResolvedValue(importData.profiles[0]);
      mockExerciseRepository.save.mockResolvedValue(importData.exercises[0]);
      mockWorkoutLogRepository.save.mockResolvedValue(importData.workoutLogs[0]);
      mockMaxLogRepository.save.mockResolvedValue(importData.maxLogs[0]);
      mockBodyMetricsRepository.saveWeight.mockResolvedValue(importData.bodyMetrics[0]);

      const progressUpdates: ImportStatus[] = [];
      const onProgress = (status: ImportStatus) => {
        progressUpdates.push({ ...status });
      };

      // Act
      const result = await dataSyncService.importData(importData, onProgress);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);

      const finalStatus = progressUpdates[progressUpdates.length - 1];
      expect(finalStatus.isComplete).toBe(true);
      expect(finalStatus.processedRecords).toBe(5);
    });

    it('should handle empty import data', async () => {
      // Arrange
      const importData: ExportData = {
        profiles: [],
        exercises: [],
        exerciseTemplates: [],
        trainingPlans: [],
        workoutLogs: [],
        maxLogs: [],
        bodyMetrics: [],
        exportedAt: new Date(),
        version: '1.0.0',
      };

      // Act
      const result = await dataSyncService.importData(importData);

      // Assert
      expect(result.isSuccess).toBe(true);
      const status = result.getValue()!;

      expect(status.isComplete).toBe(true);
      expect(status.totalRecords).toBe(0);
      expect(status.processedRecords).toBe(0);
      expect(status.successfulRecords).toBe(0);
      expect(status.failedRecords).toBe(0);
    });
  });
});
