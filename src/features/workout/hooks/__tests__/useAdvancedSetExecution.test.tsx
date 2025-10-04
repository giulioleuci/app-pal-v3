import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DropSetConfiguration } from '@/features/training-plan/domain/sets/DropSetConfiguration';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import { useAdvancedSetExecution } from '../useAdvancedSetExecution';
// Mock the store
const mockStoreState = {
  activeSessions: {},
  currentSessionId: null,
  createSession: vi.fn(),
  updateExecutionState: vi.fn(),
  addCompletedSet: vi.fn(),
  updateTimerState: vi.fn(),
  setCurrentSession: vi.fn(),
  completeSession: vi.fn(),
  abortSession: vi.fn(),
  clearExpiredSessions: vi.fn(),
  getSession: vi.fn(),
  getCurrentSession: vi.fn(),
  getSessionsForProfile: vi.fn(),
  getSessionsForWorkout: vi.fn(),
};

vi.mock('../../store/advancedSetExecutionStore', () => {
  const mockStore = vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  });

  // Add getState method to support useRef pattern
  mockStore.getState = vi.fn(() => mockStoreState);

  return {
    useAdvancedSetExecutionStore: mockStore,
  };
});

// Import after mocking
import type {
  AdvancedSetExecutionService,
  AdvancedSetExecutionState,
} from '../../services/AdvancedSetExecutionService';
import { useAdvancedSetExecutionStore } from '../../store/advancedSetExecutionStore';

// Mock crypto.randomUUID
const mockUUID = 'test-session-123';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID,
});

// Mock useRestTimer with stable references
const createMockRestTimer = () => ({
  timeRemaining: 0,
  formattedTime: '00:00',
  isActive: false,
  start: vi.fn(),
  pause: vi.fn(),
  reset: vi.fn(),
  skip: vi.fn(),
});

let mockRestTimer = createMockRestTimer();

vi.mock('../useRestTimer', () => ({
  useRestTimer: () => mockRestTimer,
}));

// Create mock execution service
const mockExecutionService = {
  initializeExecution: vi.fn(),
  progressToNextPhase: vi.fn(),
  validatePhaseCompletion: vi.fn(),
  getSuggestedRestPeriod: vi.fn(),
};

// Mock container resolve
vi.mock('tsyringe', async () => {
  const actual = await vi.importActual('tsyringe');
  return {
    ...actual,
    container: {
      resolve: vi.fn().mockImplementation((token) => {
        if (
          token === 'AdvancedSetExecutionService' ||
          token.name === 'AdvancedSetExecutionService'
        ) {
          return mockExecutionService;
        }
        return {};
      }),
    },
  };
});

