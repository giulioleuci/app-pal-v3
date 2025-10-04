import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { MyoRepsSetConfiguration } from '@/features/training-plan/domain/sets/MyoRepsSetConfiguration';

import { useAdvancedSetExecutionStore } from '../../store/advancedSetExecutionStore';
import { useDropSetExecution } from '../useDropSetExecution';
import { useMyoRepsExecution } from '../useMyoRepsExecution';

// Mock the base hook to avoid complex service dependencies
vi.mock('../useAdvancedSetExecution', () => ({
  useAdvancedSetExecution: vi.fn(() => ({
    executionState: null,
    isInitialized: false,
    isExecuting: false,
    isCompleted: false,
    currentPhase: 1,
    totalPhases: 3,
    currentSetData: { weight: 100, counts: 10, rpe: 8 },
    nextSetData: { weight: 80, expectedCounts: 8, suggestedRpe: 8 },
    initialize: vi.fn(),
    completeCurrentSet: vi.fn(),
    reset: vi.fn(),
    abort: vi.fn(),
    restTimer: {
      timeRemaining: 0,
      formattedTime: '00:00',
      isActive: false,
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
      skip: vi.fn(),
    },
    startRest: vi.fn(),
    skipRest: vi.fn(),
    completedSets: [],
    sessionId: 'session-123',
    isInitializing: false,
    isProgressing: false,
    isValidating: false,
    error: null,
    validateSetData: vi.fn(),
    getSuggestedRestPeriod: vi.fn(),
  })),
}));

describe('Advanced Set Execution Hooks - Basic Verification', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset store
    useAdvancedSetExecutionStore.setState(
      {
        activeSessions: {},
        currentSessionId: null,
      },
      true
    );
  });

  describe('useDropSetExecution', () => {
    it('should render without errors', () => {
      const dropConfig = new DropSetConfiguration({
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 10, direction: 'asc' },
        drops: { min: 2, direction: 'asc' },
        rpe: { min: 8, direction: 'asc' },
      });

      const { result } = renderHook(
        () => useDropSetExecution('profile-1', 'workout-1', 'exercise-1', dropConfig),
        { wrapper }
      );

      expect(result.current.dropSetConfig).toBe(dropConfig);
      expect(result.current.totalDrops).toBe(2);
      expect(typeof result.current.getDropWeights).toBe('function');
    });

    it('should handle missing configuration', () => {
      const { result } = renderHook(
        () => useDropSetExecution('profile-1', 'workout-1', 'exercise-1', undefined),
        { wrapper }
      );

      expect(result.current.dropSetConfig).toBeNull();
      expect(result.current.totalDrops).toBe(0);
    });
  });

  describe('useMyoRepsExecution', () => {
    it('should render without errors', () => {
      const myoRepsConfig = new MyoRepsSetConfiguration({
        type: 'myoReps',
        sets: { min: 1, direction: 'asc' },
        activationCounts: { min: 15, direction: 'asc' },
        miniSets: { min: 3, direction: 'asc' },
        miniSetCounts: { min: 5, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      });

      const { result } = renderHook(
        () => useMyoRepsExecution('profile-1', 'workout-1', 'exercise-1', myoRepsConfig),
        { wrapper }
      );

      expect(result.current.myoRepsConfig).toBe(myoRepsConfig);
      expect(result.current.activationReps).toBe(15);
      expect(result.current.totalMiniSets).toBe(3);
      expect(typeof result.current.shouldContinueMiniSets).toBe('function');
    });

    it('should handle missing configuration', () => {
      const { result } = renderHook(
        () => useMyoRepsExecution('profile-1', 'workout-1', 'exercise-1', undefined),
        { wrapper }
      );

      expect(result.current.myoRepsConfig).toBeNull();
      expect(result.current.activationReps).toBeNull();
      expect(result.current.totalMiniSets).toBe(0);
    });
  });

  describe('Hook Integration', () => {
    it('should pass through all base hook properties', () => {
      const dropConfig = new DropSetConfiguration({
        type: 'drop',
        sets: { min: 1, direction: 'asc' },
        startCounts: { min: 8, direction: 'asc' },
        drops: { min: 1, direction: 'asc' },
        rpe: { min: 9, direction: 'asc' },
      });

      const { result } = renderHook(
        () => useDropSetExecution('profile-1', 'workout-1', 'exercise-1', dropConfig),
        { wrapper }
      );

      // Should have base hook properties
      expect(result.current.initialize).toBeDefined();
      expect(result.current.completeCurrentSet).toBeDefined();
      expect(result.current.reset).toBeDefined();
      expect(result.current.abort).toBeDefined();
      expect(result.current.restTimer).toBeDefined();
      expect(result.current.sessionId).toBe('session-123');

      // Should have drop set specific properties
      expect(result.current.dropSetConfig).toBe(dropConfig);
      expect(result.current.isMainSet).toBeDefined();
      expect(result.current.isDropPhase).toBeDefined();
      expect(result.current.getDropWeights).toBeDefined();
    });
  });
});
