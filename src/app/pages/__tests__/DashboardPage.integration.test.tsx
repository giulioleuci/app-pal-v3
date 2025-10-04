import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/shared/locales';

import { DashboardPage } from '../DashboardPage';

// Mock the useActiveProfileId hook
const mockUseActiveProfileId = vi.hoisted(() => vi.fn());

// Mock the useDashboardHub hook
const mockUseDashboardHub = vi.hoisted(() => vi.fn());

// Mock the usePageTitle hook
const mockUsePageTitle = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useActiveProfileId', () => ({
  useActiveProfileId: mockUseActiveProfileId,
}));

vi.mock('@/features/dashboard/hooks/useDashboardHub', () => ({
  useDashboardHub: mockUseDashboardHub,
}));

vi.mock('@/app/hooks/usePageTitle', () => ({
  usePageTitle: mockUsePageTitle,
}));

// Test data
let queryClient: QueryClient;
const testProfileId = 'profile-123';

// Mock dashboard metrics
const mockMetrics = {
  totalWorkouts: 45,
  workoutsThisWeek: 3,
  workoutsThisMonth: 12,
  currentStreak: 7,
  longestStreak: 14,
  totalPersonalRecords: 8,
  personalRecordsThisMonth: 2,
  averageWorkoutDuration: 65,
  totalVolume: 125000,
  volumeThisMonth: 32000,
  averageIntensity: 7.5,
};

// Mock recent activity
const mockRecentActivity = {
  recentWorkouts: [
    {
      id: 'workout-1',
      name: 'Push Day',
      startTime: new Date('2025-09-29T10:00:00'),
      duration: 65,
      totalVolume: 4500,
      exerciseCount: 6,
    },
    {
      id: 'workout-2',
      name: 'Pull Day',
      startTime: new Date('2025-09-27T10:00:00'),
      duration: 70,
      totalVolume: 5200,
      exerciseCount: 7,
    },
    {
      id: 'workout-3',
      name: 'Leg Day',
      startTime: new Date('2025-09-25T10:00:00'),
      duration: 80,
      totalVolume: 6800,
      exerciseCount: 8,
    },
  ],
  recentPersonalRecords: [
    {
      id: 'pr-1',
      exerciseName: 'Bench Press',
      weight: 100,
      date: new Date('2025-09-29'),
      previousBest: 95,
    },
    {
      id: 'pr-2',
      exerciseName: 'Squat',
      weight: 140,
      date: new Date('2025-09-25'),
      previousBest: 135,
    },
  ],
};

// Mock progress trends
const mockProgressTrends = {
  frequencyTrend: {
    trend: 'increasing' as const,
    changePercentage: 15,
    lastThreeMonths: [10, 11, 12],
  },
  strengthProgress: {
    exercisesImproving: 5,
    exercisesStagnant: 2,
    exercisesRegressing: 0,
    topGainers: [
      {
        exerciseName: 'Bench Press',
        improvement: 10,
        currentBest: 100,
      },
    ],
  },
  volumeTrend: {
    trend: 'stable' as const,
    changePercentage: 2,
    lastSixWeeks: [28000, 29000, 30000, 31000, 32000, 32000],
  },
  bodyWeightTrend: {
    trend: 'increasing' as const,
    changeKg: 2.5,
    currentWeight: 82.5,
    previousWeight: 80,
  },
  needsMaxLogUpdate: false,
};

// Mock streak data
const mockStreak = {
  currentStreak: 7,
  longestStreak: 14,
  lastWorkoutDate: new Date('2025-09-29'),
};

// Mock weekly performance
const mockWeeklyPerformance = {
  workoutsCompleted: 3,
  targetWorkouts: 4,
  completionRate: 0.75,
  totalVolume: 5000,
  averageIntensity: 7.5,
  improvement: {
    volume: 8,
    frequency: 0,
  },
};

// Mock insights
const mockInsights = {
  message: "Amazing! You're on a 7-day workout streak! Keep the momentum going.",
  type: 'achievement' as const,
  actionable: true,
  action: "Log today's workout to continue your streak",
};