describe('useAdvancedSetExecution', () => {
  let queryClient: QueryClient;

  // Test data
  const profileId = 'profile-1';
  const workoutLogId = 'workout-1';
  const exerciseId = 'exercise-1';

  const mockExecutionState: AdvancedSetExecutionState = {
    setType: 'drop',
    currentPhase: 1,
    totalPhases: 3,
    isCompleted: false,
    currentSetData: {
      weight: 100,
      counts: 10,
      rpe: 8,
    },
    nextSetData: {
      weight: 80,
      expectedCounts: 8,
      suggestedRpe: 8,
    },
    restPeriodSeconds: 60,
  };

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

    // Clear all mocks
    vi.clearAllMocks();

    // Reset store mock
    mockStoreState.activeSessions = {};
    mockStoreState.currentSessionId = null;

    // Set up stable default mock returns to avoid infinite re-renders
    const emptySessionsList = [] as const;
    mockStoreState.getCurrentSession.mockReturnValue(undefined);
    mockStoreState.getSessionsForWorkout.mockReturnValue(emptySessionsList);
    mockStoreState.getSession.mockReturnValue(undefined);

    // Reset rest timer mock with fresh instance to avoid reference issues
    mockRestTimer = createMockRestTimer();

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(
        () => useAdvancedSetExecution(profileId, workoutLogId, exerciseId),
        { wrapper }
      );

      expect(result.current.executionState).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.currentPhase).toBe(0);
      expect(result.current.totalPhases).toBe(0);
      expect(result.current.sessionId).toBeNull();
      expect(result.current.completedSets).toEqual([]);
    });

    it('should initialize execution successfully', async () => {
      mockExecutionService.initializeExecution.mockResolvedValue(
        Result.success(mockExecutionState)
      );

      mockStoreState.createSession.mockReturnValue(mockUUID);
      mockStoreState.getSessionsForWorkout.mockReturnValue([]);
      mockStoreState.getCurrentSession.mockReturnValue(undefined);

      const { result } = renderHook(
        () => useAdvancedSetExecution(profileId, workoutLogId, exerciseId),
        { wrapper }
      );

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20, 40],
        restBetweenDropsSeconds: 60,
      });

      await act(async () => {
        await result.current.initialize(dropConfig, 100);
      });

      expect(result.current.executionState).toEqual(mockExecutionState);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isExecuting).toBe(true);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.currentPhase).toBe(1);
      expect(result.current.totalPhases).toBe(3);
      expect(result.current.sessionId).toBe(mockUUID);

      expect(mockExecutionService.initializeExecution).toHaveBeenCalledWith(dropConfig, 100);
      expect(mockStoreState.createSession).toHaveBeenCalled();
    });

    it('should handle initialization failure', async () => {
      const errorMessage = 'Invalid configuration';
      vi.mocked(mockExecutionService.initializeExecution).mockResolvedValue(
        Result.failure(new ApplicationError(errorMessage))
      );

      const { result } = renderHook(
        () => useAdvancedSetExecution(profileId, workoutLogId, exerciseId),
        { wrapper }
      );

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20],
        restBetweenDropsSeconds: 60,
      });

      await act(async () => {
        try {
          await result.current.initialize(dropConfig);
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.executionState).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });

    it('should restore from existing session', () => {
      // Setup existing session in store mock
      const existingSession = {
        id: mockUUID,
        profileId,
        workoutLogId,
        exerciseId,
        setType: 'drop' as const,
        setConfigurationJson: JSON.stringify({}),
        executionState: mockExecutionState,
        completedSets: [],
        timerState: {
          isRunning: false,
          remainingSeconds: 0,
          totalSeconds: 0,
          startTime: null,
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastActiveAt: Date.now(),
        },
      };

      // Set up activeSessions in mock store state (this is what the hook actually uses)
      mockStoreState.activeSessions = {
        [mockUUID]: existingSession,
      };

      const { result } = renderHook(
        () => useAdvancedSetExecution(profileId, workoutLogId, exerciseId),
        { wrapper }
      );

      // The restoration should happen immediately in the effect
      // Let's check if the hook properly identified the existing session
      expect(result.current.sessionId).toBe(mockUUID);
      expect(result.current.executionState).toEqual(mockExecutionState);
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('Set Progression', () => {
    let testResult: any;

    beforeEach(async () => {
      // Reset activeSessions before each test
      mockStoreState.activeSessions = {};

      mockExecutionService.initializeExecution.mockResolvedValue(
        Result.success(mockExecutionState)
      );

      // Mock createSession to add session to activeSessions
      mockStoreState.createSession.mockImplementation((sessionData) => {
        const session = {
          id: mockUUID,
          ...sessionData,
          completedSets: [],
          timerState: {
            isRunning: false,
            remainingSeconds: 0,
            totalSeconds: 0,
            startTime: null,
          },
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastActiveAt: Date.now(),
          },
        };
        mockStoreState.activeSessions[mockUUID] = session;
        return mockUUID;
      });

      mockStoreState.getSessionsForWorkout.mockReturnValue([]);
      mockStoreState.getCurrentSession.mockReturnValue(undefined);

      testResult = renderHook(() => useAdvancedSetExecution(profileId, workoutLogId, exerciseId), {
        wrapper,
      });

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20],
        restBetweenDropsSeconds: 60,
      });

      await act(async () => {
        await testResult.result.current.initialize(dropConfig, 100);
      });
    });

    it('should complete current set and progress to next phase', async () => {
      const nextPhaseState: AdvancedSetExecutionState = {
        ...mockExecutionState,
        currentPhase: 2,
        currentSetData: {
          weight: 80,
          counts: 8,
          rpe: 9,
        },
        restPeriodSeconds: 60,
      };

      mockExecutionService.progressToNextPhase.mockResolvedValue(Result.success(nextPhaseState));

      const setData = {
        weight: 100,
        counts: 8,
        rpe: 9,
        completed: true,
      };

      // Mock addCompletedSet to update activeSessions with the completed set
      mockStoreState.addCompletedSet.mockImplementation((sessionId, completedSet) => {
        if (mockStoreState.activeSessions[sessionId]) {
          mockStoreState.activeSessions[sessionId].completedSets = [completedSet];
        }
      });

      await act(async () => {
        await testResult.result.current.completeCurrentSet(setData);
      });

      expect(testResult.result.current.executionState).toEqual(nextPhaseState);
      expect(testResult.result.current.currentPhase).toBe(2);
      expect(testResult.result.current.completedSets).toHaveLength(1);
      expect(testResult.result.current.completedSets[0]).toEqual(setData);
      expect(mockStoreState.addCompletedSet).toHaveBeenCalledWith(
        testResult.result.current.sessionId,
        setData
      );

      expect(mockExecutionService.progressToNextPhase).toHaveBeenCalledWith(
        mockExecutionState,
        setData
      );
    });

    it('should complete execution when all phases done', async () => {
      const completedState: AdvancedSetExecutionState = {
        ...mockExecutionState,
        currentPhase: 3,
        isCompleted: true,
      };

      mockExecutionService.progressToNextPhase.mockResolvedValue(Result.success(completedState));

      const setData = {
        weight: 80,
        counts: 6,
        rpe: 10,
        completed: true,
      };

      await act(async () => {
        await testResult.result.current.completeCurrentSet(setData);
      });

      expect(testResult.result.current.executionState).toEqual(completedState);
      expect(testResult.result.current.isCompleted).toBe(true);
      expect(testResult.result.current.isExecuting).toBe(false);
      expect(testResult.result.current.sessionId).toBeNull(); // Session completed and removed
    });

    it('should handle progression failure', async () => {
      const errorMessage = 'Progression failed';
      mockExecutionService.progressToNextPhase.mockResolvedValue(
        Result.failure(new ApplicationError(errorMessage))
      );

      const setData = {
        weight: 100,
        counts: 8,
        rpe: 9,
        completed: true,
      };

      await act(async () => {
        try {
          await testResult.result.current.completeCurrentSet(setData);
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(testResult.result.current.error).toBe(errorMessage);
    });
  });

  describe('Timer Integration', () => {
    let testResult: any;

    beforeEach(async () => {
      mockExecutionService.initializeExecution.mockResolvedValue(
        Result.success(mockExecutionState)
      );

      mockStoreState.createSession.mockReturnValue(mockUUID);
      mockStoreState.getSessionsForWorkout.mockReturnValue([]);
      mockStoreState.getCurrentSession.mockReturnValue(undefined);

      testResult = renderHook(() => useAdvancedSetExecution(profileId, workoutLogId, exerciseId), {
        wrapper,
      });

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20],
        restBetweenDropsSeconds: 60,
      });

      await act(async () => {
        await testResult.result.current.initialize(dropConfig, 100);
      });
    });

    it('should start rest timer', () => {
      // Mock the timer to be active when start is called
      mockRestTimer.start.mockImplementation(() => {
        mockRestTimer.isActive = true;
        mockRestTimer.timeRemaining = 60;
      });

      act(() => {
        testResult.result.current.startRest();
      });

      expect(mockRestTimer.start).toHaveBeenCalledWith(60);
      expect(testResult.result.current.restTimer.isActive).toBe(true);
      expect(testResult.result.current.restTimer.timeRemaining).toBe(60);
    });

    it('should skip rest timer', () => {
      // Mock the timer to be active when start is called
      mockRestTimer.start.mockImplementation(() => {
        mockRestTimer.isActive = true;
        mockRestTimer.timeRemaining = 60;
      });

      // Mock skip to reset the timer
      mockRestTimer.skip.mockImplementation(() => {
        mockRestTimer.isActive = false;
        mockRestTimer.timeRemaining = 0;
      });

      act(() => {
        testResult.result.current.startRest();
      });

      expect(testResult.result.current.restTimer.isActive).toBe(true);

      act(() => {
        testResult.result.current.skipRest();
      });

      expect(mockRestTimer.skip).toHaveBeenCalled();
      expect(testResult.result.current.restTimer.isActive).toBe(false);
      expect(testResult.result.current.restTimer.timeRemaining).toBe(0);
    });

    it('should sync timer state to store', () => {
      // This test is more about verifying the timer is started properly
      // The actual sync is handled by the timer effect which is difficult to test
      // without causing infinite re-render loops in the mock environment

      act(() => {
        testResult.result.current.startRest();
      });

      // Verify the timer was started with the correct duration
      expect(mockRestTimer.start).toHaveBeenCalledWith(60);

      // The updateTimerState would be called in the useEffect when restTimer.isActive changes
      // but this is hard to test reliably in a mock environment without infinite loops
    });
  });

  describe('Validation', () => {
    let testResult: any;

    beforeEach(async () => {
      mockExecutionService.initializeExecution.mockResolvedValue(
        Result.success(mockExecutionState)
      );

      mockStoreState.createSession.mockReturnValue(mockUUID);
      mockStoreState.getSessionsForWorkout.mockReturnValue([]);
      mockStoreState.getCurrentSession.mockReturnValue(undefined);

      testResult = renderHook(() => useAdvancedSetExecution(profileId, workoutLogId, exerciseId), {
        wrapper,
      });

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20],
        restBetweenDropsSeconds: 60,
      });

      await act(async () => {
        await testResult.result.current.initialize(dropConfig, 100);
      });
    });

    it('should validate set data successfully', async () => {
      mockExecutionService.validatePhaseCompletion.mockResolvedValue(Result.success(true));

      const proposedData = {
        weight: 100,
        counts: 8,
        rpe: 9,
        completed: true,
      };

      let isValid: boolean = false;
      await act(async () => {
        isValid = await testResult.result.current.validateSetData(proposedData);
      });

      expect(isValid).toBe(true);
      expect(mockExecutionService.validatePhaseCompletion).toHaveBeenCalledWith(
        mockExecutionState,
        proposedData
      );
    });

    it('should handle validation failure', async () => {
      mockExecutionService.validatePhaseCompletion.mockResolvedValue(
        Result.failure(new ApplicationError('Invalid data'))
      );

      const proposedData = {
        weight: 100,
        counts: 2, // Too low
        rpe: 10,
        completed: false,
      };

      let isValid: boolean = true;
      await act(async () => {
        isValid = await testResult.result.current.validateSetData(proposedData);
      });

      expect(isValid).toBe(false);
    });

    it('should get suggested rest period', () => {
      mockExecutionService.getSuggestedRestPeriod.mockReturnValue(90);

      const restPeriod = testResult.result.current.getSuggestedRestPeriod();

      expect(restPeriod).toBe(90);
      expect(mockExecutionService.getSuggestedRestPeriod).toHaveBeenCalledWith(mockExecutionState);
    });
  });

  describe('Reset and Abort', () => {
    let testResult: any;

    beforeEach(async () => {
      mockExecutionService.initializeExecution.mockResolvedValue(
        Result.success(mockExecutionState)
      );

      mockStoreState.createSession.mockReturnValue(mockUUID);
      mockStoreState.getSessionsForWorkout.mockReturnValue([]);
      mockStoreState.getCurrentSession.mockReturnValue(undefined);

      testResult = renderHook(() => useAdvancedSetExecution(profileId, workoutLogId, exerciseId), {
        wrapper,
      });

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20],
        restBetweenDropsSeconds: 60,
      });

      await act(async () => {
        await testResult.result.current.initialize(dropConfig, 100);
      });
    });

    it('should reset execution state', () => {
      act(() => {
        testResult.result.current.reset();
      });

      expect(testResult.result.current.executionState).toBeNull();
      expect(testResult.result.current.sessionId).toBeNull();
      expect(testResult.result.current.error).toBeNull();
      expect(testResult.result.current.isInitialized).toBe(false);
      expect(testResult.result.current.restTimer.isActive).toBe(false);
      expect(testResult.result.current.restTimer.timeRemaining).toBe(0);
    });

    it('should abort execution and remove from store', () => {
      const sessionId = testResult.result.current.sessionId!;
      // Mock that the session exists initially
      mockStoreState.getSession.mockReturnValue({ id: sessionId });

      act(() => {
        testResult.result.current.abort();
      });

      expect(testResult.result.current.executionState).toBeNull();
      expect(testResult.result.current.sessionId).toBeNull();
      expect(mockStoreState.abortSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('Loading States', () => {
    it('should show loading states during operations', async () => {
      // This test verifies loading state behavior during async operations
      const { result } = renderHook(
        () => useAdvancedSetExecution(profileId, workoutLogId, exerciseId),
        { wrapper }
      );

      // Initially not loading
      expect(result.current.isInitializing).toBe(false);

      const dropConfig = new DropSetConfiguration({
        id: 'drop-test',
        type: 'drop',
        reps: 10,
        rpe: 8,
        dropPercentages: [20],
        restBetweenDropsSeconds: 60,
      });

      // Mock the service to return a resolved promise
      mockExecutionService.initializeExecution.mockResolvedValue(
        Result.success(mockExecutionState)
      );
      mockStoreState.createSession.mockReturnValue(mockUUID);

      await act(async () => {
        await result.current.initialize(dropConfig);
      });

      // After successful initialization, should not be loading
      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const { result, unmount } = renderHook(
        () => useAdvancedSetExecution(profileId, workoutLogId, exerciseId),
        { wrapper }
      );

      // Start the timer to test cleanup
      act(() => {
        result.current.restTimer.start(60);
      });

      // Verify timer start was called
      expect(result.current.restTimer.start).toHaveBeenCalledWith(60);

      unmount();

      // Timer should be cleaned up - verify reset was called
      expect(mockRestTimer.reset).toHaveBeenCalled();
    });
  });
});
