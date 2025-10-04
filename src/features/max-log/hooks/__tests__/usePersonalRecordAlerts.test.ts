import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { maxLogsToDomain } from '@/shared/utils/transformations';

import { usePersonalRecordAlerts } from '../usePersonalRecordAlerts';

// Mock the container
vi.mock('tsyringe', () => ({
  container: {
    resolve: vi.fn(),
  },
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  maxLogsToDomain: vi.fn(),
}));

// Mock the shared hooks
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: vi.fn(),
}));

describe('usePersonalRecordAlerts', () => {
  const mockProfileId = 'profile-123';

  // Define mocks outside beforeEach so they can be accessed in tests
  const mockUseObserveQuery = useObserveQuery as any;
  const mockMaxLogsToDomain = maxLogsToDomain as any;
  const mockContainer = container as any;
  let mockMaxLogQueryService: any;

  // Fixed base timestamp to avoid timing issues
  const baseTime = new Date('2025-09-01T12:00:00.000Z').getTime();

  const mockMaxLogs = [
    {
      id: 'max1',
      exerciseId: 'ex1',
      exerciseName: 'Bench Press',
      weight: 100,
      reps: 5,
      achievedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago from current time
      workoutId: 'w1',
    },
    {
      id: 'max2',
      exerciseId: 'ex1',
      exerciseName: 'Bench Press',
      weight: 95,
      reps: 8,
      achievedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago from current time
      workoutId: 'w2',
    },
    {
      id: 'max3',
      exerciseId: 'ex2',
      exerciseName: 'Squats',
      weight: 120,
      reps: 3,
      achievedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago from current time
      workoutId: 'w3',
    },
    {
      id: 'max4',
      exerciseId: 'ex1',
      exerciseName: 'Bench Press',
      weight: 102,
      reps: 4,
      achievedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago from current time
      workoutId: 'w4',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockMaxLogQueryService = {
      getAllMaxLogs: vi.fn().mockReturnValue('mock-query'),
    };

    mockContainer.resolve.mockReturnValue(mockMaxLogQueryService);
    mockMaxLogsToDomain.mockImplementation((data) => data);
    mockUseObserveQuery.mockReturnValue({ data: mockMaxLogs });
  });

  describe('recent PRs processing', () => {
    it('should return recent PRs from last 30 days', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMaxLogs = [
        {
          id: 'max1',
          exerciseId: 'ex1',
          exerciseName: 'Bench Press',
          weight: 100,
          reps: 5,
          achievedDate: new Date(), // Today
          workoutId: 'w1',
        },
        {
          id: 'max2',
          exerciseId: 'ex2',
          exerciseName: 'Squats',
          weight: 120,
          reps: 3,
          achievedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          workoutId: 'w2',
        },
        {
          id: 'max3',
          exerciseId: 'ex3',
          exerciseName: 'Deadlift',
          weight: 140,
          reps: 1,
          achievedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago (should be excluded)
          workoutId: 'w3',
        },
      ];

      mockUseObserveQuery.mockReturnValue({ data: recentMaxLogs });

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(result.current.recentPRs).toHaveLength(2);
      expect(result.current.recentPRs[0].exerciseName).toBe('Bench Press');
      expect(result.current.recentPRs[1].exerciseName).toBe('Squats');
    });

    it('should sort recent PRs by date descending', () => {
      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      const dates = result.current.recentPRs.map((pr) => pr.achievedDate.getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should limit recent PRs to 10', () => {
      const manyRecentMaxLogs = Array.from({ length: 15 }, (_, i) => ({
        id: `max${i}`,
        exerciseId: `ex${i}`,
        exerciseName: `Exercise ${i}`,
        weight: 100,
        reps: 5,
        achievedDate: new Date(),
        workoutId: `w${i}`,
      }));

      mockUseObserveQuery.mockReturnValue({ data: manyRecentMaxLogs });

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(result.current.recentPRs).toHaveLength(10);
    });
  });

  describe('PR history processing', () => {
    it('should group PRs by exercise', () => {
      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(result.current.prHistory).toHaveLength(2); // 2 different exercises

      const benchPressHistory = result.current.prHistory.find((h) => h.exerciseId === 'ex1');
      const squatsHistory = result.current.prHistory.find((h) => h.exerciseId === 'ex2');

      expect(benchPressHistory).toBeDefined();
      expect(benchPressHistory!.exerciseName).toBe('Bench Press');
      expect(benchPressHistory!.records).toHaveLength(3); // 3 bench press records

      expect(squatsHistory).toBeDefined();
      expect(squatsHistory!.exerciseName).toBe('Squats');
      expect(squatsHistory!.records).toHaveLength(1); // 1 squat record
    });

    it('should sort records within each exercise by date descending', () => {
      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      const benchPressHistory = result.current.prHistory.find((h) => h.exerciseId === 'ex1');
      const recordDates = benchPressHistory!.records.map((r) => r.achievedDate.getTime());

      for (let i = 1; i < recordDates.length; i++) {
        expect(recordDates[i - 1]).toBeGreaterThanOrEqual(recordDates[i]);
      }
    });

    it('should calculate total PRs and last PR date correctly', () => {
      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      const benchPressHistory = result.current.prHistory.find((h) => h.exerciseId === 'ex1');
      expect(benchPressHistory!.totalPRs).toBe(3);
      // Check that the last PR date is the most recent Bench Press record (max1 - 5 days ago)
      // Since we're using Date.now(), we need to check it's approximately 5 days ago
      const expectedDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const actualDate = benchPressHistory!.lastPRDate;
      const timeDifference = Math.abs(actualDate.getTime() - expectedDate.getTime());
      expect(timeDifference).toBeLessThan(1000); // Within 1 second tolerance
    });

    it('should sort exercise histories by last PR date descending', () => {
      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      const historyDates = result.current.prHistory.map((h) => h.lastPRDate.getTime());
      for (let i = 1; i < historyDates.length; i++) {
        expect(historyDates[i - 1]).toBeGreaterThanOrEqual(historyDates[i]);
      }
    });
  });

  describe('checkForPRs function', () => {
    it('should detect first PR for new exercise', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex99', // New exercise not in max logs
            exerciseName: 'New Exercise',
            sets: [{ completed: true, weight: 80, counts: 10 }],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('first_pr');
      expect(alerts[0].exerciseId).toBe('ex99');
      expect(alerts[0].newRecord.weight).toBe(80);
      expect(alerts[0].newRecord.reps).toBe(10);
      expect(alerts[0].improvement.percentageIncrease).toBe(100);
    });

    it('should detect new weight PR', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: true, weight: 105, counts: 4 }, // Higher weight than existing 102kg
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('new_pr');
      expect(alerts[0].exerciseId).toBe('ex1');
      expect(alerts[0].newRecord.weight).toBe(105);
      expect(alerts[0].previousRecord?.weight).toBe(102);
      expect(alerts[0].improvement.weightIncrease).toBe(3);
    });

    it('should detect rep PR (same weight, more reps)', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: true, weight: 102, counts: 6 }, // Same weight as best, but more reps
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('rep_pr');
      expect(alerts[0].exerciseId).toBe('ex1');
      expect(alerts[0].newRecord.weight).toBe(102);
      expect(alerts[0].newRecord.reps).toBe(6);
      expect(alerts[0].improvement.weightIncrease).toBe(0);
    });

    it('should detect volume PR', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: true, weight: 90, counts: 12 }, // 90 * 12 = 1080 > highest existing volume
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('volume_pr');
      expect(alerts[0].exerciseId).toBe('ex1');
      expect(alerts[0].newRecord.weight).toBe(90);
      expect(alerts[0].newRecord.reps).toBe(12);
    });

    it('should not detect PR when no improvement', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: true, weight: 90, counts: 3 }, // Lower than existing records
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(0);
    });

    it('should ignore incomplete sets', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: false, weight: 200, counts: 10 }, // Not completed
              { completed: true, weight: 90, counts: 3 }, // Completed but not a PR
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(0);
    });

    it('should ignore sets without weight or reps', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: true, weight: null, counts: 10 },
              { completed: true, weight: 100, counts: null },
              { completed: true, weight: 90, counts: 3 },
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(0);
    });

    it('should not check for PRs on incomplete workouts', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: null, // Incomplete workout
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [{ completed: true, weight: 200, counts: 10 }],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      expect(alerts).toHaveLength(0);
    });

    it('should remove duplicate alerts for same exercise', () => {
      const mockWorkout = {
        id: 'w5',
        endTime: new Date('2024-01-20'),
        getAllExercises: () => [
          {
            exerciseId: 'ex1',
            exerciseName: 'Bench Press',
            sets: [
              { completed: true, weight: 105, counts: 4 }, // New weight PR
              { completed: true, weight: 106, counts: 3 }, // Even better weight PR
            ],
          },
        ],
      };

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      const alerts = result.current.checkForPRs(mockWorkout);

      // Should only return the best alert for the exercise
      expect(alerts).toHaveLength(1);
      expect(alerts[0].newRecord.weight).toBe(106);
    });
  });

  describe('celebratePR function', () => {
    it('should log celebration message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
      result.current.celebratePR('test-pr-id');

      expect(consoleSpy).toHaveBeenCalledWith('🎉 Celebrating PR: test-pr-id');

      consoleSpy.mockRestore();
    });
  });

  describe('when no data is available', () => {
    it('should return empty results when no max logs', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(result.current.recentPRs).toHaveLength(0);
      expect(result.current.prHistory).toHaveLength(0);
    });

    it('should return empty results when max logs array is empty', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(result.current.recentPRs).toHaveLength(0);
      expect(result.current.prHistory).toHaveLength(0);
    });
  });

  describe('query service integration', () => {
    it('should call max log query service with correct profile ID', () => {
      renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(mockMaxLogQueryService.getAllMaxLogs).toHaveBeenCalledWith(mockProfileId);
    });

    it('should not call service when no profileId', () => {
      renderHook(() => usePersonalRecordAlerts(''));

      expect(mockMaxLogQueryService.getAllMaxLogs).not.toHaveBeenCalled();
    });
  });

  describe('useObserveQuery integration', () => {
    it('should enable query only when profileId is provided', () => {
      renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(mockUseObserveQuery).toHaveBeenCalledWith('mock-query', {
        transform: mockMaxLogsToDomain,
        enabled: true,
      });
    });

    it('should disable query when profileId is not provided', () => {
      mockUseObserveQuery.mockClear();

      renderHook(() => usePersonalRecordAlerts(''));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(null, {
        transform: mockMaxLogsToDomain,
        enabled: false,
      });
    });
  });

  describe('helper functions', () => {
    describe('findBestRecord function', () => {
      it('should find best record in same rep range', () => {
        const mockWorkout = {
          id: 'w5',
          endTime: new Date('2024-01-20'),
          getAllExercises: () => [
            {
              exerciseId: 'ex1',
              exerciseName: 'Bench Press',
              sets: [
                { completed: true, weight: 99, counts: 5 }, // Close to existing 5-rep record
              ],
            },
          ],
        };

        const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
        const alerts = result.current.checkForPRs(mockWorkout);

        // Should not be a PR since 99 < 100 (existing 5-rep record)
        expect(alerts).toHaveLength(0);
      });

      it('should handle empty max logs gracefully', () => {
        mockUseObserveQuery.mockReturnValue({ data: [] });

        const mockWorkout = {
          id: 'w5',
          endTime: new Date('2024-01-20'),
          getAllExercises: () => [
            {
              exerciseId: 'ex1',
              exerciseName: 'Bench Press',
              sets: [{ completed: true, weight: 100, counts: 5 }],
            },
          ],
        };

        const { result } = renderHook(() => usePersonalRecordAlerts(mockProfileId));
        const alerts = result.current.checkForPRs(mockWorkout);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe('first_pr');
      });
    });
  });

  describe('memoization behavior', () => {
    it('should recalculate when max log data changes', () => {
      const { result, rerender } = renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(result.current.recentPRs).toHaveLength(4);

      // Change the data
      const newMaxLogs = [mockMaxLogs[0]]; // Only one record
      mockUseObserveQuery.mockReturnValue({ data: newMaxLogs });

      rerender();

      expect(result.current.recentPRs).toHaveLength(1);
      expect(result.current.prHistory).toHaveLength(1);
    });
  });

  describe('container dependency injection', () => {
    it('should resolve MaxLogQueryService from container', () => {
      renderHook(() => usePersonalRecordAlerts(mockProfileId));

      expect(mockContainer.resolve).toHaveBeenCalledWith(expect.anything());
    });
  });
});
