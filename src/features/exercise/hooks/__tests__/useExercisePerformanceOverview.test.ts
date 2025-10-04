import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const mockUseObserveQuery = vi.hoisted(() => vi.fn());

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';

import { useExercisePerformanceOverview } from '../useExercisePerformanceOverview';

// Mock tsyringe
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
    resolve: vi.fn(),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

// Mock useObserveQuery
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  exercisesToDomain: vi.fn((data) => data),
  maxLogsToDomain: vi.fn((data) => data),
  workoutLogsToDomain: vi.fn((data) => data),
}));

const mockExerciseQueryService = {
  getExerciseById: vi.fn(),
};

const mockMaxLogQueryService = {
  getMaxLogsByExercise: vi.fn(),
};

const mockWorkoutQueryService = {
  getWorkoutHistoryByExerciseInDateRange: vi.fn(),
};

// Mock data creators
const createMockExercise = (overrides: Partial<ExerciseModel> = {}): ExerciseModel =>
  ({
    id: 'exercise-1',
    name: 'Squat',
    category: 'Compound',
    muscleGroups: ['Quadriceps', 'Glutes'],
    ...overrides,
  }) as ExerciseModel;

const createMockMaxLog = (overrides: Partial<MaxLogModel> = {}): MaxLogModel =>
  ({
    id: 'max-1',
    exerciseId: 'exercise-1',
    exerciseName: 'Squat',
    weight: 100,
    reps: 5,
    achievedDate: new Date('2024-03-10T10:00:00Z'),
    workoutId: 'workout-1',
    ...overrides,
  }) as MaxLogModel;

const createMockWorkout = (overrides: Partial<WorkoutLogModel> = {}): WorkoutLogModel =>
  ({
    id: 'workout-1',
    endTime: new Date('2024-03-15T10:00:00Z'),
    getAllExercises: vi.fn().mockReturnValue([
      {
        exerciseId: 'exercise-1',
        exerciseName: 'Squat',
        sets: [
          { completed: true, weight: 100, counts: 10 },
          { completed: true, weight: 105, counts: 8 },
        ],
      },
    ]),
    ...overrides,
  }) as unknown as WorkoutLogModel;

