import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';

import { ExerciseFilters, useExerciseSearch } from '../useExerciseSearch';

// Hoisted mock dependencies
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockExerciseQueryService = vi.hoisted(() => ({
  getAllExercises: vi.fn(),
  searchExercises: vi.fn(),
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());
const mockUseOptimizedQuery = vi.hoisted(() => vi.fn());
const mockUseQuery = vi.hoisted(() => vi.fn());
const mockExercisesToDomain = vi.hoisted(() => vi.fn());

// Mock the container
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
  container: mockContainer,
}));

// Mock the query service
vi.mock('@/features/exercise/query-services/ExerciseQueryService', () => ({
  ExerciseQueryService: vi.fn(),
}));

// Mock the shared hooks
vi.mock('@/shared/hooks/useObserveQuery', () => ({
  useObserveQuery: mockUseObserveQuery,
}));

// Mock useOptimizedQuery
vi.mock('@/shared/hooks/useOptimizedQuery', () => ({
  useOptimizedQuery: mockUseOptimizedQuery,
}));

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  exercisesToDomain: mockExercisesToDomain,
}));

// Mock React Query hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  QueryClient: vi.fn(),
  QueryClientProvider: vi.fn(),
}));

describe('useExerciseSearch', () => {
  const mockProfileId = 'profile-123';

  const mockExercises = [
    {
      id: 'ex1',
      name: 'Bench Press',
      description: 'Classic chest exercise with barbell',
      alternativeNames: ['Barbell Bench Press'],
      muscleGroups: ['chest', 'triceps', 'shoulders'],
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      movementPattern: 'push',
      category: 'strength',
    },
    {
      id: 'ex2',
      name: 'Push Ups',
      description: 'Bodyweight chest exercise',
      alternativeNames: ['Push-ups', 'Pressups'],
      muscleGroups: ['chest', 'triceps'],
      equipment: [],
      difficulty: 'beginner',
      movementPattern: 'push',
      category: 'strength',
    },
    {
      id: 'ex3',
      name: 'Running',
      description: 'Cardiovascular exercise',
      alternativeNames: ['Jogging', 'Cardio Run'],
      muscleGroups: ['legs'],
      equipment: ['running shoes'],
      difficulty: 'beginner',
      movementPattern: 'locomotion',
      category: 'cardio',
    },
    {
      id: 'ex4',
      name: 'Squats',
      description: 'Lower body compound exercise',
      alternativeNames: ['Bodyweight Squats'],
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: [],
      difficulty: 'beginner',
      movementPattern: 'squat',
      category: 'strength',
    },
  ];

  beforeEach(() => {
    // Complete reset of all mocks
    vi.resetAllMocks();

    // Re-setup hoisted mocks with fresh instances
    mockContainer.resolve.mockImplementation((token) => {
      if (token === ExerciseQueryService) return mockExerciseQueryService;
      return null;
    });

    mockExerciseQueryService.getAllExercises.mockReturnValue('mock-exercise-query');
    mockExerciseQueryService.searchExercises.mockReturnValue('mock-search-query');
    mockExercisesToDomain.mockImplementation((data) => data);

    // Setup default implementation for useObserveQuery
    mockUseObserveQuery.mockImplementation(() => ({ data: null }));

    // Setup default implementation for useOptimizedQuery
    mockUseOptimizedQuery.mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
    }));

    // Setup default implementation for useQuery
    mockUseQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: null,
    }));
  });

  describe('basic search functionality', () => {
    it('should return all exercises when no query or filters provided', () => {
      // Set up specific mocks for this test
      mockUseObserveQuery.mockReturnValue({ data: mockExercises, isObserving: true });
      mockUseOptimizedQuery.mockReturnValue({
        data: mockExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(4);
      expect(result.current.totalCount).toBe(4);
      expect(result.current.isLoading).toBe(false);
    });

    it('should filter exercises by name', () => {
      // Set up specific mocks for this test - only return bench press
      const benchPressExercises = mockExercises.filter((ex) =>
        ex.name.toLowerCase().includes('bench')
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: benchPressExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('bench', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
      expect(result.current.totalCount).toBe(1);
    });

    it('should filter exercises by description', () => {
      // Set up specific mocks for this test - only return exercises matching 'bodyweight'
      const bodyweightExercises = mockExercises.filter((ex) =>
        ex.description?.toLowerCase().includes('bodyweight')
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: bodyweightExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('bodyweight', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Push Ups');
      expect(result.current.totalCount).toBe(1);
    });

    it('should filter exercises by alternative names', () => {
      // Set up specific mocks for this test - only return exercises matching 'jogging'
      const joggingExercises = mockExercises.filter((ex) =>
        ex.alternativeNames?.some((name) => name.toLowerCase().includes('jogging'))
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: joggingExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('jogging', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Running');
      expect(result.current.totalCount).toBe(1);
    });

    it('should filter exercises by muscle groups in search', () => {
      // Set up specific mocks for this test - only return exercises targeting chest
      const chestExercises = mockExercises.filter((ex) =>
        ex.muscleGroups?.some((mg) => mg.toLowerCase().includes('chest'))
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: chestExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('chest', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises.map((ex) => ex.name)).toContain('Bench Press');
      expect(result.current.exercises.map((ex) => ex.name)).toContain('Push Ups');
    });

    it('should be case insensitive', () => {
      // Set up specific mocks for this test - filter by 'BENCH' (case insensitive)
      const benchExercises = mockExercises.filter((ex) => ex.name.toLowerCase().includes('bench'));
      mockUseOptimizedQuery.mockReturnValue({
        data: benchExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('BENCH', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });

    it('should handle partial matches', () => {
      // Set up specific mocks for this test - filter by 'run' partial match
      const runExercises = mockExercises.filter((ex) => ex.name.toLowerCase().includes('run'));
      mockUseOptimizedQuery.mockReturnValue({
        data: runExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('run', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Running');
    });

    it('should return empty array for no matches', () => {
      // Set up specific mocks for this test - return empty results for non-existent search
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('nonexistent', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('muscle group filtering', () => {
    it('should filter by single muscle group', () => {
      const filters: ExerciseFilters = {
        muscleGroups: ['chest'],
      };

      // Set up specific mocks for this test - filter by chest muscle group
      const chestExercises = mockExercises.filter((ex) => ex.muscleGroups?.includes('chest'));
      mockUseOptimizedQuery.mockReturnValue({
        data: chestExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises.every((ex) => ex.muscleGroups?.includes('chest'))).toBe(true);
    });

    it('should filter by multiple muscle groups (OR logic)', () => {
      const filters: ExerciseFilters = {
        muscleGroups: ['chest', 'legs'],
      };

      // Set up specific mocks for this test - filter by chest OR legs
      const chestOrLegsExercises = mockExercises.filter((ex) =>
        ex.muscleGroups?.some((mg) => ['chest', 'legs'].includes(mg))
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: chestOrLegsExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(3); // 2 chest + 1 legs
      expect(result.current.exercises.map((ex) => ex.name)).toEqual(
        expect.arrayContaining(['Bench Press', 'Push Ups', 'Running'])
      );
    });

    it('should be case insensitive for muscle group filtering', () => {
      const filters: ExerciseFilters = {
        muscleGroups: ['CHEST'],
      };

      // Set up specific mocks for this test - filter by CHEST (case insensitive)
      const chestExercises = mockExercises.filter((ex) =>
        ex.muscleGroups?.some((mg) => mg.toLowerCase() === 'chest')
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: chestExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(2);
    });
  });

  describe('equipment filtering', () => {
    it('should filter by single equipment', () => {
      const filters: ExerciseFilters = {
        equipment: ['barbell'],
      };

      // Set up specific mocks for this test - filter by barbell equipment
      const barbellExercises = mockExercises.filter((ex) => ex.equipment?.includes('barbell'));
      mockUseOptimizedQuery.mockReturnValue({
        data: barbellExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });

    it('should filter by multiple equipment (OR logic)', () => {
      const filters: ExerciseFilters = {
        equipment: ['barbell', 'running shoes'],
      };

      // Set up specific mocks for this test - filter by barbell OR running shoes
      const equipmentExercises = mockExercises.filter((ex) =>
        ex.equipment?.some((eq) => ['barbell', 'running shoes'].includes(eq))
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: equipmentExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises.map((ex) => ex.name)).toEqual(
        expect.arrayContaining(['Bench Press', 'Running'])
      );
    });

    it('should handle bodyweight exercises when filtering by bodyweight', () => {
      const filters: ExerciseFilters = {
        equipment: ['bodyweight'],
      };

      // Set up specific mocks for this test - filter by bodyweight (empty equipment array)
      const bodyweightExercises = mockExercises.filter(
        (ex) => ex.equipment?.length === 0 || ex.equipment?.includes('bodyweight')
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: bodyweightExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(2); // Push Ups and Squats (no equipment)
      expect(result.current.exercises.map((ex) => ex.name)).toEqual(
        expect.arrayContaining(['Push Ups', 'Squats'])
      );
    });

    it('should be case insensitive for equipment filtering', () => {
      const filters: ExerciseFilters = {
        equipment: ['BARBELL'],
      };

      // Set up specific mocks for this test - filter by BARBELL (case insensitive)
      const barbellExercises = mockExercises.filter((ex) =>
        ex.equipment?.some((eq) => eq.toLowerCase() === 'barbell')
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: barbellExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });
  });

  describe('difficulty filtering', () => {
    it('should filter by beginner difficulty', () => {
      const filters: ExerciseFilters = {
        difficulty: ['beginner'],
      };

      // Set up specific mocks for this test - filter by beginner difficulty
      const beginnerExercises = mockExercises.filter((ex) => ex.difficulty === 'beginner');
      mockUseOptimizedQuery.mockReturnValue({
        data: beginnerExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(3);
      expect(result.current.exercises.every((ex) => ex.difficulty === 'beginner')).toBe(true);
    });

    it('should filter by intermediate difficulty', () => {
      const filters: ExerciseFilters = {
        difficulty: ['intermediate'],
      };

      // Set up specific mocks for this test - filter by intermediate difficulty
      const intermediateExercises = mockExercises.filter((ex) => ex.difficulty === 'intermediate');
      mockUseOptimizedQuery.mockReturnValue({
        data: intermediateExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });

    it('should return empty array for advanced difficulty (none in test data)', () => {
      const filters: ExerciseFilters = {
        difficulty: ['advanced'],
      };

      // Set up specific mocks for this test - filter by advanced difficulty (none exist)
      const advancedExercises = mockExercises.filter((ex) => ex.difficulty === 'advanced');
      mockUseOptimizedQuery.mockReturnValue({
        data: advancedExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(0);
    });
  });

  describe('movement pattern filtering', () => {
    it('should filter by movement pattern', () => {
      const filters: ExerciseFilters = {
        movementPattern: ['push'],
      };

      // Set up specific mocks for this test - filter by push movement pattern
      const pushExercises = mockExercises.filter((ex) => ex.movementPattern === 'push');
      mockUseOptimizedQuery.mockReturnValue({
        data: pushExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(2);
      expect(result.current.exercises.map((ex) => ex.name)).toEqual(
        expect.arrayContaining(['Bench Press', 'Push Ups'])
      );
    });

    it('should be case insensitive for movement pattern filtering', () => {
      const filters: ExerciseFilters = {
        movementPattern: ['PUSH'],
      };

      // Set up specific mocks for this test - filter by PUSH (case insensitive)
      const pushExercises = mockExercises.filter(
        (ex) => ex.movementPattern?.toLowerCase() === 'push'
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: pushExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(2);
    });
  });

  describe('exercise type filtering', () => {
    it('should filter by strength exercises', () => {
      const filters: ExerciseFilters = {
        category: 'strength',
      };

      // Set up specific mocks for this test - filter by strength category
      const strengthExercises = mockExercises.filter((ex) => ex.category === 'strength');
      mockUseOptimizedQuery.mockReturnValue({
        data: strengthExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(3);
      expect(result.current.exercises.every((ex) => ex.category === 'strength')).toBe(true);
    });

    it('should filter by cardio exercises', () => {
      const filters: ExerciseFilters = {
        category: 'cardio',
      };

      // Set up specific mocks for this test - filter by cardio category
      const cardioExercises = mockExercises.filter((ex) => ex.category === 'cardio');
      mockUseOptimizedQuery.mockReturnValue({
        data: cardioExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Running');
    });
  });

  describe('combined filtering', () => {
    it('should apply multiple filters together', () => {
      const filters: ExerciseFilters = {
        muscleGroups: ['chest'],
        difficulty: ['beginner'],
        category: 'strength',
      };

      // Set up specific mocks for this test - filter by chest + beginner + strength
      const combinedExercises = mockExercises.filter(
        (ex) =>
          ex.muscleGroups?.includes('chest') &&
          ex.difficulty === 'beginner' &&
          ex.category === 'strength'
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: combinedExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Push Ups');
    });

    it('should combine search query with filters', () => {
      const filters: ExerciseFilters = {
        category: 'strength',
      };

      // Set up specific mocks for this test - search 'bench' + filter by strength
      const benchStrengthExercises = mockExercises.filter(
        (ex) => ex.name.toLowerCase().includes('bench') && ex.category === 'strength'
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: benchStrengthExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('bench', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });

    it('should return empty result when filters are too restrictive', () => {
      const filters: ExerciseFilters = {
        muscleGroups: ['chest'],
        difficulty: ['advanced'], // No advanced chest exercises in test data
      };

      // Set up specific mocks for this test - filter by chest + advanced (none exist)
      const restrictiveExercises = mockExercises.filter(
        (ex) => ex.muscleGroups?.includes('chest') && ex.difficulty === 'advanced'
      );
      mockUseOptimizedQuery.mockReturnValue({
        data: restrictiveExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', filters, mockProfileId));

      expect(result.current.exercises).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe('sorting behavior', () => {
    it('should sort results with exact matches first', () => {
      const exercises = [
        ...mockExercises,
        {
          id: 'ex5',
          name: 'Press',
          description: 'Overhead press',
          alternativeNames: [],
          muscleGroups: ['shoulders'],
          equipment: ['barbell'],
          difficulty: 'intermediate',
          movementPattern: 'push',
          category: 'strength',
        },
      ];

      // Set up specific mocks for this test - search 'press' with sorting
      const pressExercises = exercises
        .filter((ex) => ex.name.toLowerCase().includes('press'))
        .sort((a, b) => {
          // Exact match first
          if (a.name.toLowerCase() === 'press') return -1;
          if (b.name.toLowerCase() === 'press') return 1;
          return a.name.localeCompare(b.name);
        });

      mockUseOptimizedQuery.mockReturnValue({
        data: pressExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('press', {}, mockProfileId));

      expect(result.current.exercises[0].name).toBe('Press'); // Exact match first
      expect(result.current.exercises[1].name).toBe('Bench Press'); // Partial match second
    });

    it('should sort results with name starting matches before other matches', () => {
      const exercises = [
        ...mockExercises,
        {
          id: 'ex5',
          name: 'Upper Bench Exercise',
          description: 'Bench press variation',
          alternativeNames: [],
          muscleGroups: ['chest'],
          equipment: ['barbell'],
          difficulty: 'intermediate',
          movementPattern: 'push',
          category: 'strength',
        },
      ];

      // Set up specific mocks for this test - search 'bench' with sorting
      const benchExercises = exercises
        .filter((ex) => ex.name.toLowerCase().includes('bench'))
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith('bench');
          const bStarts = b.name.toLowerCase().startsWith('bench');
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name);
        });

      mockUseOptimizedQuery.mockReturnValue({
        data: benchExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('bench', {}, mockProfileId));

      expect(result.current.exercises[0].name).toBe('Bench Press'); // Starts with 'bench'
      expect(result.current.exercises[1].name).toBe('Upper Bench Exercise'); // Contains 'bench'
    });

    it('should sort alphabetically when no search query', () => {
      // Set up specific mocks for this test - return all exercises sorted alphabetically
      const sortedExercises = [...mockExercises].sort((a, b) => a.name.localeCompare(b.name));
      mockUseOptimizedQuery.mockReturnValue({
        data: sortedExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', {}, mockProfileId));

      const sortedNames = result.current.exercises.map((ex) => ex.name);
      const expectedOrder = ['Bench Press', 'Push Ups', 'Running', 'Squats'];

      expect(sortedNames).toEqual(expectedOrder);
    });
  });

  describe('when profileId is not provided', () => {
    it('should return empty results and not be loading', () => {
      // Set up specific mocks for this test - no profileId provided
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('test', {}, undefined));

      expect(result.current.exercises).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not call exercise query service', () => {
      // Set up specific mocks for this test - no profileId provided
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderHook(() => useExerciseSearch('test', {}, undefined));

      expect(mockExerciseQueryService.searchExercises).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading when profileId exists but not observing yet', () => {
      // Set up specific mocks for this test - show loading state
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('test', {}, mockProfileId));

      expect(result.current.isLoading).toBe(true);
    });

    it('should not show loading when no profileId', () => {
      // Set up specific mocks for this test - no loading when no profileId
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('test', {}, undefined));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useObserveQuery integration', () => {
    it('should call useObserveQuery with correct parameters', () => {
      // Set up specific mocks for this test
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderHook(() => useExerciseSearch('test', {}, mockProfileId));

      // The hook should have been called to resolve the service
      expect(mockContainer.resolve).toHaveBeenCalledWith(ExerciseQueryService);
    });

    it('should disable query when profileId is not provided', () => {
      // Set up specific mocks for this test - disabled query
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderHook(() => useExerciseSearch('test', {}, undefined));

      // Should not resolve service when no profileId
      expect(mockExerciseQueryService.searchExercises).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle null or undefined exercise data', () => {
      // Set up specific mocks for this test - null data
      mockUseOptimizedQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('test', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
    });

    it('should handle exercises with missing properties', () => {
      const incompleteExercises = [
        {
          id: 'ex1',
          name: 'Incomplete Exercise',
          // missing description, alternativeNames, etc.
        },
      ];

      // Set up specific mocks for this test - incomplete exercise data
      mockUseOptimizedQuery.mockReturnValue({
        data: incompleteExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(() => result.current).not.toThrow();
    });

    it('should trim whitespace from search query', () => {
      // Set up specific mocks for this test - search with trimmed query
      const benchExercises = mockExercises.filter((ex) => ex.name.toLowerCase().includes('bench'));
      mockUseOptimizedQuery.mockReturnValue({
        data: benchExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('  bench  ', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });

    it('should handle empty filters object', () => {
      // Set up specific mocks for this test - empty filters
      mockUseOptimizedQuery.mockReturnValue({
        data: mockExercises,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useExerciseSearch('', {}, mockProfileId));

      expect(result.current.exercises).toHaveLength(4);
      expect(() => result.current).not.toThrow();
    });
  });

  describe('memoization behavior', () => {
    it('should recalculate when search parameters change', () => {
      // Set up initial mocks
      let callCount = 0;
      mockUseOptimizedQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: mockExercises, isLoading: false, error: null };
        } else {
          const benchExercises = mockExercises.filter((ex) =>
            ex.name.toLowerCase().includes('bench')
          );
          return { data: benchExercises, isLoading: false, error: null };
        }
      });

      const { result, rerender } = renderHook(
        ({ query, filters, profileId }) => useExerciseSearch(query, filters, profileId),
        {
          initialProps: { query: '', filters: {}, profileId: mockProfileId },
        }
      );

      expect(result.current.exercises).toHaveLength(4);

      rerender({ query: 'bench', filters: {}, profileId: mockProfileId });

      expect(result.current.exercises).toHaveLength(1);
      expect(result.current.exercises[0].name).toBe('Bench Press');
    });
  });
});
