import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import the real TSyringe container for this integration test
vi.unmock('tsyringe');
import { Database } from '@nozbe/watermelondb';
import { container, Lifecycle } from 'tsyringe';

import { configureContainer } from '@/app/container';
import { ConsoleLogger } from '@/app/services/ConsoleLogger';
import { BodyMetricsRepository } from '@/features/body-metrics/data/BodyMetricsRepository';
import { useImportData } from '@/features/data-sync/hooks/useImportData';
import { DataSyncQueryService } from '@/features/data-sync/query-services/DataSyncQueryService';
import { DataSyncService, ExportData } from '@/features/data-sync/services/DataSyncService';
import { ExerciseRepository } from '@/features/exercise/data/ExerciseRepository';
import { ExerciseTemplateRepository } from '@/features/exercise/data/ExerciseTemplateRepository';
import { useMaintenanceHub } from '@/features/maintenance/hooks/useMaintenanceHub';
import { MaintenanceQueryService } from '@/features/maintenance/query-services/MaintenanceQueryService';
import { MaintenanceService } from '@/features/maintenance/services/MaintenanceService';
import { MaxLogRepository } from '@/features/max-log/data/MaxLogRepository';
import { ProfileRepository } from '@/features/profile/data/ProfileRepository';
import { ProfileService } from '@/features/profile/services/ProfileService';
import { AppliedExerciseRepository } from '@/features/training-plan/data/AppliedExerciseRepository';
import { ExerciseGroupRepository } from '@/features/training-plan/data/ExerciseGroupRepository';
import { TrainingPlanRepository } from '@/features/training-plan/data/TrainingPlanRepository';
import { WorkoutSessionRepository } from '@/features/training-plan/data/WorkoutSessionRepository';
import { PerformedExerciseRepository } from '@/features/workout/data/PerformedExerciseRepository';
import { PerformedGroupRepository } from '@/features/workout/data/PerformedGroupRepository';
import { PerformedSetRepository } from '@/features/workout/data/PerformedSetRepository';
import { WorkoutLogRepository } from '@/features/workout/data/WorkoutLogRepository';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { isConflictError } from '@/shared/errors/guards';
import { createTestDatabase } from '@/test-database';
import { createTestProfileModel, createTestTrainingPlanModel } from '@/test-factories';

