import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExerciseInstructions } from '../useExerciseInstructions';

// Hoisted mock dependencies
const mockContainer = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

const mockExerciseQueryService = vi.hoisted(() => ({
  getExerciseById: vi.fn(),
}));

const mockUseObserveQuery = vi.hoisted(() => vi.fn());
const mockExercisesToDomain = vi.hoisted(() => vi.fn());

// Mock the container
vi.mock('tsyringe', () => ({
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

// Mock transformations
vi.mock('@/shared/utils/transformations', () => ({
  exercisesToDomain: mockExercisesToDomain,
}));

describe('useExerciseInstructions', () => {
  const mockExerciseId = 'exercise-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockContainer.resolve.mockReturnValue(mockExerciseQueryService);
    mockExerciseQueryService.getExerciseById.mockReturnValue('mock-query');
    mockExercisesToDomain.mockImplementation((data) => data);
  });

  describe('when exerciseId is provided', () => {
    it('should return default instruction data when no exercise is found', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current).toEqual({
        instructions: [],
        tips: [],
        commonMistakes: [],
        musclesTargeted: [],
        setupSteps: [],
      });
    });

    it('should return default instruction data when exercise array is empty', () => {
      mockUseObserveQuery.mockReturnValue({ data: [] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current).toEqual({
        instructions: [],
        tips: [],
        commonMistakes: [],
        musclesTargeted: [],
        setupSteps: [],
      });
    });

    it('should parse exercise instructions correctly', () => {
      const mockExercise = {
        instructions:
          'Stand with feet shoulder-width apart\nLower your body by bending knees\nReturn to starting position',
        tips: 'Keep your back straight\nEngage your core throughout',
        commonMistakes: 'Allowing knees to cave inward\nNot going deep enough',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        setupInstructions: 'Position feet correctly\nAdjust stance as needed',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current).toEqual({
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body by bending knees',
          'Return to starting position',
        ],
        tips: ['Keep your back straight', 'Engage your core throughout'],
        commonMistakes: ['Allowing knees to cave inward', 'Not going deep enough'],
        musclesTargeted: ['quadriceps', 'glutes', 'hamstrings'],
        setupSteps: ['Position feet correctly', 'Adjust stance as needed'],
      });
    });

    it('should handle numbered list instructions', () => {
      const mockExercise = {
        instructions:
          '1. Grip the bar with hands shoulder-width apart\n2. Pull your chest to the bar\n3. Lower back down with control',
        tips: '',
        commonMistakes: '',
        muscleGroups: ['lats', 'biceps'],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual([
        'Grip the bar with hands shoulder-width apart',
        'Pull your chest to the bar',
        'Lower back down with control',
      ]);
    });

    it('should handle bullet point instructions', () => {
      const mockExercise = {
        instructions:
          '• Place hands on the floor\n• Step back into plank position\n• Lower chest to ground\n• Push back up',
        tips: "- Keep your body straight\n- Don't let hips sag",
        commonMistakes: '* Arching back too much\n* Not going low enough',
        muscleGroups: ['chest', 'triceps'],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual([
        'Place hands on the floor',
        'Step back into plank position',
        'Lower chest to ground',
        'Push back up',
      ]);
      expect(result.current.tips).toEqual(['Keep your body straight', "Don't let hips sag"]);
      expect(result.current.commonMistakes).toEqual([
        'Arching back too much',
        'Not going low enough',
      ]);
    });

    it('should handle single line instructions', () => {
      const mockExercise = {
        instructions: 'Run at a steady pace for the designated distance',
        tips: 'Maintain consistent breathing',
        commonMistakes: 'Starting too fast',
        muscleGroups: ['cardio'],
        setupInstructions: 'Wear appropriate running shoes',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual([
        'Run at a steady pace for the designated distance',
      ]);
      expect(result.current.tips).toEqual(['Maintain consistent breathing']);
      expect(result.current.commonMistakes).toEqual(['Starting too fast']);
      expect(result.current.setupSteps).toEqual(['Wear appropriate running shoes']);
    });

    it('should handle empty or null instruction fields', () => {
      const mockExercise = {
        instructions: '',
        tips: null,
        commonMistakes: undefined,
        muscleGroups: ['chest'],
        setupInstructions: '   ', // whitespace only
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current).toEqual({
        instructions: [],
        tips: [],
        commonMistakes: [],
        musclesTargeted: ['chest'],
        setupSteps: [],
      });
    });

    it('should handle missing muscle groups', () => {
      const mockExercise = {
        instructions: 'Perform the exercise',
        tips: '',
        commonMistakes: '',
        muscleGroups: null,
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.musclesTargeted).toEqual([]);
    });
  });

  describe('when exerciseId is empty or null', () => {
    it('should return default instruction data when exerciseId is empty string', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useExerciseInstructions(''));

      expect(result.current).toEqual({
        instructions: [],
        tips: [],
        commonMistakes: [],
        musclesTargeted: [],
        setupSteps: [],
      });

      expect(mockExerciseQueryService.getExerciseById).not.toHaveBeenCalled();
    });

    it('should handle null exerciseId gracefully', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      const { result } = renderHook(() => useExerciseInstructions(null as any));

      expect(result.current).toEqual({
        instructions: [],
        tips: [],
        commonMistakes: [],
        musclesTargeted: [],
        setupSteps: [],
      });
    });
  });

  describe('useObserveQuery integration', () => {
    it('should call useObserveQuery with correct parameters', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(mockUseObserveQuery).toHaveBeenCalledWith('mock-query', {
        transform: mockExercisesToDomain,
        enabled: true,
      });
    });

    it('should disable query when exerciseId is not provided', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useExerciseInstructions(''));

      expect(mockUseObserveQuery).toHaveBeenCalledWith(null, {
        transform: mockExercisesToDomain,
        enabled: false,
      });
    });

    it('should call exercise query service with correct exerciseId', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(mockExerciseQueryService.getExerciseById).toHaveBeenCalledWith(mockExerciseId);
    });
  });

  describe('instruction text parsing', () => {
    describe('numbered lists', () => {
      it('should parse numbered lists correctly', () => {
        const mockExercise = {
          instructions: '1. First step\n2. Second step\n3. Third step',
          tips: '',
          commonMistakes: '',
          muscleGroups: [],
          setupInstructions: '',
        };

        mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

        const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

        expect(result.current.instructions).toEqual(['First step', 'Second step', 'Third step']);
      });

      it('should handle numbered lists with extra spacing', () => {
        const mockExercise = {
          instructions: '1.   First step with extra spaces   \n2.  Second step  ',
          tips: '',
          commonMistakes: '',
          muscleGroups: [],
          setupInstructions: '',
        };

        mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

        const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

        expect(result.current.instructions).toEqual([
          'First step with extra spaces',
          'Second step',
        ]);
      });
    });

    describe('bullet points', () => {
      it('should parse bullet points with different symbols', () => {
        const mockExercise = {
          instructions: '• First bullet\n- Second bullet\n* Third bullet',
          tips: '',
          commonMistakes: '',
          muscleGroups: [],
          setupInstructions: '',
        };

        mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

        const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

        expect(result.current.instructions).toEqual([
          'First bullet',
          'Second bullet',
          'Third bullet',
        ]);
      });

      it('should handle mixed bullet and numbered lists', () => {
        const mockExercise = {
          instructions: '1. Numbered step\n• Bullet point\n2. Another numbered step',
          tips: '',
          commonMistakes: '',
          muscleGroups: [],
          setupInstructions: '',
        };

        mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

        const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

        // Should be parsed as numbered list since it starts with a number
        expect(result.current.instructions).toEqual([
          'Numbered step\n• Bullet point',
          'Another numbered step',
        ]);
      });
    });

    describe('line break parsing', () => {
      it('should parse regular line breaks', () => {
        const mockExercise = {
          instructions: 'First line\nSecond line\nThird line',
          tips: '',
          commonMistakes: '',
          muscleGroups: [],
          setupInstructions: '',
        };

        mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

        const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

        expect(result.current.instructions).toEqual(['First line', 'Second line', 'Third line']);
      });

      it('should handle empty lines in text', () => {
        const mockExercise = {
          instructions: 'First line\n\nSecond line\n   \nThird line',
          tips: '',
          commonMistakes: '',
          muscleGroups: [],
          setupInstructions: '',
        };

        mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

        const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

        expect(result.current.instructions).toEqual(['First line', 'Second line', 'Third line']);
      });
    });
  });

  describe('memoization behavior', () => {
    it('should recalculate when exercise data changes', () => {
      const initialExercise = {
        instructions: 'Initial instruction',
        tips: '',
        commonMistakes: '',
        muscleGroups: ['chest'],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [initialExercise] });

      const { result, rerender } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual(['Initial instruction']);
      expect(result.current.musclesTargeted).toEqual(['chest']);

      // Change the exercise data
      const updatedExercise = {
        instructions: 'Updated instruction',
        tips: 'New tip',
        commonMistakes: '',
        muscleGroups: ['back'],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [updatedExercise] });

      rerender();

      expect(result.current.instructions).toEqual(['Updated instruction']);
      expect(result.current.tips).toEqual(['New tip']);
      expect(result.current.musclesTargeted).toEqual(['back']);
    });
  });

  describe('container dependency injection', () => {
    it('should resolve ExerciseQueryService from container', () => {
      mockUseObserveQuery.mockReturnValue({ data: null });

      renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(mockContainer.resolve).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('edge cases', () => {
    it('should handle very long instruction text', () => {
      const longText = 'This is a very long instruction that spans multiple lines '.repeat(20);
      const mockExercise = {
        instructions: longText,
        tips: '',
        commonMistakes: '',
        muscleGroups: [],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual([longText.trim()]);
    });

    it('should handle special characters in instructions', () => {
      const mockExercise = {
        instructions: 'Use 45° angle\nApply 10-15 lbs pressure\nMaintain 90% effort',
        tips: '',
        commonMistakes: '',
        muscleGroups: [],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual([
        'Use 45° angle',
        'Apply 10-15 lbs pressure',
        'Maintain 90% effort',
      ]);
    });

    it('should filter out empty items after parsing', () => {
      const mockExercise = {
        instructions: '\n\n• Valid instruction\n\n\n• Another valid instruction\n\n',
        tips: '',
        commonMistakes: '',
        muscleGroups: [],
        setupInstructions: '',
      };

      mockUseObserveQuery.mockReturnValue({ data: [mockExercise] });

      const { result } = renderHook(() => useExerciseInstructions(mockExerciseId));

      expect(result.current.instructions).toEqual([
        'Valid instruction',
        'Another valid instruction',
      ]);
    });
  });
});
