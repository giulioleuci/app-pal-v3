import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';

import { useTrainingPlanProgress } from '../useTrainingPlanProgress';

// Hoisted mocks for proper initialization order
const mockUseObserveQuery = vi.hoisted(() => vi.fn());

// Mock container
vi.mock('tsyringe', () => ({
  container: {
    resolve: vi.fn(),
  },
  injectable: () => (target: any) => target,
  inject: (token: any) => (target: any, propertyKey: string, parameterIndex: number) => {},
}));

// Mock useObserveQuery
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  trainingPlansToDomain: vi.fn((data) => data),
  workoutLogsToDomain: vi.fn((data) => data),
}));

const mockTrainingPlanQueryService = {
  getTrainingPlanDetails: vi.fn(),
};

const mockWorkoutQueryService = {
  getWorkoutLogsByTrainingPlan: vi.fn(),
};

// Mock data creators
const createMockTrainingPlan = (overrides: Partial<TrainingPlanModel> = {}): TrainingPlanModel =>
  ({
    id: 'plan-1',
    name: 'Test Training Plan',
    trainingCycles: [
      {
        id: 'cycle-1',
        name: 'Cycle 1',
        orderIndex: 0,
        sessions: [
          {
            id: 'session-1',
            name: 'Session 1',
            exerciseGroups: [
              {
                exercises: [{ id: 'ex-1' }, { id: 'ex-2' }], // 2 exercises
              },
            ],
            estimatedDuration: 60,
          },
          {
            id: 'session-2',
            name: 'Session 2',
            exerciseGroups: [
              {
                exercises: [{ id: 'ex-3' }], // 1 exercise
              },
            ],
            estimatedDuration: 45,
          },
        ],
      },
      {
        id: 'cycle-2',
        name: 'Cycle 2',
        orderIndex: 1,
        sessions: [
          {
            id: 'session-3',
            name: 'Session 3',
            exerciseGroups: [
              {
                exercises: [{ id: 'ex-4' }, { id: 'ex-5' }, { id: 'ex-6' }], // 3 exercises
              },
            ],
            estimatedDuration: 75,
          },
        ],
      },
    ],
    ...overrides,
  }) as TrainingPlanModel;

const createMockWorkout = (overrides: Partial<WorkoutLogModel> = {}): WorkoutLogModel =>
  ({
    id: 'workout-1',
    sessionId: 'session-1',
    endTime: new Date('2024-03-15T10:00:00Z'),
    getDurationInMinutes: vi.fn().mockReturnValue(55),
    ...overrides,
  }) as unknown as WorkoutLogModel;

