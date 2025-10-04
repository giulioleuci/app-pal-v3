import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrainingCycleModel, TrainingPlanModel } from '@/features/training-plan/domain';
import i18n from '@/shared/locales';

import { PlansPage } from '../PlansPage';

// Mock the useActiveProfileId hook
const mockUseActiveProfileId = vi.hoisted(() => vi.fn());

// Mock the useTrainingPlanManager hook
const mockUseTrainingPlanManager = vi.hoisted(() => vi.fn());

// Mock the useNavigate hook
const mockNavigate = vi.hoisted(() => vi.fn());

// Mock the useSnackbar hook
const mockShowSuccess = vi.hoisted(() => vi.fn());
const mockShowError = vi.hoisted(() => vi.fn());

// Mock the usePageTitle hook
const mockUsePageTitle = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useActiveProfileId', () => ({
  useActiveProfileId: mockUseActiveProfileId,
}));

vi.mock('@/features/training-plan/hooks/useTrainingPlanManager', () => ({
  useTrainingPlanManager: mockUseTrainingPlanManager,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/app/providers/SnackbarProvider', () => ({
  useSnackbar: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

vi.mock('@/app/hooks/usePageTitle', () => ({
  usePageTitle: mockUsePageTitle,
}));

// Test data
let queryClient: QueryClient;
const testProfileId = 'profile-123';

const mockTrainingPlan: TrainingPlanModel = {
  id: 'plan-1',
  profileId: testProfileId,
  name: 'Push-Pull-Legs',
  description: 'A classic 6-day training split',
  sessions: [],
  isArchived: false,
  currentSessionIndex: 0,
  cycleId: 'cycle-1',
  order: 1,
  lastUsed: new Date('2024-01-15'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  clone: vi.fn(),
  toPlainObject: vi.fn(),
  validate: vi.fn(),
  cloneWithUpdatedDetails: vi.fn(),
  cloneWithAddedSession: vi.fn(),
  cloneWithRemovedSession: vi.fn(),
  cloneWithReorderedSession: vi.fn(),
  cloneWithReplacedSession: vi.fn(),
  cloneAsArchived: vi.fn(),
  cloneAsUnarchived: vi.fn(),
  cloneWithAssignedCycle: vi.fn(),
  cloneWithRemovedCycle: vi.fn(),
  cloneWithUpdatedOrderInCycle: vi.fn(),
  cloneWithProgressedSession: vi.fn(),
  cloneAsUsed: vi.fn(),
  findSessionById: vi.fn(),
  getCurrentSession: vi.fn(),
  getTotalSessions: vi.fn(() => 6),
  getDeloadSessionCount: vi.fn(() => 0),
  estimateTotalDurationMinutes: vi.fn(() => ({ min: 60, max: 90 })),
} as unknown as TrainingPlanModel;

const mockTrainingPlan2: TrainingPlanModel = {
  id: 'plan-2',
  profileId: testProfileId,
  name: 'Upper-Lower',
  description: 'A 4-day training split',
  sessions: [],
  isArchived: false,
  currentSessionIndex: 0,
  cycleId: 'cycle-1',
  order: 2,
  lastUsed: new Date('2024-01-10'),
  createdAt: new Date('2023-12-15'),
  updatedAt: new Date('2024-01-10'),
  clone: vi.fn(),
  toPlainObject: vi.fn(),
  validate: vi.fn(),
  cloneWithUpdatedDetails: vi.fn(),
  cloneWithAddedSession: vi.fn(),
  cloneWithRemovedSession: vi.fn(),
  cloneWithReorderedSession: vi.fn(),
  cloneWithReplacedSession: vi.fn(),
  cloneAsArchived: vi.fn(),
  cloneAsUnarchived: vi.fn(),
  cloneWithAssignedCycle: vi.fn(),
  cloneWithRemovedCycle: vi.fn(),
  cloneWithUpdatedOrderInCycle: vi.fn(),
  cloneWithProgressedSession: vi.fn(),
  cloneAsUsed: vi.fn(),
  findSessionById: vi.fn(),
  getCurrentSession: vi.fn(),
  getTotalSessions: vi.fn(() => 4),
  getDeloadSessionCount: vi.fn(() => 0),
  estimateTotalDurationMinutes: vi.fn(() => ({ min: 45, max: 75 })),
} as unknown as TrainingPlanModel;

const mockTrainingCycle: TrainingCycleModel = {
  id: 'cycle-1',
  profileId: testProfileId,
  name: 'Strength Building Phase',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
  goal: 'strength' as const,
  notes: 'Focus on progressive overload',
  createdAt: new Date('2023-12-20'),
  updatedAt: new Date('2024-01-01'),
  clone: vi.fn(),
  toPlainObject: vi.fn(),
  validate: vi.fn(),
  getDurationInDays: vi.fn(() => 90),
  getDurationInWeeks: vi.fn(() => 13),
  isActive: vi.fn(() => true),
  isCompleted: vi.fn(() => false),
  isFuture: vi.fn(() => false),
  getCompletionPercentage: vi.fn(() => 30),
  getRemainingDays: vi.fn(() => 63),
  getElapsedDays: vi.fn(() => 27),
  cloneWithUpdatedDetails: vi.fn(),
  cloneWithNewDates: vi.fn(),
  cloneWithExtendedDuration: vi.fn(),
  cloneWithShiftedDates: vi.fn(),
  getAssociatedPlans: vi.fn(),
  getTotalSessionCount: vi.fn(() => 10),
  getWeeklySessionFrequency: vi.fn(() => 5),
  findPlansByDayOfWeek: vi.fn(),
} as unknown as TrainingCycleModel;

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

// Mock mutation objects
const createMockMutation = (isPending = false) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  reset: vi.fn(),
});

describe('PlansPage Integration Tests', () => {
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
    it('should render loading skeletons when plans are loading', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: true,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const loadingElement = screen.getByTestId('plans-page-list-loading');
      expect(loadingElement).toBeInTheDocument();

      // Check for skeleton elements
      const skeletons = screen.getAllByTestId(/plans-page-list-skeleton-/);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render loading skeletons when cycles are loading', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: true,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const loadingElement = screen.getByTestId('plans-page-list-loading');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should render loading skeletons when both plans and cycles are loading', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: true,
        isLoadingCycles: true,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const loadingElement = screen.getByTestId('plans-page-list-loading');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error display when there is a plan error', () => {
      // Arrange
      const testError = new Error('Failed to load training plans');
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: testError,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const errorDisplay = screen.getByTestId('error-display-component');
      expect(errorDisplay).toBeInTheDocument();
      expect(screen.queryByTestId('plans-page')).not.toBeInTheDocument();
    });

    it('should not render the main page content when there is an error', () => {
      // Arrange
      const testError = new Error('Network error');
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [mockTrainingPlan],
        cycles: [mockTrainingCycle],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: testError,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('error-display-component')).toBeInTheDocument();
      expect(screen.queryByTestId('plans-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('plans-page-list')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when there are no plans', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const mainPage = screen.getByTestId('plans-page');
      expect(mainPage).toBeInTheDocument();

      // The empty state would be rendered within the TrainingPlanList component
      const trainingPlanList = screen.getByTestId('plans-page-list');
      expect(trainingPlanList).toBeInTheDocument();
    });

    it('should render page header even when there are no plans', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const pageHeader = screen.getByTestId('page-header-component');
      expect(pageHeader).toBeInTheDocument();
    });

    it('should render floating action button when there are no plans', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const createFab = screen.getByTestId('plans-page-create-fab');
      expect(createFab).toBeInTheDocument();
    });
  });

  describe('Data State', () => {
    it('should render training plan list with data when plans are available', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [mockTrainingPlan, mockTrainingPlan2],
        cycles: [mockTrainingCycle],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const mainPage = screen.getByTestId('plans-page');
      expect(mainPage).toBeInTheDocument();

      const trainingPlanList = screen.getByTestId('plans-page-list');
      expect(trainingPlanList).toBeInTheDocument();

      // Verify page header is rendered
      const pageHeader = screen.getByTestId('page-header-component');
      expect(pageHeader).toBeInTheDocument();

      // Verify FAB is rendered
      const createFab = screen.getByTestId('plans-page-create-fab');
      expect(createFab).toBeInTheDocument();
    });

    it('should pass correct props to TrainingPlanList component', () => {
      // Arrange
      const plans = [mockTrainingPlan, mockTrainingPlan2];
      const cycles = [mockTrainingCycle];
      mockUseTrainingPlanManager.mockReturnValue({
        plans,
        cycles,
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const trainingPlanList = screen.getByTestId('plans-page-list');
      expect(trainingPlanList).toBeInTheDocument();
      // Note: We can't directly inspect props in this test, but we verify the component is rendered
      // The actual prop validation would happen in the TrainingPlanList component tests
    });

    it('should render with plans but no cycles', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [mockTrainingPlan],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const mainPage = screen.getByTestId('plans-page');
      expect(mainPage).toBeInTheDocument();

      const trainingPlanList = screen.getByTestId('plans-page-list');
      expect(trainingPlanList).toBeInTheDocument();
    });
  });

  describe('No Active Profile', () => {
    it('should render error message when there is no active profile', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const noProfileError = screen.getByTestId('error-display-component');
      expect(noProfileError).toBeInTheDocument();
      expect(screen.queryByTestId('plans-page')).not.toBeInTheDocument();
    });

    it('should not render main content when there is no active profile', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [mockTrainingPlan],
        cycles: [mockTrainingCycle],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('error-display-component')).toBeInTheDocument();
      expect(screen.queryByTestId('plans-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('plans-page-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('plans-page-create-fab')).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useActiveProfileId hook', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUseActiveProfileId).toHaveBeenCalled();
    });

    it('should call useTrainingPlanManager with active profile ID', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenCalledWith(testProfileId);
    });

    it('should call useTrainingPlanManager with empty string when no profile', () => {
      // Arrange
      mockUseActiveProfileId.mockReturnValue(null);
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUseTrainingPlanManager).toHaveBeenCalledWith('');
    });

    it('should call usePageTitle hook with correct parameters', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(mockUsePageTitle).toHaveBeenCalledWith('plans', expect.any(String));
    });
  });

  describe('Component Structure', () => {
    it('should render all main structural elements when data is loaded', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [mockTrainingPlan],
        cycles: [mockTrainingCycle],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByTestId('plans-page')).toBeInTheDocument();
      expect(screen.getByTestId('page-header-component')).toBeInTheDocument();
      expect(screen.getByTestId('plans-page-list')).toBeInTheDocument();
      expect(screen.getByTestId('plans-page-create-fab')).toBeInTheDocument();
    });

    it('should maintain consistent layout structure across all states', () => {
      // Arrange
      mockUseTrainingPlanManager.mockReturnValue({
        plans: [],
        cycles: [],
        isLoadingPlans: false,
        isLoadingCycles: false,
        planError: null,
        cycleError: null,
        plan: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
          archive: createMockMutation(),
        },
        cycle: {
          create: createMockMutation(),
          update: createMockMutation(),
          delete: createMockMutation(),
        },
      });

      // Act
      render(<PlansPage />, { wrapper: createWrapper() });

      // Assert
      const mainPage = screen.getByTestId('plans-page');
      expect(mainPage).toBeInTheDocument();

      // The page should always have a header
      const pageHeader = screen.getByTestId('page-header-component');
      expect(pageHeader).toBeInTheDocument();
    });
  });
});
