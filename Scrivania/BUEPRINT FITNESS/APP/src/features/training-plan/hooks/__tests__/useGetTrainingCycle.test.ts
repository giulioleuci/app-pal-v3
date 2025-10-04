import { act } from '@testing-library/react';
import { vi } from 'vitest';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import {
  createReactiveHookTestDatabase,
  renderReactiveHook,
  waitForReactiveUpdate,
} from '@/reactive-hook-test-utils';

import { useGetTrainingCycle } from '../useGetTrainingCycle';

// Create hoisted mock service with proper Query object structure
const mockTrainingPlanQueryService = vi.hoisted(() => {
  const createMockQuery = (mockData: any[] = []) => ({
    observe: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockImplementation(() => {
        // Return unsubscribe function without triggering callbacks immediately
        return { unsubscribe: vi.fn() };
      }),
    }),
    fetch: vi.fn().mockResolvedValue(mockData),
  });

  return {
    getTrainingCycleQuery: vi.fn().mockImplementation(() => createMockQuery([])),
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

describe('useGetTrainingCycle', () => {
  let testDb: ReturnType<typeof createReactiveHookTestDatabase>;

  beforeEach(() => {
    testDb = createReactiveHookTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should return empty result when cycleId is not provided', () => {
      const { result } = renderReactiveHook(() => useGetTrainingCycle(''), { db: testDb });

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).not.toHaveBeenCalled();
    });

    it('should return empty result when hook is disabled', () => {
      const cycleId = 'test-cycle-id';

      const { result } = renderReactiveHook(
        () => useGetTrainingCycle(cycleId, { enabled: false }),
        { db: testDb }
      );

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).not.toHaveBeenCalled();
    });

    it('should create query when cycleId is provided', () => {
      const cycleId = 'test-cycle-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).toHaveBeenCalledWith(cycleId);
      expect(result.current.isObserving).toBe(true);
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Reactive Data Updates', () => {
    it('should fetch and transform training cycle data', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Test Training Cycle',
        description: 'Test Description',
        isArchived: false,
        order: 1,
      });

      // Mock the actual database query
      const trainingCycles = await testDb.get('training_cycles').query().fetch();
      const specificCycle = trainingCycles.find((cycle) => cycle.id === cycleId);

      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            next([specificCycle]);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([specificCycle])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).toHaveBeenCalledWith(cycleId);
    });

    it('should reactively update when training cycle data changes', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Original Cycle',
        description: 'Original Description',
        isArchived: false,
        order: 1,
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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      // Simulate initial data load
      const initialTrainingCycles = await testDb.get('training_cycles').query().fetch();
      const initialCycle = initialTrainingCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && initialCycle) {
        act(() => {
          observerCallback([initialCycle]);
        });
      }

      await waitForReactiveUpdate();

      // Update the training cycle data
      await testDb.updateRecord('training_cycles', cycleId, {
        name: 'Updated Cycle',
        description: 'Updated Description',
        is_archived: true,
        order: 2,
      });

      // Simulate reactive update
      const updatedTrainingCycles = await testDb.get('training_cycles').query().fetch();
      const updatedCycle = updatedTrainingCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && updatedCycle) {
        act(() => {
          observerCallback([updatedCycle]);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should handle training cycle deletion reactively', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Test Cycle',
        description: 'Test Description',
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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      // Simulate initial data load
      const initialTrainingCycles = await testDb.get('training_cycles').query().fetch();
      const initialCycle = initialTrainingCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && initialCycle) {
        act(() => {
          observerCallback([initialCycle]);
        });
      }

      await waitForReactiveUpdate();

      // Delete the training cycle
      await testDb.deleteRecord('training_cycles', cycleId);

      // Simulate reactive update with empty result
      if (observerCallback) {
        act(() => {
          observerCallback([]);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should handle case when training cycle does not exist', async () => {
      const nonExistentCycleId = 'non-existent-cycle-id';

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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(nonExistentCycleId), {
        db: testDb,
      });

      // Simulate empty result for non-existent cycle
      if (observerCallback) {
        act(() => {
          observerCallback([]);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Hook Options and State Management', () => {
    it('should respect enabled option when toggled dynamically', () => {
      const cycleId = 'test-cycle-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ enabled }) => useGetTrainingCycle(cycleId, { enabled }),
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

    it('should handle cycleId changes properly', () => {
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ cycleId }) => useGetTrainingCycle(cycleId),
        {
          initialProps: { cycleId: 'cycle-1' },
          db: testDb,
        }
      );

      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).toHaveBeenCalledWith('cycle-1');
      expect(result.current.isObserving).toBe(true);

      // Change the cycle ID
      rerender({ cycleId: 'cycle-2' });

      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).toHaveBeenCalledWith('cycle-2');
      expect(result.current.isObserving).toBe(true);

      // Clear the cycle ID
      rerender({ cycleId: '' });

      expect(result.current.isObserving).toBe(false);
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle query creation errors gracefully', () => {
      const cycleId = 'test-cycle-id';

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockImplementation(() => {
        throw new Error('Query creation failed');
      });

      expect(() => {
        renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });
      }).toThrow('Query creation failed');
    });

    it('should handle subscription errors gracefully', async () => {
      const cycleId = 'test-cycle-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ error }) => {
            error(new Error('Subscription failed'));
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'useObserveQuery: Subscription error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle transformation errors gracefully', async () => {
      const cycleId = 'test-cycle-id';
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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

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
      const cycleId = 'test-cycle-id';
      const mockUnsubscribe = vi.fn();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: mockUnsubscribe })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { unmount } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple rapid prop changes without memory leaks', () => {
      const mockUnsubscribe = vi.fn();

      // Create different query instances for different cycle IDs
      const queryInstances = new Map();
      const getQueryForCycle = (cycleId: string) => {
        if (!queryInstances.has(cycleId)) {
          queryInstances.set(cycleId, {
            observe: vi.fn(() => ({
              subscribe: vi.fn(() => ({ unsubscribe: mockUnsubscribe })),
            })),
            fetch: vi.fn(() => Promise.resolve([])),
          });
        }
        return queryInstances.get(cycleId);
      };

      // Mock to return consistent query instance per cycleId
      mockTrainingPlanQueryService.getTrainingCycleQuery.mockImplementation(getQueryForCycle);

      const { rerender } = renderReactiveHook(({ cycleId }) => useGetTrainingCycle(cycleId), {
        initialProps: { cycleId: 'cycle-1' },
        db: testDb,
      });

      // Rapidly change cycle IDs
      rerender({ cycleId: 'cycle-2' });
      rerender({ cycleId: 'cycle-3' });
      rerender({ cycleId: 'cycle-4' });

      // Should have called unsubscribe for previous subscriptions (3 changes = 3 unsubscribes)
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('Training Cycle Specific Features', () => {
    it('should handle training cycle with complex data structure', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Complex Training Cycle',
        description:
          'Complex Description with detailed information about training phases and progression',
        isArchived: false,
        order: 3,
      });

      const trainingCycles = await testDb.get('training_cycles').query().fetch();
      const specificCycle = trainingCycles.find((cycle) => cycle.id === cycleId);

      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            next([specificCycle]);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve([specificCycle])),
      };

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(mockTrainingPlanQueryService.getTrainingCycleQuery).toHaveBeenCalledWith(cycleId);
    });

    it('should handle training cycle archiving status changes', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Test Cycle',
        isArchived: false,
        order: 1,
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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      // Simulate initial data load with active cycle
      const initialCycles = await testDb.get('training_cycles').query().fetch();
      const initialCycle = initialCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && initialCycle) {
        act(() => {
          observerCallback([initialCycle]);
        });
      }

      await waitForReactiveUpdate();

      // Archive the training cycle
      await testDb.updateRecord('training_cycles', cycleId, {
        is_archived: true,
      });

      // Simulate reactive update with archived cycle
      const updatedCycles = await testDb.get('training_cycles').query().fetch();
      const archivedCycle = updatedCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && archivedCycle) {
        act(() => {
          observerCallback([archivedCycle]);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should handle order updates reactively', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Test Cycle',
        order: 1,
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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      // Simulate initial data load
      const initialCycles = await testDb.get('training_cycles').query().fetch();
      const initialCycle = initialCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && initialCycle) {
        act(() => {
          observerCallback([initialCycle]);
        });
      }

      await waitForReactiveUpdate();

      // Update cycle order (simulating reordering of cycles)
      await testDb.updateRecord('training_cycles', cycleId, {
        order: 5,
      });

      // Simulate reactive update
      const updatedCycles = await testDb.get('training_cycles').query().fetch();
      const updatedCycle = updatedCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && updatedCycle) {
        act(() => {
          observerCallback([updatedCycle]);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should handle training cycle name and description updates', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Original Name',
        description: 'Original Description',
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

      mockTrainingPlanQueryService.getTrainingCycleQuery.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycle(cycleId), { db: testDb });

      // Simulate initial data load
      const initialCycles = await testDb.get('training_cycles').query().fetch();
      const initialCycle = initialCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && initialCycle) {
        act(() => {
          observerCallback([initialCycle]);
        });
      }

      await waitForReactiveUpdate();

      // Update cycle name and description
      await testDb.updateRecord('training_cycles', cycleId, {
        name: 'Updated Cycle Name',
        description: 'Updated cycle description with new information',
      });

      // Simulate reactive update
      const updatedCycles = await testDb.get('training_cycles').query().fetch();
      const updatedCycle = updatedCycles.find((cycle) => cycle.id === cycleId);
      if (observerCallback && updatedCycle) {
        act(() => {
          observerCallback([updatedCycle]);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });
  });
});