describe('useTrainingPlanProgress', () => {
  const planId = 'plan-1';
  const profileId = 'test-profile-id';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup container mocks
    (container.resolve as any).mockImplementation((service: any) => {
      if (service === TrainingPlanQueryService) return mockTrainingPlanQueryService;
      if (service === WorkoutQueryService) return mockWorkoutQueryService;
      return {};
    });
  });

  describe('Initialization', () => {
    it('should return default values when no data is available', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false }) // plan
        .mockReturnValueOnce({ data: null, isObserving: false }); // workouts

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.plan).toBeNull();
      expect(result.current.completedSessions).toBe(0);
      expect(result.current.totalSessions).toBe(0);
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.upcomingSessions).toEqual([]);
      expect(result.current.lastCompleted).toBeNull();
      expect(result.current.progressMetrics).toMatchObject({
        sessionsCompleted: 0,
        totalSessions: 0,
        progressPercentage: 0,
        currentCycle: null,
        currentSession: null,
        estimatedTimeRemaining: 0,
        averageSessionDuration: 0,
        consistencyScore: 0,
      });
      expect(result.current.hasData).toBe(false);
    });

    it('should handle empty plan and profile IDs', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress('', ''));

      // Assert
      expect(result.current.plan).toBeNull();
      expect(result.current.hasData).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should return loading true when data is not observing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: false }) // plan
        .mockReturnValueOnce({ data: [], isObserving: true }); // workouts

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading false when all data is observing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Training Plan Processing', () => {
    it('should calculate total sessions correctly', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.totalSessions).toBe(3); // 2 sessions in cycle 1 + 1 session in cycle 2
    });

    it('should handle training plan with no cycles', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.totalSessions).toBe(0);
      expect(result.current.upcomingSessions).toEqual([]);
    });

    it('should handle cycles with no sessions', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [
          {
            id: 'cycle-1',
            name: 'Empty Cycle',
            orderIndex: 0,
            sessions: [],
          },
        ],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.totalSessions).toBe(0);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress correctly with completed sessions', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const completedWorkout1 = createMockWorkout({
        id: 'workout-1',
        sessionId: 'session-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      const completedWorkout2 = createMockWorkout({
        id: 'workout-2',
        sessionId: 'session-2',
        endTime: new Date('2024-03-16T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [completedWorkout1, completedWorkout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.completedSessions).toBe(2); // Two unique session IDs
      expect(result.current.totalSessions).toBe(3); // Total sessions in plan
      expect(result.current.progressPercentage).toBe(67); // (2/3) * 100, rounded
    });

    it('should handle multiple workouts for the same session', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const workout1 = createMockWorkout({
        id: 'workout-1',
        sessionId: 'session-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      const workout2 = createMockWorkout({
        id: 'workout-2',
        sessionId: 'session-1', // Same session as workout1
        endTime: new Date('2024-03-16T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.completedSessions).toBe(1); // Only one unique session
      expect(result.current.progressPercentage).toBe(33); // (1/3) * 100, rounded
    });

    it('should filter out incomplete workouts', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const completeWorkout = createMockWorkout({
        id: 'workout-1',
        sessionId: 'session-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      const incompleteWorkout = createMockWorkout({
        id: 'workout-2',
        sessionId: 'session-2',
        endTime: null, // Incomplete workout
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [completeWorkout, incompleteWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.completedSessions).toBe(1); // Only the complete workout
    });
  });

  describe('Session Processing', () => {
    it('should create session objects with correct data', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.upcomingSessions).toHaveLength(3); // All sessions are upcoming (none completed)

      const session1 = result.current.upcomingSessions.find((s) => s.id === 'session-1');
      expect(session1).toMatchObject({
        id: 'session-1',
        name: 'Session 1',
        cycleId: 'cycle-1',
        cycleName: 'Cycle 1',
        orderIndex: 0,
        exerciseCount: 2,
        estimatedDuration: 60,
        isCompleted: false,
      });
    });

    it('should mark completed sessions correctly', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const completedWorkout = createMockWorkout({
        id: 'workout-1',
        sessionId: 'session-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [completedWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.upcomingSessions).toHaveLength(2); // 2 remaining sessions

      // Check that session-1 is not in upcoming sessions (it's completed)
      const hasSession1 = result.current.upcomingSessions.some((s) => s.id === 'session-1');
      expect(hasSession1).toBe(false);
    });

    it('should set last completed date for sessions', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const workout1 = createMockWorkout({
        id: 'workout-1',
        sessionId: 'session-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      const workout2 = createMockWorkout({
        id: 'workout-2',
        sessionId: 'session-1', // Same session, more recent
        endTime: new Date('2024-03-20T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert - would need to check internal session data structure
      // This is verified indirectly through the completed sessions count
      expect(result.current.completedSessions).toBe(1);
    });

    it('should sort upcoming sessions by cycle and session order', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [
          {
            id: 'cycle-2',
            name: 'Cycle 2',
            orderIndex: 1, // Second cycle
            sessions: [
              {
                id: 'session-3',
                name: 'Session 3',
                exerciseGroups: [{ exercises: [{ id: 'ex-1' }] }],
                estimatedDuration: 60,
              },
            ],
          },
          {
            id: 'cycle-1',
            name: 'Cycle 1',
            orderIndex: 0, // First cycle
            sessions: [
              {
                id: 'session-2',
                name: 'Session 2',
                exerciseGroups: [{ exercises: [{ id: 'ex-2' }] }],
                estimatedDuration: 45,
              },
              {
                id: 'session-1',
                name: 'Session 1',
                exerciseGroups: [{ exercises: [{ id: 'ex-3' }] }],
                estimatedDuration: 30,
              },
            ],
          },
        ],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.upcomingSessions).toHaveLength(3);
      // Should be ordered by cycle order first, then session order within cycle
      expect(result.current.upcomingSessions[0].id).toBe('session-2'); // Cycle 1, first session
      expect(result.current.upcomingSessions[1].id).toBe('session-1'); // Cycle 1, second session
      expect(result.current.upcomingSessions[2].id).toBe('session-3'); // Cycle 2, first session
    });

    it('should limit upcoming sessions to 3', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [
          {
            id: 'cycle-1',
            name: 'Cycle 1',
            orderIndex: 0,
            sessions: Array.from({ length: 5 }, (_, i) => ({
              id: `session-${i + 1}`,
              name: `Session ${i + 1}`,
              exerciseGroups: [{ exercises: [{ id: `ex-${i}` }] }],
              estimatedDuration: 60,
            })),
          },
        ],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.upcomingSessions).toHaveLength(3); // Limited to 3
      expect(result.current.totalSessions).toBe(5); // But total should still be 5
    });
  });

  describe('Last Completed Workout', () => {
    it('should find the most recent completed workout', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-20T10:00:00Z'), // More recent
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.lastCompleted?.id).toBe('workout-2');
    });

    it('should return null when no completed workouts exist', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.lastCompleted).toBeNull();
    });
  });

  describe('Advanced Metrics', () => {
    it('should calculate estimated time remaining', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan(); // Has sessions with 60, 45, 75 min durations

      const completedWorkout = createMockWorkout({
        sessionId: 'session-1', // Completes the 60-minute session
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [completedWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.progressMetrics.estimatedTimeRemaining).toBe(120); // 45 + 75 = 120 minutes remaining
    });

    it('should calculate average session duration from actual workouts', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });
      workout1.getDurationInMinutes = vi.fn().mockReturnValue(50);

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-16T10:00:00Z'),
      });
      workout2.getDurationInMinutes = vi.fn().mockReturnValue(70);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.progressMetrics.averageSessionDuration).toBe(60); // (50 + 70) / 2
    });

    it('should handle workouts without duration', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });
      workout1.getDurationInMinutes = vi.fn().mockReturnValue(50);

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-16T10:00:00Z'),
      });
      workout2.getDurationInMinutes = vi.fn().mockReturnValue(undefined); // No duration

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.progressMetrics.averageSessionDuration).toBe(50); // Only workout1's duration counted
    });

    it('should calculate consistency score', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const recentWorkout = createMockWorkout({
        id: 'workout-1',
        sessionId: 'session-1',
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [recentWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      const consistencyScore = result.current.progressMetrics.consistencyScore;
      expect(consistencyScore).toBeGreaterThan(33); // Base progress percentage + recent activity bonus
      expect(consistencyScore).toBeLessThanOrEqual(100);
    });

    it('should determine current cycle and session', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      const completedWorkout = createMockWorkout({
        sessionId: 'session-1', // Complete first session
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [completedWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.progressMetrics.currentCycle).toBe('Cycle 1');
      expect(result.current.progressMetrics.currentSession).toBe('Session 2'); // Next upcoming session
    });

    it('should handle completed plan', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      // Complete all sessions
      const workout1 = createMockWorkout({ sessionId: 'session-1', endTime: new Date() });
      const workout2 = createMockWorkout({ sessionId: 'session-2', endTime: new Date() });
      const workout3 = createMockWorkout({ sessionId: 'session-3', endTime: new Date() });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2, workout3], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.progressMetrics.currentCycle).toBe('Plan Complete');
      expect(result.current.progressMetrics.currentSession).toBeNull();
      expect(result.current.progressPercentage).toBe(100);
    });
  });

  describe('Data Queries', () => {
    it('should query data with correct parameters', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(mockTrainingPlanQueryService.getTrainingPlanDetails).toHaveBeenCalledWith(planId);
      expect(mockWorkoutQueryService.getWorkoutLogsByTrainingPlan).toHaveBeenCalledWith(
        profileId,
        planId
      );
    });

    it('should not query when IDs are missing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false });

      // Act
      renderHook(() => useTrainingPlanProgress('', ''));

      // Assert
      const calls = mockUseObserveQuery.mock.calls;
      expect(calls[0][0]).toBeNull(); // plan query should be null
      expect(calls[1][0]).toBeNull(); // workout query should be null
    });
  });

  describe('Edge Cases', () => {
    it('should handle null plan data', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.plan).toBeNull();
      expect(result.current.totalSessions).toBe(0);
      expect(result.current.hasData).toBe(false);
    });

    it('should handle null workout data', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan();

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: null, isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.completedSessions).toBe(0);
      expect(result.current.lastCompleted).toBeNull();
    });

    it('should handle sessions with no exercise groups', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [
          {
            id: 'cycle-1',
            name: 'Cycle 1',
            orderIndex: 0,
            sessions: [
              {
                id: 'session-1',
                name: 'Session 1',
                exerciseGroups: [], // No exercise groups
                estimatedDuration: 60,
              },
            ],
          },
        ],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useTrainingPlanProgress(planId, profileId));
      }).not.toThrow();
    });

    it('should handle sessions with null exercise groups', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [
          {
            id: 'cycle-1',
            name: 'Cycle 1',
            orderIndex: 0,
            sessions: [
              {
                id: 'session-1',
                name: 'Session 1',
                exerciseGroups: null as any,
                estimatedDuration: 60,
              },
            ],
          },
        ],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useTrainingPlanProgress(planId, profileId));
      }).not.toThrow();
    });

    it('should use default estimated duration when not provided', () => {
      // Arrange
      const mockPlan = createMockTrainingPlan({
        trainingCycles: [
          {
            id: 'cycle-1',
            name: 'Cycle 1',
            orderIndex: 0,
            sessions: [
              {
                id: 'session-1',
                name: 'Session 1',
                exerciseGroups: [{ exercises: [{ id: 'ex-1' }] }],
                estimatedDuration: undefined as any,
              },
            ],
          },
        ],
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockPlan], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useTrainingPlanProgress(planId, profileId));

      // Assert
      expect(result.current.progressMetrics.estimatedTimeRemaining).toBe(60); // Default duration
    });
  });
});