// Mock quick actions
const mockQuickActions = [
  {
    id: 'start-workout',
    title: 'Start Workout',
    description: 'Begin a new training session',
    priority: 1,
    category: 'workout',
  },
  {
    id: 'log-weight',
    title: 'Log Weight',
    description: 'Record your current weight',
    priority: 2,
    category: 'metrics',
  },
  {
    id: 'repeat-last',
    title: 'Repeat Last Workout',
    description: 'Do the same workout as last time',
    priority: 1,
    category: 'workout',
  },
];

// Test wrapper component
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>{children}</BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('DashboardPage Integration Tests', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Setup default mock returns
    mockUseActiveProfileId.mockReturnValue(testProfileId);
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeletons when dashboard is loading', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: true,
        data: undefined,
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const loadingElement = screen.getByTestId('dashboard-overview-loading');
      expect(loadingElement).toBeInTheDocument();

      // Check that the main dashboard page is rendered
      const dashboardPage = screen.getByTestId('dashboard-page');
      expect(dashboardPage).toBeInTheDocument();
    });

    it('should render page header even when loading', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: true,
        data: undefined,
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const pageHeader = screen.getByTestId('dashboard-page-header');
      expect(pageHeader).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error display when there is a dashboard error', () => {
      // Arrange
      const testError = new Error('Failed to load dashboard');
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: undefined,
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: true,
        error: testError,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const errorDisplay = screen.getByTestId('dashboard-page-error');
      expect(errorDisplay).toBeInTheDocument();

      // Main dashboard content should not be rendered
      expect(screen.queryByTestId('dashboard-overview')).not.toBeInTheDocument();
    });

    it('should not render the dashboard overview when there is an error', () => {
      // Arrange
      const testError = new Error('Network error');
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: true,
        error: testError,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-page-error')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-overview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-metrics')).not.toBeInTheDocument();
    });
  });

  describe('Data State with Full Dashboard', () => {
    it('should render dashboard overview with complete data', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const dashboardOverview = screen.getByTestId('dashboard-overview');
      expect(dashboardOverview).toBeInTheDocument();

      // Verify main dashboard page is rendered
      const dashboardPage = screen.getByTestId('dashboard-page');
      expect(dashboardPage).toBeInTheDocument();
    });

    it('should render all dashboard sections with complete data', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-streak')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-recent-activity')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-insights')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-quick-actions')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-weekly-performance')).toBeInTheDocument();
    });

    it('should display correct metrics values', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const metricsSection = screen.getByTestId('dashboard-metrics');
      expect(metricsSection).toBeInTheDocument();
      expect(metricsSection).toHaveTextContent('45'); // totalWorkouts
      expect(metricsSection).toHaveTextContent('3'); // workoutsThisWeek
      expect(metricsSection).toHaveTextContent('7'); // currentStreak
      expect(metricsSection).toHaveTextContent('8'); // totalPersonalRecords
    });

    it('should display correct streak information', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const streakSection = screen.getByTestId('dashboard-streak');
      expect(streakSection).toBeInTheDocument();
      expect(streakSection).toHaveTextContent('7'); // currentStreak
      expect(streakSection).toHaveTextContent('14'); // longestStreak in the translation
    });

    it('should display insights message', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const insightsSection = screen.getByTestId('dashboard-insights');
      expect(insightsSection).toBeInTheDocument();
      expect(insightsSection).toHaveTextContent(mockInsights.message);
      expect(insightsSection).toHaveTextContent(mockInsights.action!);
    });

    it('should display quick actions', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const quickActionsSection = screen.getByTestId('dashboard-quick-actions');
      expect(quickActionsSection).toBeInTheDocument();

      // Check for specific quick actions
      expect(screen.getByTestId('dashboard-quick-action-start-workout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-quick-action-log-weight')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-quick-action-repeat-last')).toBeInTheDocument();
    });

    it('should display weekly performance summary', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const weeklyPerformanceSection = screen.getByTestId('dashboard-weekly-performance');
      expect(weeklyPerformanceSection).toBeInTheDocument();
      expect(weeklyPerformanceSection).toHaveTextContent('3/4'); // workoutsCompleted/targetWorkouts
      expect(weeklyPerformanceSection).toHaveTextContent('75%'); // completionRate
      expect(weeklyPerformanceSection).toHaveTextContent('5000kg'); // totalVolume
    });

    it('should display recent workouts', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const recentActivitySection = screen.getByTestId('dashboard-recent-activity');
      expect(recentActivitySection).toBeInTheDocument();

      // Check for workout items
      const workoutItems = screen.getAllByTestId('dashboard-workout-item');
      expect(workoutItems.length).toBe(3);
    });
  });

  describe('Data State with Partial Data', () => {
    it('should render dashboard with only metrics data', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: undefined,
          progressTrends: undefined,
        },
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();

      // Other sections should not be rendered
      expect(screen.queryByTestId('dashboard-streak')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-recent-activity')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-insights')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-quick-actions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-weekly-performance')).not.toBeInTheDocument();
    });

    it('should render dashboard with metrics and streak only', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: undefined,
          progressTrends: undefined,
        },
        streak: mockStreak,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-streak')).toBeInTheDocument();

      // Other sections should not be rendered
      expect(screen.queryByTestId('dashboard-recent-activity')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-insights')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-quick-actions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-weekly-performance')).not.toBeInTheDocument();
    });

    it('should handle empty recent activity gracefully', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: {
            recentWorkouts: [],
            recentPersonalRecords: [],
          },
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-streak')).toBeInTheDocument();

      // Recent activity should not be rendered when workouts array is empty
      expect(screen.queryByTestId('dashboard-recent-activity')).not.toBeInTheDocument();
    });

    it('should handle empty quick actions gracefully', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: [],
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();

      // Quick actions should not be rendered when array is empty
      expect(screen.queryByTestId('dashboard-quick-actions')).not.toBeInTheDocument();
    });
  });

  describe('No Active Profile', () => {
    it('should render error message when there is no active profile', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: undefined,
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const noProfileError = screen.getByTestId('dashboard-page-no-profile');
      expect(noProfileError).toBeInTheDocument();

      // Main dashboard content should not be rendered
      expect(screen.queryByTestId('dashboard-overview')).not.toBeInTheDocument();
    });

    it('should not render dashboard overview when there is no active profile', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-page-no-profile')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-overview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-metrics')).not.toBeInTheDocument();
    });

    it('should render page header even when there is no active profile', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: undefined,
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const pageHeader = screen.getByTestId('dashboard-page-header');
      expect(pageHeader).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useActiveProfileId hook', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUseActiveProfileId).toHaveBeenCalled();
    });

    it('should call useDashboardHub hook', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUseDashboardHub).toHaveBeenCalled();
    });

    it('should call usePageTitle hook with correct parameters', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUsePageTitle).toHaveBeenCalledWith('dashboard', expect.any(String));
    });
  });

  describe('Component Structure', () => {
    it('should render all main structural elements when data is loaded', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: false,
        data: {
          metrics: mockMetrics,
          recentActivity: mockRecentActivity,
          progressTrends: mockProgressTrends,
        },
        streak: mockStreak,
        weeklyPerformance: mockWeeklyPerformance,
        insights: mockInsights,
        quickActions: mockQuickActions,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page-header')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
    });

    it('should maintain consistent layout structure across loading state', () => {
      // Arrange
      mockUseDashboardHub.mockReturnValue({
        isLoadingEnhanced: true,
        data: undefined,
        streak: undefined,
        weeklyPerformance: undefined,
        insights: undefined,
        quickActions: undefined,
        isError: false,
        error: null,
      });

      // Act
      render(<DashboardPage />, { wrapper: createWrapper() });

      // Assert
      const dashboardPage = screen.getByTestId('dashboard-page');
      expect(dashboardPage).toBeInTheDocument();

      // The page should always have a header
      const pageHeader = screen.getByTestId('dashboard-page-header');
      expect(pageHeader).toBeInTheDocument();
    });
  });
});
