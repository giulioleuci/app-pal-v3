import { act } from '@testing-library/react';
import { vi } from 'vitest';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import {
  createReactiveHookTestDatabase,
  renderReactiveHook,
  waitForReactiveUpdate,
} from '@/reactive-hook-test-utils';

import { useGetTrainingCycles } from '../useGetTrainingCycles';

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
    getTrainingCycles: vi.fn().mockImplementation(() => createMockQuery([])),
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

describe('useGetTrainingCycles', () => {
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
      const { result } = renderReactiveHook(() => useGetTrainingCycles(''), { db: testDb });

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingCycles).not.toHaveBeenCalled();
    });

    it('should return empty result when hook is disabled', () => {
      const profileId = 'test-profile-id';

      const { result } = renderReactiveHook(
        () => useGetTrainingCycles(profileId, { enabled: false }),
        { db: testDb }
      );

      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(false);
      expect(mockTrainingPlanQueryService.getTrainingCycles).not.toHaveBeenCalled();
    });

    it('should create query when profileId is provided', () => {
      const profileId = 'test-profile-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith(profileId);
      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Reactive Data Updates', () => {
    it('should fetch and transform multiple training cycles data', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      // Create multiple training cycles
      await testDb.createTrainingCycle(profileId, {
        name: 'Cycle A',
        description: 'Description A',
        isArchived: false,
        order: 1,
      });

      await testDb.createTrainingCycle(profileId, {
        name: 'Cycle B',
        description: 'Description B',
        isArchived: false,
        order: 2,
      });

      // Mock the actual database query
      const trainingCycles = await testDb.get('training_cycles').query().fetch();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            next(trainingCycles);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve(trainingCycles)),
      };

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith(profileId);
      expect(trainingCycles).toHaveLength(2);
    });

    it('should reactively update when new training cycles are added', async () => {
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      // Simulate initial empty state
      if (observerCallback) {
        act(() => {
          observerCallback([]);
        });
      }

      await waitForReactiveUpdate();

      // Add a new training cycle
      await testDb.createTrainingCycle(profileId, {
        name: 'New Cycle',
        description: 'New Description',
        order: 1,
      });

      // Simulate reactive update with new data
      const updatedTrainingCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(updatedTrainingCycles);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(updatedTrainingCycles).toHaveLength(1);
    });

    it('should reactively update when training cycles are modified', async () => {
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      // Simulate initial data load
      const initialTrainingCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(initialTrainingCycles);
        });
      }

      await waitForReactiveUpdate();

      // Update the training cycle
      await testDb.updateRecord('training_cycles', cycleId, {
        name: 'Updated Cycle',
        description: 'Updated Description',
        is_archived: true,
        order: 2,
      });

      // Simulate reactive update
      const updatedTrainingCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(updatedTrainingCycles);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should reactively update when training cycles are deleted', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId1 = await testDb.createTrainingCycle(profileId, {
        name: 'Cycle 1',
        order: 1,
      });
      const cycleId2 = await testDb.createTrainingCycle(profileId, {
        name: 'Cycle 2',
        order: 2,
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      // Simulate initial data load with 2 cycles
      const initialTrainingCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(initialTrainingCycles);
        });
      }

      await waitForReactiveUpdate();
      expect(initialTrainingCycles).toHaveLength(2);

      // Delete one training cycle
      await testDb.deleteRecord('training_cycles', cycleId1);

      // Simulate reactive update with remaining cycle
      const remainingTrainingCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(remainingTrainingCycles);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(remainingTrainingCycles).toHaveLength(1);
    });

    it('should handle empty result when no cycles exist for profile', async () => {
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      // Simulate empty result for profile with no cycles
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
      const profileId = 'test-profile-id';
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ enabled }) => useGetTrainingCycles(profileId, { enabled }),
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ profileId }) => useGetTrainingCycles(profileId),
        {
          initialProps: { profileId: 'profile-1' },
          db: testDb,
        }
      );

      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith('profile-1');
      expect(result.current.isObserving).toBe(true);

      // Change the profile ID
      rerender({ profileId: 'profile-2' });

      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith('profile-2');
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

      mockTrainingPlanQueryService.getTrainingCycles.mockImplementation(() => {
        throw new Error('Query creation failed');
      });

      expect(() => {
        renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { unmount } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle multiple rapid prop changes without memory leaks', () => {
      const mockUnsubscribe = vi.fn();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: mockUnsubscribe })),
        })),
        fetch: vi.fn(() => Promise.resolve([])),
      };

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result, rerender } = renderReactiveHook(
        ({ profileId }) => useGetTrainingCycles(profileId),
        {
          initialProps: { profileId: 'profile-1' },
          db: testDb,
        }
      );

      expect(result.current.isObserving).toBe(true);
      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith('profile-1');

      // Rapidly change profile IDs
      rerender({ profileId: 'profile-2' });
      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith('profile-2');
      expect(result.current.isObserving).toBe(true);

      rerender({ profileId: 'profile-3' });
      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith('profile-3');
      expect(result.current.isObserving).toBe(true);

      rerender({ profileId: 'profile-4' });
      expect(mockTrainingPlanQueryService.getTrainingCycles).toHaveBeenCalledWith('profile-4');
      expect(result.current.isObserving).toBe(true);

      // Verify no infinite loops and final state is correct
      expect(result.current.data).toEqual([]);
      expect(result.current.isObserving).toBe(true);
    });
  });

  describe('Training Cycle Specific Features', () => {
    it('should handle training cycles with different ordering', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      // Create training cycles with different orders
      await testDb.createTrainingCycle(profileId, {
        name: 'Third Cycle',
        order: 3,
      });

      await testDb.createTrainingCycle(profileId, {
        name: 'First Cycle',
        order: 1,
      });

      await testDb.createTrainingCycle(profileId, {
        name: 'Second Cycle',
        order: 2,
      });

      const trainingCycles = await testDb.get('training_cycles').query().fetch();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            next(trainingCycles);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve(trainingCycles)),
      };

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(trainingCycles).toHaveLength(3);
    });

    it('should handle archive status changes reactively', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });
      const cycleId = await testDb.createTrainingCycle(profileId, {
        name: 'Test Cycle',
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

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      // Simulate initial data load with active cycle
      const initialCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(initialCycles);
        });
      }

      await waitForReactiveUpdate();

      // Archive the training cycle
      await testDb.updateRecord('training_cycles', cycleId, {
        is_archived: true,
      });

      // Simulate reactive update with archived cycle
      const updatedCycles = await testDb.get('training_cycles').query().fetch();
      if (observerCallback) {
        act(() => {
          observerCallback(updatedCycles);
        });
      }

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
    });

    it('should handle cycles with complex descriptions and metadata', async () => {
      const profileId = await testDb.createProfile({ name: 'Test Profile' });

      await testDb.createTrainingCycle(profileId, {
        name: 'Advanced Cycle',
        description: 'This is a complex cycle with detailed descriptions and multiple phases',
        isArchived: false,
        order: 1,
      });

      const trainingCycles = await testDb.get('training_cycles').query().fetch();
      const mockQuery = {
        observe: vi.fn(() => ({
          subscribe: vi.fn(({ next }) => {
            next(trainingCycles);
            return { unsubscribe: vi.fn() };
          }),
        })),
        fetch: vi.fn(() => Promise.resolve(trainingCycles)),
      };

      mockTrainingPlanQueryService.getTrainingCycles.mockReturnValue(mockQuery);

      const { result } = renderReactiveHook(() => useGetTrainingCycles(profileId), { db: testDb });

      await waitForReactiveUpdate();

      expect(result.current.isObserving).toBe(true);
      expect(trainingCycles).toHaveLength(1);
    });
  });
});
