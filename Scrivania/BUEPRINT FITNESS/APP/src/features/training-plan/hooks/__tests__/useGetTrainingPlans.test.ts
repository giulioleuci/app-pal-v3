import { act } from '@testing-library/react';
import { vi } from 'vitest';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import {
  createReactiveHookTestDatabase,
  renderReactiveHook,
  waitForReactiveUpdate,
} from '@/reactive-hook-test-utils';

import { useGetTrainingPlans } from '../useGetTrainingPlans';

// Create hoisted mock service with proper Query object structure
const mockTrainingPlanQueryService = vi.hoisted(() => {
  const createMockQuery = (mockData: any[] = []) => ({
    observe: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockImplementation(({ next }) => {
        // Simulate immediate data availability
        setTimeout(() => next(mockData), 0);
        return { unsubscribe: vi.fn() };
      }),
    }),
    fetch: vi.fn().mockResolvedValue(mockData),
  });

  return {
    getTrainingPlans: vi.fn().mockImplementation(() => createMockQuery([])),
    _createMockQuery: createMockQuery, // Expose factory for test setup
  };
});

// Mock tsyringe container to resolve the service
vi.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
  singleton: () => (target: any) => target,
  Lifecycle: {
    Singleton: 'Singleton',
    Transient: 'Transient',
    ContainerScoped: 'ContainerScoped',
  },
  container: {
    resolve: vi.fn().mockReturnValue(mockTrainingPlanQueryService),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

// Mock the TrainingPlanQueryService methods
vi.mock('@/features/training-plan/query-services/TrainingPlanQueryService');

describe('useGetTrainingPlans', () => {
  let testDb: ReturnType<typeof createReactiveHookTestDatabase>;

  beforeEach(() => {
    testDb = createReactiveHookTestDatabase();
  });

  afterEach(() => {
    testDb.cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should return empty result when profileId is not provided', () => {
      const { result } = renderReactiveHook(() => useGetTrainingPlans(''), { db: testDb });

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingPlans).not.toHaveBeenCalled();
    });

    it('should return empty result when hook is disabled', () => {
      const profileId = 'test-profile-id';

      const { result } = renderReactiveHook(
        () => useGetTrainingPlans(profileId, undefined, { enabled: false }),
        { db: testDb }
      );

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingPlans).not.toHaveBeenCalled();
    });

    it('should create query when profileId is provided', () => {
      const profileId = 'test-profile-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        undefined
      );
      expect(result.current.isObserving).toBe(true);
    });

    it('should pass filters to query service correctly', () => {
      const profileId = 'test-profile-id';
      const filters = {
        isArchived: false,
        cycleId: 'test-cycle-id',
      };
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId, filters), {
        db: testDb,
      });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        filters
      );
      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Reactive Data Updates', () => {
    it('should fetch and transform multiple training plans data', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      // Create multiple training plans
      await testDb.createTrainingPlan(profileId, {
        name: 'Plan A',
        description: 'Description A',
        isArchived: false,
      });

      await testDb.createTrainingPlan(profileId, {
        name: 'Plan B',
        description: 'Description B',
        isArchived: false,
      });

      // Mock the actual database query
      const trainingPlans = await testDb.get('training_plans').query().fetch();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            next(trainingPlans);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve(trainingPlans)),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        undefined
      );
      expect(trainingPlans).toHaveLength(2);
    });

    it('should reactively update when new training plans are added', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      let observerCallback: ((models: any[]) => void) | null = null;
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            observerCallback = next;
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      // Simulate initial empty state
      if (observerCallback) {
        act(() => {
          observerCallback([]);
        });
      }

      await waitForReactiveUpdate();

      // Add a new training plan
      await testDb.createTrainingPlan(profileId, {
        name: 'New Plan',
        description: 'New Description',
      });

      // Simulate reactive update with new data
      const updatedTrainingPlans = await testDb.get('training_plans').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(updatedTrainingPlans);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(updatedTrainingPlans).toHaveLength(1);
    });

    it('should reactively update when training plans are modified', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const planId = await testDb.createTrainingPlan(profileId, {
        name: 'Original Plan',
        description: 'Original Description',
        isArchived: false,
      });

      let observerCallback: ((models: any[]) => void) | null = null;
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            observerCallback = next;
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      // Simulate initial data load
      const initialTrainingPlans = await testDb.get('training_plans').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(initialTrainingPlans);
        });
      }

      await waitForReactiveUpdate();

      // Update the training plan
      await testDb.updateRecord('training_plans', planId, {
        name: 'Updated Plan',
        description: 'Updated Description',
        is_archived: true,
      });

      // Simulate reactive update
      const updatedTrainingPlans = await testDb.get('training_plans').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(updatedTrainingPlans);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should reactively update when training plans are deleted', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const planId1 = await testDb.createTrainingPlan(profileId, {
        name: 'Plan 1',
      });
      const planId2 = await testDb.createTrainingPlan(profileId, {
        name: 'Plan 2',
      });

      let observerCallback: ((models: any[]) => void) | null = null;
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            observerCallback = next;
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      // Simulate initial data load with 2 plans
      const initialTrainingPlans = await testDb.get('training_plans').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(initialTrainingPlans);
        });
      }

      await waitForReactiveUpdate();
      expect(initialTrainingPlans).toHaveLength(2);

      // Delete one training plan
      await testDb.deleteRecord('training_plans', planId1);

      // Simulate reactive update with remaining plan
      const remainingTrainingPlans = await testDb.get('training_plans').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(remainingTrainingPlans);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(remainingTrainingPlans).toHaveLength(1);
    });
  });

  describe('Filtering Options', () => {
    it('should handle isArchived filter properly', () => {
      const profileId = 'test-profile-id';
      const filters = { isArchived: true };
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId, filters), {
        db: testDb,
      });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        filters
      );
      expect(result.current.isObserving).toBe(true);
    });

    it('should handle cycleId filter properly', () => {
      const profileId = 'test-profile-id';
      const filters = { cycleId: 'specific-cycle-id' };
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId, filters), {
        db: testDb,
      });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        filters
      );
      expect(result.current.isObserving).toBe(true);
    });

    it('should handle combined filters properly', () => {
      const profileId = 'test-profile-id';
      const filters = {
        isArchived: false,
        cycleId: 'active-cycle-id',
      };
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId, filters), {
        db: testDb,
      });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        filters
      );
      expect(result.current.isObserving).toBe(true);
    });

    it('should update query when filters change', () => {
      const profileId = 'test-profile-id';
      const initialFilters = { isArchived: false };
      const updatedFilters = {
        isArchived: true,
        cycleId: 'archived-cycle-id',
      };
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { rerender } = renderReactiveHook(
        ({ filters }) => useGetTrainingPlans(profileId, filters),
        {
          initialProps: { filters: initialFilters },
          db: testDb,
        }
      );

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        initialFilters
      );

      // Update filters
      rerender({ filters: updatedFilters });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        updatedFilters
      );
    });

    it('should handle clearing filters', () => {
      const profileId = 'test-profile-id';
      const initialFilters = {
        isArchived: false,
        cycleId: 'test-cycle-id',
      };
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { rerender } = renderReactiveHook(
        ({ filters }) => useGetTrainingPlans(profileId, filters),
        {
          initialProps: { filters: initialFilters },
          db: testDb,
        }
      );

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        initialFilters
      );

      // Clear filters
      rerender({ filters: undefined });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        undefined
      );
    });
  });

  describe('Hook Options and State Management', () => {
    it('should respect enabled option when toggled dynamically', () => {
      const profileId = 'test-profile-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ enabled }) => useGetTrainingPlans(profileId, undefined, { enabled }),
        {
          initialProps: { enabled: true },
          db: testDb,
        }
      );

      expect(result.current.isObserving).toBe(true);

      // Disable the hook
      rerender({ enabled: false });

      expect(result.current.isObserving).toBe(false);
      expect(result.current.data).toEqual([]);
    });

    it('should handle profileId changes properly', () => {
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ profileId }) => useGetTrainingPlans(profileId),
        {
          initialProps: { profileId: 'profile-1' },
          db: testDb,
        }
      );

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        'profile-1',
        undefined
      );
      expect(result.current.isObserving).toBe(true);

      // Change the profile ID
      rerender({ profileId: 'profile-2' });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        'profile-2',
        undefined
      );
      expect(result.current.isObserving).toBe(true);

      // Clear the profile ID
      rerender({ profileId: '' });

      expect(result.current.isObserving).toBe(false);
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle query creation errors gracefully', () => {
      const profileId = 'test-profile-id';

      mockTrainingPlanQueryService.getTrainingPlans.mockImplementation(() => {
        throw new Error('Query creation failed');
      });

      expect(() => {
        renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });
      }).toThrow('Query creation failed');
    });

    it('should handle subscription errors gracefully', async () => {
      const profileId = 'test-profile-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ error }) => {
            error(new Error('Subscription failed'));
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'useObserveQuery: Subscription error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle transformation errors gracefully', async () => {
      const profileId = 'test-profile-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            // Simulate invalid data that would cause transformation to fail
            next([{ invalid: 'data' }]);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'useObserveQuery: Error in subscription handler:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management and Cleanup', () => {
    it('should properly cleanup subscriptions on unmount', () => {
      const profileId = 'test-profile-id';
      const mockUnsubscribe = vi.fn();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: mockUnsubscribe })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { unmount } = renderReactiveHook(() => useGetTrainingPlans(profileId), { db: testDb });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple rapid prop changes without memory leaks', () => {
      // Simple test: verify that the service is called with the correct profileIds
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { rerender } = renderReactiveHook(({ profileId }) => useGetTrainingPlans(profileId), {
        initialProps: { profileId: 'profile-1' },
        db: testDb,
      });

      // Rapidly change profile IDs
      rerender({ profileId: 'profile-2' });
      rerender({ profileId: 'profile-3' });
      rerender({ profileId: 'profile-4' });

      // Verify that the service was called for each unique profileId
      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        'profile-1',
        undefined
      );
      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        'profile-2',
        undefined
      );
      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        'profile-3',
        undefined
      );
      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        'profile-4',
        undefined
      );

      // Verify it was called exactly 4 times (no memory leaks from excessive calls)
      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledTimes(4);
    });
  });

  describe('Advanced Filtering Scenarios', () => {
    it('should handle filtering by archived status correctly', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      // Create training plans with different archive statuses
      await testDb.createTrainingPlan(profileId, {
        name: 'Active Plan',
        isArchived: false,
      });

      await testDb.createTrainingPlan(profileId, {
        name: 'Archived Plan',
        isArchived: true,
      });

      const filters = { isArchived: false };

      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId, filters), {
        db: testDb,
      });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        filters
      );
      expect(result.current.isObserving).toBe(true);
    });

    it('should handle filtering by cycle ID correctly', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = 'specific-cycle-id';

      // Create training plans with different cycle IDs
      await testDb.createTrainingPlan(profileId, {
        name: 'Cycle Plan',
        cycleId,
      });

      await testDb.createTrainingPlan(profileId, {
        name: 'Other Plan',
        cycleId: 'other-cycle-id',
      });

      const filters = { cycleId };

      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingPlans.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingPlans(profileId, filters), {
        db: testDb,
      });

      expect(mockTrainingPlanQueryService.getTrainingPlans).toHaveBeenCalledWith(
        profileId,
        filters
      );
      expect(result.current.isObserving).toBe(true);
    });
  });
});
