import { Q, Query } from '@nozbe/watermelondb';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { container } from 'tsyringe';
import { vi } from 'vitest';

import { type BlueprintFitnessDB } from '@/app/db/database';
import { Exercise } from '@/app/db/model/Exercise';
import { Profile } from '@/app/db/model/Profile';
import { TrainingCycle } from '@/app/db/model/TrainingCycle';
import { TrainingPlan } from '@/app/db/model/TrainingPlan';
import { WeightRecord } from '@/app/db/model/WeightRecord';
import { WorkoutLog } from '@/app/db/model/WorkoutLog';
import { AppServicesProvider } from '@/app/providers/AppServicesProvider';
import { generateId } from '@/lib/id';
import { createTestDatabase } from '@/test-database';

/**
 * Comprehensive test utilities for WatermelonDB reactive hook testing.
 *
 * This module provides utilities specifically designed for testing hooks that use
 * useObserveQuery pattern with WatermelonDB. It includes database setup, data seeding,
 * reactive update testing, and proper cleanup mechanisms.
 */

/**
 * Test database instance with helper methods for reactive hook testing
 */
export interface ReactiveHookTestDatabase extends BlueprintFitnessDB {
  // Database manipulation helpers
  createProfile: (data?: Partial<any>) => Promise<string>;
  createWorkoutLog: (profileId: string, data?: Partial<any>) => Promise<string>;
  createTrainingPlan: (profileId: string, data?: Partial<any>) => Promise<string>;
  createTrainingCycle: (profileId: string, data?: Partial<any>) => Promise<string>;
  createWeightRecord: (profileId: string, data?: Partial<any>) => Promise<string>;
  createExercise: (profileId: string, data?: Partial<any>) => Promise<string>;
  updateRecord: (tableName: string, id: string, updates: Record<string, any>) => Promise<void>;
  deleteRecord: (tableName: string, id: string) => Promise<void>;

  // Query helpers for verification
  getProfileCount: () => Promise<number>;
  getWorkoutLogCount: (profileId?: string) => Promise<number>;
  getTrainingPlanCount: (profileId?: string) => Promise<number>;
  getWeightRecordCount: (profileId?: string) => Promise<number>;

  // Cleanup helper for memory management
  cleanup: () => Promise<void>;
}

/**
 * Creates a test database with enhanced utilities for reactive hook testing
 */