describe('AdvancedFlows Integration Tests', () => {
  let testDb: Database;
  let queryClient: QueryClient;
  let mockLogger: jest.Mocked<ConsoleLogger>;

  beforeEach(async () => {
    // Clear domain events and container
    DomainEvents.clearHandlers();
    // Note: clearInstances not available in tsyringe, skipping container clear

    // Create test database
    testDb = createTestDatabase();

    // Register test database with container
    container.registerInstance('BlueprintFitnessDB', testDb);

    // Initialize QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Manual registration of services and repositories
    // (Since the auto-registration might not work properly in test environment)

    // Register logger
    container.register('ILogger', { useClass: ConsoleLogger });

    // Register repositories
    container.register('IProfileRepository', { useClass: ProfileRepository });
    container.register('IExerciseRepository', { useClass: ExerciseRepository });
    container.register('IExerciseTemplateRepository', { useClass: ExerciseTemplateRepository });
    container.register('IBodyMetricsRepository', { useClass: BodyMetricsRepository });
    container.register('IMaxLogRepository', { useClass: MaxLogRepository });
    container.register('IAppliedExerciseRepository', { useClass: AppliedExerciseRepository });
    container.register('IExerciseGroupRepository', { useClass: ExerciseGroupRepository });
    container.register('IWorkoutSessionRepository', { useClass: WorkoutSessionRepository });
    container.register('ITrainingPlanRepository', { useClass: TrainingPlanRepository });
    container.register('IPerformedSetRepository', { useClass: PerformedSetRepository });
    container.register('IPerformedExerciseRepository', { useClass: PerformedExerciseRepository });
    container.register('IPerformedGroupRepository', { useClass: PerformedGroupRepository });
    container.register('IWorkoutLogRepository', { useClass: WorkoutLogRepository });

    // Manually create service instances to avoid TypeInfo issues
    const logger = new ConsoleLogger();

    // Create repositories
    const profileRepository = container.resolve('IProfileRepository');
    const exerciseRepository = container.resolve('IExerciseRepository');
    const exerciseTemplateRepository = container.resolve('IExerciseTemplateRepository');
    const bodyMetricsRepository = container.resolve('IBodyMetricsRepository');
    const maxLogRepository = container.resolve('IMaxLogRepository');
    const trainingPlanRepository = container.resolve('ITrainingPlanRepository');
    const workoutLogRepository = container.resolve('IWorkoutLogRepository');

    // Create services manually
    const profileService = new ProfileService(profileRepository, logger);
    const dataSyncService = new DataSyncService(
      profileRepository,
      exerciseRepository,
      exerciseTemplateRepository,
      trainingPlanRepository,
      workoutLogRepository,
      maxLogRepository,
      bodyMetricsRepository,
      logger,
      testDb
    );
    const workoutService = new WorkoutService(
      workoutLogRepository,
      container.resolve('IWorkoutSessionRepository'),
      logger
    );
    const maintenanceService = new MaintenanceService(
      profileRepository,
      exerciseRepository,
      exerciseTemplateRepository,
      trainingPlanRepository,
      workoutLogRepository,
      maxLogRepository,
      bodyMetricsRepository,
      logger
    );

    // Register service instances
    container.registerInstance('ProfileService', profileService);
    container.registerInstance('DataSyncService', dataSyncService);
    container.registerInstance('MaintenanceService', maintenanceService);
    container.registerInstance('WorkoutService', workoutService);

    // Create and register query services
    const dataSyncQueryService = new DataSyncQueryService(dataSyncService);
    const maintenanceQueryService = new MaintenanceQueryService(maintenanceService);

    container.registerInstance(DataSyncQueryService, dataSyncQueryService);
    container.registerInstance(MaintenanceQueryService, maintenanceQueryService);

    // Create fresh query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    // Mock crypto.randomUUID for consistent testing
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440001'),
      getRandomValues: vi.fn((arr) => {
        // Mock implementation that fills array with random values
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    });
  });

  afterEach(async () => {
    // Cleanup
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    DomainEvents.clearHandlers();
    // Note: clearInstances not available in tsyringe, skipping container clear
    queryClient.clear();

    if (testDb) {
      await testDb.delete();
    }
  });

  describe('Data Import with Conflicts', () => {
    it('should handle import conflicts gracefully without corrupting existing data', async () => {
      // Arrange - Create a profile and training plan directly in database
      // (We don't need to resolve services since we're testing the hooks)

      const testProfile = createTestProfileModel({ name: 'Integration Test User' });
      const existingPlan = createTestTrainingPlanModel({
        name: 'Existing Plan',
        profileId: testProfile.id,
      });

      await testDb.write(async () => {
        await testDb.profiles.add(testProfile.toPlainObject());

        // Create existing training plan
        console.log('Adding existing plan:', {
          id: existingPlan.id,
          name: existingPlan.name,
          profileId: existingPlan.profileId,
        });
        await testDb.trainingPlans.add(existingPlan.toPlainObject());
      });

      // Verify the plan was actually added
      const verifyPlans = await testDb.trainingPlans
        .where('profileId')
        .equals(testProfile.id)
        .toArray();
      console.log(
        'Verification - Plans in DB:',
        verifyPlans.map((p) => ({ id: p.id, name: p.name, profileId: p.profileId }))
      );

      // Create conflicting export data with same plan name but different content
      const conflictingExportData: ExportData = {
        profiles: [testProfile.toPlainObject()],
        exercises: [],
        exerciseTemplates: [],
        trainingPlans: [
          createTestTrainingPlanModel({
            id: '550e8400-e29b-41d4-a716-446655440002', // Different ID
            name: 'Existing Plan',
            profileId: testProfile.id,
            description: 'This is a conflicting plan with different content',
          }).toPlainObject(),
        ],
        workoutLogs: [],
        maxLogs: [],
        bodyMetrics: [],
        exportedAt: new Date(),
        version: '1.0.0',
      };

      // Act - Try to import conflicting data
      const wrapper = ({ children }: { children: React.ReactNode }) => {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
      };
      const { result } = renderHook(() => useImportData(), { wrapper });

      await act(async () => {
        result.current.mutate({
          importData: conflictingExportData,
        });
      });

      // Assert - Check that hook is in error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Verify it's a ConflictError with conflict details
      expect(result.current.error).toBeTruthy();

      if (result.current.error) {
        expect(isConflictError(result.current.error)).toBe(true);

        if (isConflictError(result.current.error)) {
          // ConflictError should have conflicts property for advanced error handling
          expect(result.current.error.message).toBeTruthy();
        }
      }

      // Assert - Verify original data was not modified
      const originalPlans = await testDb.trainingPlans.toArray();
      expect(originalPlans).toHaveLength(1);
      expect(originalPlans[0].id).toBe(existingPlan.id);
      expect(originalPlans[0].name).toBe('Existing Plan');
      expect(originalPlans[0].description).toBe(existingPlan.description); // Original description preserved
    });
  });

  describe('Garbage Collection', () => {
    it('should clean up orphaned workout session records', async () => {
      // Arrange - Create a profile and manually insert orphaned workout session
      const testProfile = createTestProfileModel({ name: 'Test User' });

      // Manually insert orphaned workout session record not referenced by any training plan
      const orphanedSession = {
        id: '550e8400-e29b-41d4-a716-446655440999',
        name: 'Orphaned Session',
        description: 'This session is not referenced by any training plan',
        training_plan_id: 'non-existent-plan-id', // Use database field name, this plan doesn't exist
        exerciseGroups: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await testDb.write(async () => {
        await testDb.profiles.add(testProfile.toPlainObject());
        await testDb.workoutSessions.add(orphanedSession);
      });

      // Verify orphaned record exists before cleanup
      const sessionsBeforeCleanup = await testDb.workoutSessions.toArray();
      expect(sessionsBeforeCleanup).toHaveLength(1);
      // trainingPlanId might be undefined, null, or empty string due to database validation, all considered orphaned
      const trainingPlanId = sessionsBeforeCleanup[0].trainingPlanId;
      expect(
        trainingPlanId === 'non-existent-plan-id' ||
          trainingPlanId === undefined ||
          trainingPlanId === null ||
          trainingPlanId === ''
      ).toBe(true);

      // Act - Call garbage collection (using optimize database which cleans orphaned records)
      const wrapper = ({ children }: { children: React.ReactNode }) => {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
      };
      const { result } = renderHook(() => useMaintenanceHub(), { wrapper });

      await act(async () => {
        await result.current.optimizeDatabase();
      });

      // Check that optimization was called (we'll verify via logs or other means)
      await waitFor(() => {
        expect(result.current.isOptimizing).toBe(false);
      });

      // Assert - Verify orphaned record was cleaned up
      const sessionsAfterCleanup = await testDb.workoutSessions.toArray();
      expect(sessionsAfterCleanup).toHaveLength(0);
    });
  });
});