describe('useExercisePerformanceOverview', () => {
  const exerciseId = 'exercise-1';
  const profileId = 'test-profile-id';

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup container mocks
    (container.resolve as any).mockImplementation((service: any) => {
      if (service === ExerciseQueryService) return mockExerciseQueryService;
      if (service === MaxLogQueryService) return mockMaxLogQueryService;
      if (service === WorkoutQueryService) return mockWorkoutQueryService;
      return {};
    });

    // Setup useObserveQuery mock
    mockUseObserveQuery.mockReturnValue({ data: null, isObserving: false });
  });

  describe('Initialization', () => {
    it('should return default values when no data is available', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false }) // exercise
        .mockReturnValueOnce({ data: null, isObserving: false }) // max logs
        .mockReturnValueOnce({ data: null, isObserving: false }); // workouts

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.exerciseData).toBeNull();
      expect(result.current.maxLogs).toEqual([]);
      expect(result.current.recentWorkouts).toEqual([]);
      expect(result.current.progressTrend).toEqual([]);
      expect(result.current.volumeHistory).toEqual([]);
      expect(result.current.performanceMetrics).toMatchObject({
        totalSessions: 0,
        totalVolume: 0,
        averageVolume: 0,
        bestSet: null,
        currentStreak: 0,
        lastPerformed: null,
        progressTrend: 'stable',
        volumeTrend: 'stable',
      });
      expect(result.current.hasData).toBe(false);
    });

    it('should handle empty exercise and profile IDs', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview('', ''));

      // Assert
      expect(result.current.exerciseData).toBeNull();
      expect(result.current.hasData).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should return loading true when data is not observing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: false }) // exercise
        .mockReturnValueOnce({ data: [], isObserving: true }) // max logs
        .mockReturnValueOnce({ data: [], isObserving: true }); // workouts

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading false when all data is observing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Exercise Data Processing', () => {
    it('should process exercise data correctly', () => {
      // Arrange
      const mockExercise = createMockExercise({
        id: 'exercise-1',
        name: 'Squat',
        category: 'Compound',
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [mockExercise], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.exerciseData).toEqual(mockExercise);
    });

    it('should handle multiple exercises and select the first one', () => {
      // Arrange
      const exercise1 = createMockExercise({ id: 'exercise-1', name: 'Squat' });
      const exercise2 = createMockExercise({ id: 'exercise-2', name: 'Deadlift' });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [exercise1, exercise2], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.exerciseData).toEqual(exercise1);
    });
  });

  describe('Progress Trend Processing', () => {
    it('should create progress trend from max logs', () => {
      // Arrange
      const maxLog1 = createMockMaxLog({
        id: 'max-1',
        weight: 100,
        achievedDate: new Date('2024-03-01T10:00:00Z'),
        workoutId: 'workout-1',
      });

      const maxLog2 = createMockMaxLog({
        id: 'max-2',
        weight: 110,
        achievedDate: new Date('2024-03-15T10:00:00Z'),
        workoutId: 'workout-2',
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [maxLog2, maxLog1], isObserving: true }) // Unsorted
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.progressTrend).toHaveLength(2);
      // Should be sorted by date
      expect(result.current.progressTrend[0]).toMatchObject({
        date: new Date('2024-03-01T10:00:00Z'),
        value: 100,
        type: 'weight',
        workoutId: 'workout-1',
      });
      expect(result.current.progressTrend[1]).toMatchObject({
        date: new Date('2024-03-15T10:00:00Z'),
        value: 110,
        type: 'weight',
        workoutId: 'workout-2',
      });
    });
  });

  describe('Volume History Processing', () => {
    it('should calculate volume history from workouts', () => {
      // Arrange
      const mockWorkout = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      // Mock the getAllExercises method to return sets
      mockWorkout.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          exerciseName: 'Squat',
          sets: [
            { completed: true, weight: 100, counts: 10 }, // Volume: 1000
            { completed: true, weight: 110, counts: 8 }, // Volume: 880
          ],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [mockWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.volumeHistory).toHaveLength(1);
      expect(result.current.volumeHistory[0]).toMatchObject({
        date: new Date('2024-03-15T10:00:00Z'),
        volume: 1880, // 1000 + 880
        averageWeight: 105, // (100 + 110) / 2
        totalSets: 2,
        workoutId: 'workout-1',
      });
    });

    it('should filter out incomplete sets', () => {
      // Arrange
      const mockWorkout = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockWorkout.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          exerciseName: 'Squat',
          sets: [
            { completed: true, weight: 100, counts: 10 }, // Should be included
            { completed: false, weight: 110, counts: 8 }, // Should be filtered out
            { completed: true, weight: null, counts: 8 }, // Should be filtered out
            { completed: true, weight: 105, counts: null }, // Should be filtered out
          ],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [mockWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.volumeHistory[0]).toMatchObject({
        volume: 1000, // Only one valid set
        totalSets: 1,
        averageWeight: 100,
      });
    });

    it('should filter exercises by exercise ID', () => {
      // Arrange
      const mockWorkout = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockWorkout.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1', // Matches our target exercise
          exerciseName: 'Squat',
          sets: [{ completed: true, weight: 100, counts: 10 }],
        },
        {
          exerciseId: 'exercise-2', // Different exercise, should be filtered out
          exerciseName: 'Bench Press',
          sets: [{ completed: true, weight: 80, counts: 12 }],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [mockWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.volumeHistory[0]).toMatchObject({
        volume: 1000, // Only from exercise-1
        totalSets: 1,
      });
    });

    it('should skip workouts with zero volume for the exercise', () => {
      // Arrange
      const workoutWithVolume = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });
      workoutWithVolume.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [{ completed: true, weight: 100, counts: 10 }],
        },
      ]);

      const workoutWithoutVolume = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-16T10:00:00Z'),
      });
      workoutWithoutVolume.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-2', // Different exercise
          sets: [{ completed: true, weight: 80, counts: 8 }],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({
          data: [workoutWithVolume, workoutWithoutVolume],
          isObserving: true,
        });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.volumeHistory).toHaveLength(1);
      expect(result.current.volumeHistory[0].workoutId).toBe('workout-1');
    });

    it('should sort volume history by date', () => {
      // Arrange
      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-20T10:00:00Z'), // Later date
      });

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-10T10:00:00Z'), // Earlier date
      });

      [workout1, workout2].forEach((workout) => {
        workout.getAllExercises = vi.fn().mockReturnValue([
          {
            exerciseId: 'exercise-1',
            sets: [{ completed: true, weight: 100, counts: 10 }],
          },
        ]);
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.volumeHistory).toHaveLength(2);
      expect(result.current.volumeHistory[0].workoutId).toBe('workout-2'); // Earlier date first
      expect(result.current.volumeHistory[1].workoutId).toBe('workout-1'); // Later date second
    });
  });

  describe('Performance Metrics Processing', () => {
    it('should calculate total sessions from volume history', () => {
      // Arrange
      const workout1 = createMockWorkout({ id: 'workout-1' });
      const workout2 = createMockWorkout({ id: 'workout-2' });

      [workout1, workout2].forEach((workout) => {
        workout.getAllExercises = vi.fn().mockReturnValue([
          {
            exerciseId: 'exercise-1',
            sets: [{ completed: true, weight: 100, counts: 10 }],
          },
        ]);
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.totalSessions).toBe(2);
    });

    it('should calculate total and average volume', () => {
      // Arrange
      const workout1 = createMockWorkout({ id: 'workout-1' });
      workout1.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [{ completed: true, weight: 100, counts: 10 }], // Volume: 1000
        },
      ]);

      const workout2 = createMockWorkout({ id: 'workout-2' });
      workout2.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [{ completed: true, weight: 120, counts: 8 }], // Volume: 960
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.totalVolume).toBe(1960); // 1000 + 960
      expect(result.current.performanceMetrics.averageVolume).toBe(980); // 1960 / 2
    });

    it('should find the best set across all workouts', () => {
      // Arrange
      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-10T10:00:00Z'),
      });
      workout1.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [
            { completed: true, weight: 100, counts: 10 }, // Volume: 1000
            { completed: true, weight: 110, counts: 8 }, // Volume: 880
          ],
        },
      ]);

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });
      workout2.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [
            { completed: true, weight: 120, counts: 9 }, // Volume: 1080 - Best set
          ],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.bestSet).toMatchObject({
        weight: 120,
        reps: 9,
        date: new Date('2024-03-15T10:00:00Z'),
        workoutId: 'workout-2',
      });
    });

    it('should calculate current streak correctly', () => {
      // Arrange
      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-20T10:00:00Z'), // Most recent
      });
      workout1.getAllExercises = vi.fn().mockReturnValue([
        { exerciseId: 'exercise-1', sets: [] }, // Has the exercise
      ]);

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-18T10:00:00Z'),
      });
      workout2.getAllExercises = vi.fn().mockReturnValue([
        { exerciseId: 'exercise-1', sets: [] }, // Has the exercise
      ]);

      const workout3 = createMockWorkout({
        id: 'workout-3',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });
      workout3.getAllExercises = vi.fn().mockReturnValue([
        { exerciseId: 'exercise-2', sets: [] }, // Different exercise - breaks streak
      ]);

      const workout4 = createMockWorkout({
        id: 'workout-4',
        endTime: new Date('2024-03-12T10:00:00Z'),
      });
      workout4.getAllExercises = vi.fn().mockReturnValue([
        { exerciseId: 'exercise-1', sets: [] }, // Has the exercise but after break
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2, workout3, workout4], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.currentStreak).toBe(2); // workout1 and workout2
    });

    it('should find last performed date', () => {
      // Arrange
      const workout1 = createMockWorkout({
        id: 'workout-1',
        endTime: new Date('2024-03-10T10:00:00Z'),
      });
      workout1.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [{ completed: true, weight: 100, counts: 10 }],
        },
      ]);

      const workout2 = createMockWorkout({
        id: 'workout-2',
        endTime: new Date('2024-03-20T10:00:00Z'), // More recent
      });
      workout2.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [{ completed: true, weight: 110, counts: 8 }],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [workout1, workout2], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.lastPerformed).toEqual(
        new Date('2024-03-20T10:00:00Z')
      );
    });
  });

  describe('Trend Calculations', () => {
    it('should calculate improving trend', () => {
      // Arrange
      const maxLogs = [
        createMockMaxLog({ weight: 100, achievedDate: new Date('2024-01-01') }),
        createMockMaxLog({ weight: 105, achievedDate: new Date('2024-02-01') }),
        createMockMaxLog({ weight: 110, achievedDate: new Date('2024-03-01') }),
      ];

      const workout = createMockWorkout();
      workout.getAllExercises = vi.fn().mockReturnValue([
        {
          exerciseId: 'exercise-1',
          sets: [
            { completed: true, weight: 100, counts: 10 }, // Early volume: 1000
            { completed: true, weight: 110, counts: 10 }, // Later volume: 1100
          ],
        },
      ]);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: maxLogs, isObserving: true })
        .mockReturnValueOnce({ data: [workout], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.progressTrend).toBe('improving');
    });

    it('should calculate declining trend', () => {
      // Arrange
      const maxLogs = [
        createMockMaxLog({ weight: 110, achievedDate: new Date('2024-01-01') }),
        createMockMaxLog({ weight: 105, achievedDate: new Date('2024-02-01') }),
        createMockMaxLog({ weight: 100, achievedDate: new Date('2024-03-01') }),
      ];

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: maxLogs, isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.progressTrend).toBe('declining');
    });

    it('should calculate stable trend for similar values', () => {
      // Arrange - Values with very small differences to stay within stable threshold
      const maxLogs = [
        createMockMaxLog({ weight: 100, achievedDate: new Date('2024-01-01') }),
        createMockMaxLog({ weight: 100.02, achievedDate: new Date('2024-02-01') }),
        createMockMaxLog({ weight: 99.98, achievedDate: new Date('2024-03-01') }),
      ];

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: maxLogs, isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.progressTrend).toBe('stable');
    });

    it('should handle single data point as stable', () => {
      // Arrange
      const maxLogs = [createMockMaxLog({ weight: 100, achievedDate: new Date('2024-01-01') })];

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: maxLogs, isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.performanceMetrics.progressTrend).toBe('stable');
    });
  });

  describe('Data Queries', () => {
    it('should query data with correct parameters', () => {
      // Arrange
      const now = new Date('2024-03-20T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(mockExerciseQueryService.getExerciseById).toHaveBeenCalledWith(exerciseId);
      expect(mockMaxLogQueryService.getMaxLogsByExercise).toHaveBeenCalledWith(
        profileId,
        exerciseId
      );
      expect(mockWorkoutQueryService.getWorkoutHistoryByExerciseInDateRange).toHaveBeenCalledWith(
        profileId,
        exerciseId,
        {
          from: new Date('2023-12-20T12:00:00Z'), // 3 months ago
          to: now,
        }
      );

      vi.useRealTimers();
    });

    it('should not query when IDs are missing', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false })
        .mockReturnValueOnce({ data: null, isObserving: false });

      // Act
      renderHook(() => useExercisePerformanceOverview('', ''));

      // Assert
      const calls = mockUseObserveQuery.mock.calls;
      expect(calls[0][0]).toBeNull(); // exercise query should be null
      expect(calls[1][0]).toBeNull(); // max logs query should be null
      expect(calls[2][0]).toBeNull(); // workouts query should be null
    });
  });

  describe('Edge Cases', () => {
    it('should handle incomplete workouts', () => {
      // Arrange
      const incompleteWorkout = createMockWorkout({
        id: 'incomplete-workout',
        endTime: null, // No end time = incomplete
      });

      const completeWorkout = createMockWorkout({
        id: 'complete-workout',
        endTime: new Date('2024-03-15T10:00:00Z'),
      });

      mockUseObserveQuery
        .mockReturnValueOnce({ data: [createMockExercise()], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [incompleteWorkout, completeWorkout], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.recentWorkouts).toHaveLength(1);
      expect(result.current.recentWorkouts[0].id).toBe('complete-workout');
    });

    it('should handle null data gracefully', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: null, isObserving: true })
        .mockReturnValueOnce({ data: null, isObserving: true })
        .mockReturnValueOnce({ data: null, isObserving: true });

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));
      }).not.toThrow();
    });

    it('should handle empty arrays gracefully', () => {
      // Arrange
      mockUseObserveQuery
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true })
        .mockReturnValueOnce({ data: [], isObserving: true });

      // Act
      const { result } = renderHook(() => useExercisePerformanceOverview(exerciseId, profileId));

      // Assert
      expect(result.current.exerciseData).toBeNull();
      expect(result.current.performanceMetrics.totalSessions).toBe(0);
      expect(result.current.hasData).toBe(false);
    });
  });
});