export function createReactiveHookTestDatabase(): ReactiveHookTestDatabase {
  const database = createTestDatabase();

  // Helper to create a profile with default data
  const createProfile = async (data: Partial<any> = {}): Promise<string> => {
    const profileId = generateId();
    const now = Date.now();

    await database.write(async () => {
      await database.batch(
        database.get<Profile>('profiles').prepareCreate((profile) => {
          (profile._raw as any).id = profileId;
          (profile._raw as any).name = data.name || 'Test Profile';
          (profile._raw as any).created_at = data.createdAt || now;
          (profile._raw as any).updated_at = data.updatedAt || now;
        })
      );
    });

    return profileId;
  };

  // Helper to create a workout log
  const createWorkoutLog = async (profileId: string, data: Partial<any> = {}): Promise<string> => {
    const workoutLogId = generateId();
    const now = Date.now();

    await database.write(async () => {
      await database.batch(
        database.get<WorkoutLog>('workout_logs').prepareCreate((workoutLog) => {
          (workoutLog._raw as any).id = workoutLogId;
          (workoutLog._raw as any).profile_id = profileId;
          (workoutLog._raw as any).training_plan_id = data.trainingPlanId || generateId();
          (workoutLog._raw as any).training_plan_name = data.trainingPlanName || 'Test Plan';
          (workoutLog._raw as any).session_id = data.sessionId || generateId();
          (workoutLog._raw as any).session_name = data.sessionName || 'Test Session';
          (workoutLog._raw as any).performed_group_ids = JSON.stringify(
            data.performedGroupIds || []
          );
          (workoutLog._raw as any).start_time = data.startTime || now;
          (workoutLog._raw as any).end_time = data.endTime || null;
          (workoutLog._raw as any).duration_seconds = data.durationSeconds || 0;
          (workoutLog._raw as any).total_volume = data.totalVolume || 0;
          (workoutLog._raw as any).notes = data.notes || '';
          (workoutLog._raw as any).user_rating = data.userRating || null;
          (workoutLog._raw as any).created_at = data.createdAt || now;
          (workoutLog._raw as any).updated_at = data.updatedAt || now;
        })
      );
    });

    return workoutLogId;
  };

  // Helper to create a training plan
  const createTrainingPlan = async (
    profileId: string,
    data: Partial<any> = {}
  ): Promise<string> => {
    const planId = generateId();
    const now = Date.now();

    await database.write(async () => {
      await database.batch(
        database.get<TrainingPlan>('training_plans').prepareCreate((plan) => {
          (plan._raw as any).id = planId;
          (plan._raw as any).profile_id = profileId;
          (plan._raw as any).name = data.name || 'Test Training Plan';
          (plan._raw as any).description = data.description || 'Test Description';
          (plan._raw as any).is_archived = data.isArchived || false;
          (plan._raw as any).current_session_index = data.currentSessionIndex || 0;
          (plan._raw as any).notes = data.notes || '';
          (plan._raw as any).cycle_id = data.cycleId || '';
          (plan._raw as any).order = data.order || 0;
          (plan._raw as any).last_used = data.lastUsed || now;
          (plan._raw as any).created_at = data.createdAt || now;
          (plan._raw as any).updated_at = data.updatedAt || now;
        })
      );
    });

    return planId;
  };

  // Helper to create a training cycle
  const createTrainingCycle = async (
    profileId: string,
    data: Partial<any> = {}
  ): Promise<string> => {
    const cycleId = generateId();
    const now = Date.now();

    await database.write(async () => {
      await database.batch(
        database.get<TrainingCycle>('training_cycles').prepareCreate((cycle) => {
          (cycle._raw as any).id = cycleId;
          (cycle._raw as any).profile_id = profileId;
          (cycle._raw as any).name = data.name || 'Test Training Cycle';
          (cycle._raw as any).description = data.description || 'Test Description';
          (cycle._raw as any).is_archived = data.isArchived || false;
          (cycle._raw as any).order = data.order || 0;
          (cycle._raw as any).created_at = data.createdAt || now;
          (cycle._raw as any).updated_at = data.updatedAt || now;
        })
      );
    });

    return cycleId;
  };

  // Helper to create a weight record
  const createWeightRecord = async (
    profileId: string,
    data: Partial<any> = {}
  ): Promise<string> => {
    const recordId = generateId();
    const now = Date.now();

    await database.write(async () => {
      await database.batch(
        database.get<WeightRecord>('weight_records').prepareCreate((record) => {
          (record._raw as any).id = recordId;
          (record._raw as any).profile_id = profileId;
          (record._raw as any).date = data.date || now;
          (record._raw as any).weight = data.weight || 70.0;
          (record._raw as any).notes = data.notes || '';
          (record._raw as any).created_at = data.createdAt || now;
          (record._raw as any).updated_at = data.updatedAt || now;
        })
      );
    });

    return recordId;
  };

  // Helper to create an exercise
  const createExercise = async (profileId: string, data: Partial<any> = {}): Promise<string> => {
    const exerciseId = generateId();
    const now = Date.now();

    await database.write(async () => {
      await database.batch(
        database.get<Exercise>('exercises').prepareCreate((exercise) => {
          (exercise._raw as any).id = exerciseId;
          (exercise._raw as any).profile_id = profileId;
          (exercise._raw as any).name = data.name || 'Test Exercise';
          (exercise._raw as any).description = data.description || 'Test Description';
          (exercise._raw as any).category = data.category || 'strength';
          (exercise._raw as any).movement_type = data.movementType || 'compound';
          (exercise._raw as any).movement_pattern = data.movementPattern || 'squat';
          (exercise._raw as any).difficulty = data.difficulty || 'beginner';
          (exercise._raw as any).equipment = JSON.stringify(data.equipment || []);
          (exercise._raw as any).muscle_activation = JSON.stringify(data.muscleActivation || {});
          (exercise._raw as any).counter_type = data.counterType || 'reps';
          (exercise._raw as any).joint_type = data.jointType || 'multi';
          (exercise._raw as any).notes = data.notes || '';
          (exercise._raw as any).substitutions = JSON.stringify(data.substitutions || []);
          (exercise._raw as any).created_at = data.createdAt || now;
          (exercise._raw as any).updated_at = data.updatedAt || now;
        })
      );
    });

    return exerciseId;
  };

  // Helper to update any record
  const updateRecord = async (
    tableName: string,
    id: string,
    updates: Record<string, any>
  ): Promise<void> => {
    await database.write(async () => {
      const record = await database.get(tableName).find(id);
      await record.update(() => {
        Object.keys(updates).forEach((key) => {
          (record as any)._raw[key] = updates[key];
        });
      });
    });
  };

  // Helper to delete any record
  const deleteRecord = async (tableName: string, id: string): Promise<void> => {
    await database.write(async () => {
      const record = await database.get(tableName).find(id);
      await record.markAsDeleted();
    });
  };

  // Query helpers for verification
  const getProfileCount = async (): Promise<number> => {
    const profiles = await database.get('profiles').query().fetch();
    return profiles.length;
  };

  const getWorkoutLogCount = async (profileId?: string): Promise<number> => {
    let query: any = database.get('workout_logs').query();
    if (profileId) {
      query = query.where('profile_id', Q.eq(profileId));
    }
    const logs = await query.fetch();
    return logs.length;
  };

  const getTrainingPlanCount = async (profileId?: string): Promise<number> => {
    let query: any = database.get('training_plans').query();
    if (profileId) {
      query = query.where('profile_id', Q.eq(profileId));
    }
    const plans = await query.fetch();
    return plans.length;
  };

  const getWeightRecordCount = async (profileId?: string): Promise<number> => {
    let query: any = database.get('weight_records').query();
    if (profileId) {
      query = query.where('profile_id', Q.eq(profileId));
    }
    const records = await query.fetch();
    return records.length;
  };

  // Cleanup helper for memory management
  const cleanup = async (): Promise<void> => {
    try {
      // Clear all subscriptions and cached data
      await database.write(async () => {
        // Reset all collections to clear cached data
        const collections = [
          'profiles',
          'workout_logs',
          'training_plans',
          'training_cycles',
          'weight_records',
          'exercises',
        ];
        for (const collectionName of collections) {
          const collection = database.get(collectionName);
          const records = await collection.query().fetch();
          if (records.length > 0) {
            await database.batch(...records.map((record) => record.prepareDestroyPermanently()));
          }
        }
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (_error) {
      console.warn('Cleanup warning:', _error);
    }
  };

  // Create a proper extended database that preserves the original database methods
  const extendedDatabase = database as unknown as ReactiveHookTestDatabase;

  // Add the helper methods to the database instance
  extendedDatabase.createProfile = createProfile;
  extendedDatabase.createWorkoutLog = createWorkoutLog;
  extendedDatabase.createTrainingPlan = createTrainingPlan;
  extendedDatabase.createTrainingCycle = createTrainingCycle;
  extendedDatabase.createWeightRecord = createWeightRecord;
  extendedDatabase.createExercise = createExercise;
  extendedDatabase.updateRecord = updateRecord;
  extendedDatabase.deleteRecord = deleteRecord;
  extendedDatabase.getProfileCount = getProfileCount;
  extendedDatabase.getWorkoutLogCount = getWorkoutLogCount;
  extendedDatabase.getTrainingPlanCount = getTrainingPlanCount;
  extendedDatabase.getWeightRecordCount = getWeightRecordCount;
  extendedDatabase.cleanup = cleanup;

  return extendedDatabase;
}

/**
 * Test wrapper component that provides all necessary providers for reactive hook testing
 */
interface ReactiveHookTestWrapperProps {
  children: ReactNode;
  db: BlueprintFitnessDB;
}

export function ReactiveHookTestWrapper({
  children,
  db,
}: ReactiveHookTestWrapperProps): ReactElement {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // Register the test database instance in the DI container
  container.registerInstance('BlueprintFitnessDB', db);

  return (
    <QueryClientProvider client={testQueryClient}>
      <AppServicesProvider>{children}</AppServicesProvider>
    </QueryClientProvider>
  );
}

/**
 * Enhanced renderHook function specifically for reactive hook testing
 */
export function renderReactiveHook<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: {
    initialProps?: TProps;
    db?: ReactiveHookTestDatabase;
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  } & Omit<RenderHookOptions<TProps>, 'wrapper'>
) {
  const testDb = options?.db || createReactiveHookTestDatabase();

  const Wrapper =
    options?.wrapper ||
    (({ children }) => <ReactiveHookTestWrapper db={testDb}>{children}</ReactiveHookTestWrapper>);

  const result = renderHook(hook, {
    ...options,
    wrapper: Wrapper,
  });

  return {
    ...result,
    db: testDb,
  };
}

/**
 * Utility function to wait for reactive updates in tests
 * Helps ensure that WatermelonDB observations are properly processed
 */
export function waitForReactiveUpdate(timeout = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Mock implementations for common query services used in reactive hooks
 */
export const createMockQueryService = () => ({
  getWorkoutLogQuery: vi.fn(),
  getWorkoutLogs: vi.fn(),
  getLastWorkoutForSessionQuery: vi.fn(),
  getTrainingPlans: vi.fn(),
  getTrainingPlanQuery: vi.fn(),
  getTrainingCycles: vi.fn(),
  getTrainingCycleQuery: vi.fn(),
  getWeightHistory: vi.fn(),
  getLatestWeightQuery: vi.fn(),
});
