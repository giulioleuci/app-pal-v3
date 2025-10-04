import { renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrainingPlanQueryService } from '@/features/training-plan/query-services/TrainingPlanQueryService';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { WorkoutService } from '@/features/workout/services/WorkoutService';

import { CalendarDay, ScheduledWorkout, useWorkoutCalendar } from '../useWorkoutCalendar';

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
  workoutLogsToDomain: vi.fn((data) => data),
}));

const mockWorkoutService = {
  // Service methods would be mocked here
};

const mockWorkoutQueryService = {
  getWorkoutHistoryInDateRange: vi.fn(),
};

const mockTrainingPlanQueryService = {
  // Service methods would be mocked here
};

describe('useWorkoutCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup container mocks
    (container.resolve as any).mockImplementation((service: any) => {
      if (service === WorkoutService) return mockWorkoutService;
      if (service === WorkoutQueryService) return mockWorkoutQueryService;
      if (service === TrainingPlanQueryService) return mockTrainingPlanQueryService;
      return {};
    });
  });

  describe('Calendar Generation', () => {
    it('should generate calendar for a month with no workouts', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2; // March
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.calendarData).toHaveLength(42); // 6 weeks * 7 days
      expect(result.current.calendarData.every((day) => !day.hasWorkout)).toBe(true);
      expect(result.current.calendarData.every((day) => day.workoutCount === 0)).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should mark today correctly', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const today = new Date();
      const month = today.getMonth();
      const year = today.getFullYear();

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const todayInCalendar = result.current.calendarData.find((day) => day.isToday);
      expect(todayInCalendar).toBeDefined();
      expect(todayInCalendar?.date.toDateString()).toBe(today.toDateString());
    });

    it('should mark current month days correctly', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2; // March
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const currentMonthDays = result.current.calendarData.filter((day) => day.isCurrentMonth);
      const totalDaysInMarch = new Date(2024, 3, 0).getDate(); // 31 days
      expect(currentMonthDays).toHaveLength(totalDaysInMarch);

      // Check that all March days are marked as current month
      currentMonthDays.forEach((day) => {
        expect(day.date.getMonth()).toBe(month);
        expect(day.date.getFullYear()).toBe(year);
      });
    });

    it('should handle date range calculation correctly', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 0; // January
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(mockWorkoutQueryService.getWorkoutHistoryInDateRange).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining({
          from: new Date(2024, 0, 1), // January 1st
          to: new Date(2024, 0, 31, 23, 59, 59), // January 31st end of day
        })
      );
    });
  });

  describe('Workout Data Processing', () => {
    it('should process workout data and populate calendar days', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2; // March
      const year = 2024;

      const mockWorkout = {
        id: 'workout-1',
        endTime: new Date(2024, 2, 15, 10, 30), // March 15th
        getDisplayName: vi.fn().mockReturnValue('Morning Workout'),
        getDurationInMinutes: vi.fn().mockReturnValue(45),
      } as unknown as WorkoutLogModel;

      mockUseObserveQuery.mockReturnValue({
        data: [mockWorkout],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const march15 = result.current.calendarData.find(
        (day) => day.date.getDate() === 15 && day.date.getMonth() === 2
      );

      expect(march15).toBeDefined();
      expect(march15!.hasWorkout).toBe(true);
      expect(march15!.workoutCount).toBe(1);
      expect(march15!.completedWorkouts).toHaveLength(1);
      expect(march15!.completedWorkouts[0]).toEqual({
        id: 'workout-1',
        name: 'Morning Workout',
        duration: 45,
        completedAt: mockWorkout.endTime,
      });
    });

    it('should group multiple workouts on the same day', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      const workout1 = {
        id: 'workout-1',
        endTime: new Date(2024, 2, 15, 9, 0),
        getDisplayName: vi.fn().mockReturnValue('Morning Workout'),
        getDurationInMinutes: vi.fn().mockReturnValue(45),
      } as unknown as WorkoutLogModel;

      const workout2 = {
        id: 'workout-2',
        endTime: new Date(2024, 2, 15, 18, 0),
        getDisplayName: vi.fn().mockReturnValue('Evening Workout'),
        getDurationInMinutes: vi.fn().mockReturnValue(30),
      } as unknown as WorkoutLogModel;

      mockUseObserveQuery.mockReturnValue({
        data: [workout1, workout2],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const march15 = result.current.calendarData.find(
        (day) => day.date.getDate() === 15 && day.date.getMonth() === 2
      );

      expect(march15!.workoutCount).toBe(2);
      expect(march15!.completedWorkouts).toHaveLength(2);
    });

    it('should filter out incomplete workouts', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      const incompleteWorkout = {
        id: 'workout-incomplete',
        endTime: null, // No end time = incomplete
        getDisplayName: vi.fn().mockReturnValue('Incomplete Workout'),
        getDurationInMinutes: vi.fn().mockReturnValue(0),
      } as unknown as WorkoutLogModel;

      mockUseObserveQuery.mockReturnValue({
        data: [incompleteWorkout],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const allDays = result.current.calendarData;
      expect(allDays.every((day) => day.workoutCount === 0)).toBe(true);
      expect(allDays.every((day) => !day.hasWorkout)).toBe(true);
    });
  });

  describe('Workout History Summary', () => {
    it('should generate workout history summary sorted by date', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      const workout1 = {
        id: 'workout-1',
        endTime: new Date(2024, 2, 10),
        getDisplayName: vi.fn().mockReturnValue('Workout 1'),
        getDurationInMinutes: vi.fn().mockReturnValue(45),
      } as unknown as WorkoutLogModel;

      const workout2 = {
        id: 'workout-2',
        endTime: new Date(2024, 2, 20),
        getDisplayName: vi.fn().mockReturnValue('Workout 2'),
        getDurationInMinutes: vi.fn().mockReturnValue(60),
      } as unknown as WorkoutLogModel;

      mockUseObserveQuery.mockReturnValue({
        data: [workout1, workout2],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.workoutHistory).toHaveLength(2);
      // Should be sorted by date descending (most recent first)
      expect(result.current.workoutHistory[0].id).toBe('workout-2');
      expect(result.current.workoutHistory[1].id).toBe('workout-1');
    });

    it('should return empty history when no workouts exist', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.workoutHistory).toHaveLength(0);
    });
  });

  describe('Scheduled Workouts', () => {
    it('should handle empty scheduled workouts', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.scheduledWorkouts).toHaveLength(0);
      expect(result.current.calendarData.every((day) => !day.hasScheduledWorkout)).toBe(true);
      expect(result.current.calendarData.every((day) => day.scheduledWorkouts.length === 0)).toBe(
        true
      );
    });
  });

  describe('Scheduling Functions', () => {
    it('should provide addScheduledWorkout function', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Act & Assert
      expect(result.current.addScheduledWorkout).toBeInstanceOf(Function);

      // Test that it can be called without throwing
      await expect(
        result.current.addScheduledWorkout(new Date(), 'plan-1', 'session-1')
      ).resolves.not.toThrow();
    });

    it('should provide removeScheduledWorkout function', async () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Act & Assert
      expect(result.current.removeScheduledWorkout).toBeInstanceOf(Function);

      // Test that it can be called without throwing
      await expect(
        result.current.removeScheduledWorkout('scheduled-workout-1')
      ).resolves.not.toThrow();
    });
  });

  describe('Loading States', () => {
    it('should return loading true when data is not observing', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: false,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading false when data is observing', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty profileId', () => {
      // Arrange
      const profileId = '';
      const month = 2;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: null,
        isObserving: false,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      expect(result.current.calendarData).toHaveLength(42);
      expect(result.current.workoutHistory).toHaveLength(0);
      expect(result.current.scheduledWorkouts).toHaveLength(0);
    });

    it('should handle month boundary correctly', () => {
      // Arrange - Test January (month 0)
      const profileId = 'test-profile-id';
      const month = 0;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const januaryDays = result.current.calendarData.filter((day) => day.isCurrentMonth);
      expect(januaryDays).toHaveLength(31); // January has 31 days
    });

    it('should handle December (month 11) correctly', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 11;
      const year = 2024;

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const decemberDays = result.current.calendarData.filter((day) => day.isCurrentMonth);
      expect(decemberDays).toHaveLength(31); // December has 31 days
    });

    it('should handle leap year February correctly', () => {
      // Arrange
      const profileId = 'test-profile-id';
      const month = 1; // February
      const year = 2024; // Leap year

      mockUseObserveQuery.mockReturnValue({
        data: [],
        isObserving: true,
      });

      // Act
      const { result } = renderHook(() => useWorkoutCalendar(profileId, month, year));

      // Assert
      const februaryDays = result.current.calendarData.filter((day) => day.isCurrentMonth);
      expect(februaryDays).toHaveLength(29); // Leap year February has 29 days
    });
  });
});
