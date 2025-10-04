import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ExerciseData,
  SetData,
  useWorkoutFormState,
  ValidationError,
  WorkoutFormData,
} from '../useWorkoutFormState';

describe('useWorkoutFormState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      // Act
      const { result } = renderHook(() => useWorkoutFormState());

      // Assert
      expect(result.current.formState).toMatchObject({
        name: 'New Workout',
        startTime: expect.any(Date),
        exercises: [],
        isTemplate: false,
      });
      expect(result.current.isDirty).toBe(false);
      expect(result.current.hasChanges).toBe(false);
    });

    it('should initialize with provided initial workout data', () => {
      // Arrange
      const initialWorkout: Partial<WorkoutFormData> = {
        name: 'Morning Workout',
        trainingPlanId: 'plan-1',
        trainingPlanName: 'Test Plan',
        sessionId: 'session-1',
        sessionName: 'Test Session',
        startTime: new Date('2024-03-15T09:00:00Z'),
        endTime: new Date('2024-03-15T10:30:00Z'),
        exercises: [],
        notes: 'Test notes',
        userRating: 4,
        isTemplate: true,
      };

      // Act
      const { result } = renderHook(() => useWorkoutFormState(initialWorkout));

      // Assert
      expect(result.current.formState).toMatchObject({
        name: 'Morning Workout',
        trainingPlanId: 'plan-1',
        trainingPlanName: 'Test Plan',
        sessionId: 'session-1',
        sessionName: 'Test Session',
        startTime: new Date('2024-03-15T09:00:00Z'),
        endTime: new Date('2024-03-15T10:30:00Z'),
        exercises: [],
        notes: 'Test notes',
        userRating: 4,
        isTemplate: true,
      });
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Workout Details Updates', () => {
    it('should update workout name', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act
      act(() => {
        result.current.updateWorkoutDetails({ name: 'Updated Workout' });
      });

      // Assert
      expect(result.current.formState.name).toBe('Updated Workout');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.hasChanges).toBe(true);
    });

    it('should update workout notes', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act
      act(() => {
        result.current.updateWorkoutDetails({ notes: 'Great workout today!' });
      });

      // Assert
      expect(result.current.formState.notes).toBe('Great workout today!');
      expect(result.current.isDirty).toBe(true);
    });

    it('should update workout rating', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act
      act(() => {
        result.current.updateWorkoutDetails({ userRating: 5 });
      });

      // Assert
      expect(result.current.formState.userRating).toBe(5);
      expect(result.current.isDirty).toBe(true);
    });

    it('should update start and end times', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());
      const startTime = new Date('2024-03-15T09:00:00Z');
      const endTime = new Date('2024-03-15T10:30:00Z');

      // Act
      act(() => {
        result.current.updateWorkoutDetails({
          startTime,
          endTime,
        });
      });

      // Assert
      expect(result.current.formState.startTime).toBe(startTime);
      expect(result.current.formState.endTime).toBe(endTime);
      expect(result.current.isDirty).toBe(true);
    });

    it('should update multiple workout details at once', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act
      act(() => {
        result.current.updateWorkoutDetails({
          name: 'Complete Update',
          notes: 'Updated notes',
          userRating: 3,
        });
      });

      // Assert
      expect(result.current.formState.name).toBe('Complete Update');
      expect(result.current.formState.notes).toBe('Updated notes');
      expect(result.current.formState.userRating).toBe(3);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Exercise Management', () => {
    it('should add a new exercise', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act
      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Assert
      expect(result.current.formState.exercises).toHaveLength(1);
      expect(result.current.formState.exercises[0]).toMatchObject({
        id: expect.stringMatching(/^exercise_\d+/),
        exerciseId: 'exercise-1',
        exerciseName: 'Squat',
        orderIndex: 0,
        sets: [],
        restTime: 60,
      });
      expect(result.current.isDirty).toBe(true);
    });

    it('should remove an exercise by index', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addExercise('exercise-2', 'Bench Press');
      });

      // Act
      act(() => {
        result.current.removeExercise(0); // Remove first exercise
      });

      // Assert
      expect(result.current.formState.exercises).toHaveLength(1);
      expect(result.current.formState.exercises[0].exerciseName).toBe('Bench Press');
    });

    it('should update exercise data', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act
      act(() => {
        result.current.updateExercise(0, {
          notes: 'Focus on form',
          restTime: 90,
        });
      });

      // Assert
      expect(result.current.formState.exercises[0]).toMatchObject({
        notes: 'Focus on form',
        restTime: 90,
      });
      expect(result.current.isDirty).toBe(true);
    });

    it('should reorder exercises', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addExercise('exercise-2', 'Bench Press');
        result.current.addExercise('exercise-3', 'Deadlift');
      });

      // Act
      act(() => {
        result.current.reorderExercises(0, 2); // Move Squat to position 2
      });

      // Assert
      expect(result.current.formState.exercises).toHaveLength(3);
      expect(result.current.formState.exercises[0].exerciseName).toBe('Bench Press');
      expect(result.current.formState.exercises[1].exerciseName).toBe('Deadlift');
      expect(result.current.formState.exercises[2].exerciseName).toBe('Squat');

      // Check order indices are updated
      expect(result.current.formState.exercises[0].orderIndex).toBe(0);
      expect(result.current.formState.exercises[1].orderIndex).toBe(1);
      expect(result.current.formState.exercises[2].orderIndex).toBe(2);
    });

    it('should handle reordering with invalid indices', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act
      act(() => {
        result.current.reorderExercises(0, 5); // Invalid toIndex
      });

      // Assert - should not crash and exercise should be moved to end
      expect(result.current.formState.exercises).toHaveLength(1);
      expect(result.current.formState.exercises[0].exerciseName).toBe('Squat');
    });
  });

  describe('Set Management', () => {
    beforeEach(() => {
      // Add a base exercise for set tests
    });

    it('should add a new set to an exercise', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act
      act(() => {
        result.current.addSet(0, {
          weight: 100,
          reps: 10,
          rpe: 8,
        });
      });

      // Assert
      expect(result.current.formState.exercises[0].sets).toHaveLength(1);
      expect(result.current.formState.exercises[0].sets[0]).toMatchObject({
        id: expect.stringMatching(/^set_\d+/),
        weight: 100,
        reps: 10,
        rpe: 8,
        restTime: 60,
        completed: false,
        isPlanned: true,
      });
      expect(result.current.isDirty).toBe(true);
    });

    it('should add a set with default values', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act
      act(() => {
        result.current.addSet(0); // No set data provided
      });

      // Assert
      expect(result.current.formState.exercises[0].sets).toHaveLength(1);
      expect(result.current.formState.exercises[0].sets[0]).toMatchObject({
        restTime: 60,
        completed: false,
        isPlanned: true,
      });
    });

    it('should update set data', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: 100, reps: 10 });
      });

      // Act
      act(() => {
        result.current.updateSet(0, 0, {
          weight: 110,
          reps: 8,
          completed: true,
          notes: 'Great set!',
        });
      });

      // Assert
      expect(result.current.formState.exercises[0].sets[0]).toMatchObject({
        weight: 110,
        reps: 8,
        completed: true,
        notes: 'Great set!',
      });
      expect(result.current.isDirty).toBe(true);
    });

    it('should remove a set from an exercise', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: 100, reps: 10 });
        result.current.addSet(0, { weight: 105, reps: 8 });
      });

      // Act
      act(() => {
        result.current.removeSet(0, 0); // Remove first set
      });

      // Assert
      expect(result.current.formState.exercises[0].sets).toHaveLength(1);
      expect(result.current.formState.exercises[0].sets[0].weight).toBe(105);
    });

    it('should duplicate a set', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, {
          weight: 100,
          reps: 10,
          rpe: 8,
          notes: 'Original set',
          completed: true,
        });
      });

      // Act
      act(() => {
        result.current.duplicateSet(0, 0);
      });

      // Assert
      expect(result.current.formState.exercises[0].sets).toHaveLength(2);
      expect(result.current.formState.exercises[0].sets[1]).toMatchObject({
        weight: 100,
        reps: 10,
        rpe: 8,
        notes: 'Original set',
        completed: false, // Should reset completion status
        id: expect.stringMatching(/^set_\d+/),
      });
      expect(result.current.formState.exercises[0].sets[1].id).not.toBe(
        result.current.formState.exercises[0].sets[0].id
      );
    });

    it('should handle duplicate set with invalid indices', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act & Assert - should not crash
      act(() => {
        result.current.duplicateSet(0, 0); // No sets exist
      });

      expect(result.current.formState.exercises[0].sets).toHaveLength(0);
    });

    it('should handle set operations on invalid exercise index', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act & Assert - should not crash
      act(() => {
        result.current.addSet(5, { weight: 100, reps: 10 }); // Invalid exercise index
      });

      expect(result.current.formState.exercises).toHaveLength(0);
    });
  });

  describe('Form Validation', () => {
    it('should validate required workout name', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.updateWorkoutDetails({ name: '' });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: 'Workout name is required',
        })
      );
    });

    it('should validate start time is required', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.updateWorkoutDetails({ startTime: null as any });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'startTime',
          message: 'Start time is required',
        })
      );
    });

    it('should validate end time is after start time', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      const startTime = new Date('2024-03-15T10:00:00Z');
      const endTime = new Date('2024-03-15T09:00:00Z'); // Before start time

      act(() => {
        result.current.updateWorkoutDetails({ startTime, endTime });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'endTime',
          message: 'End time must be after start time',
        })
      );
    });

    it('should validate at least one exercise is required', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'exercises',
          message: 'At least one exercise is required',
        })
      );
    });

    it('should validate exercise name is required', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.updateExercise(0, { exerciseName: '' });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'exerciseName',
          exerciseIndex: 0,
          message: 'Exercise name is required',
        })
      );
    });

    it('should validate at least one set per exercise', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'sets',
          exerciseIndex: 0,
          message: 'At least one set is required for each exercise',
        })
      );
    });

    it('should validate set weight is positive', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: -10, reps: 10 });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'weight',
          exerciseIndex: 0,
          setIndex: 0,
          message: 'Weight must be a positive number',
        })
      );
    });

    it('should validate set reps is positive', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: 100, reps: 0 });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'reps',
          exerciseIndex: 0,
          setIndex: 0,
          message: 'Reps must be a positive number',
        })
      );
    });

    it('should validate RPE range (1-10)', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: 100, reps: 10, rpe: 15 });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'rpe',
          exerciseIndex: 0,
          setIndex: 0,
          message: 'RPE must be between 1 and 10',
        })
      );
    });

    it('should validate duration is positive', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Running');
        result.current.addSet(0, { duration: -30 });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'duration',
          exerciseIndex: 0,
          setIndex: 0,
          message: 'Duration must be a positive number',
        })
      );
    });

    it('should validate distance is positive', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Running');
        result.current.addSet(0, { distance: -5 });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'distance',
          exerciseIndex: 0,
          setIndex: 0,
          message: 'Distance must be a positive number',
        })
      );
    });

    it('should require at least one performance metric per set', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { notes: 'Just notes, no metrics' });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'performanceData',
          exerciseIndex: 0,
          setIndex: 0,
          message:
            'At least one performance metric (weight, reps, duration, or distance) is required',
        })
      );
    });

    it('should pass validation with valid form data', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.updateWorkoutDetails({
          name: 'Valid Workout',
          startTime: new Date('2024-03-15T09:00:00Z'),
          endTime: new Date('2024-03-15T10:30:00Z'),
        });
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: 100, reps: 10, rpe: 8 });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate multiple exercises and sets', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.updateWorkoutDetails({ name: 'Multi Exercise Workout' });

        // First exercise - valid
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, { weight: 100, reps: 10 });

        // Second exercise - invalid name
        result.current.addExercise('exercise-2', '');
        result.current.addSet(1, { weight: -50, reps: 8 }); // Invalid weight

        // Third exercise - no sets
        result.current.addExercise('exercise-3', 'Deadlift');
      });

      // Act
      const validation = result.current.validateForm();

      // Assert
      expect(validation.isValid).toBe(false);

      const errors = validation.errors;
      expect(errors.some((e) => e.field === 'exerciseName' && e.exerciseIndex === 1)).toBe(true);
      expect(
        errors.some((e) => e.field === 'weight' && e.exerciseIndex === 1 && e.setIndex === 0)
      ).toBe(true);
      expect(errors.some((e) => e.field === 'sets' && e.exerciseIndex === 2)).toBe(true);
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', () => {
      // Arrange
      const initialWorkout: Partial<WorkoutFormData> = {
        name: 'Initial Workout',
        notes: 'Initial notes',
      };

      const { result } = renderHook(() => useWorkoutFormState(initialWorkout));

      // Make changes
      act(() => {
        result.current.updateWorkoutDetails({ name: 'Changed Workout' });
        result.current.addExercise('exercise-1', 'Squat');
      });

      expect(result.current.isDirty).toBe(true);

      // Act
      act(() => {
        result.current.resetForm();
      });

      // Assert
      expect(result.current.formState.name).toBe('Initial Workout');
      expect(result.current.formState.notes).toBe('Initial notes');
      expect(result.current.formState.exercises).toHaveLength(0);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.hasChanges).toBe(false);
    });

    it('should reset to default state when no initial workout provided', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.updateWorkoutDetails({ name: 'Changed Workout' });
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act
      act(() => {
        result.current.resetForm();
      });

      // Assert
      expect(result.current.formState.name).toBe('New Workout');
      expect(result.current.formState.exercises).toHaveLength(0);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Dirty State Tracking', () => {
    it('should track dirty state correctly', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      expect(result.current.isDirty).toBe(false);

      // Act - make a change
      act(() => {
        result.current.updateWorkoutDetails({ name: 'Changed Name' });
      });

      // Assert
      expect(result.current.isDirty).toBe(true);
      expect(result.current.hasChanges).toBe(true);
    });

    it('should not be dirty when form matches initial state', () => {
      // Arrange
      const initialWorkout: Partial<WorkoutFormData> = {
        name: 'Test Workout',
      };

      const { result } = renderHook(() => useWorkoutFormState(initialWorkout));

      // Act - set to same value as initial
      act(() => {
        result.current.updateWorkoutDetails({ name: 'Test Workout' });
      });

      // Note: This test demonstrates that the current implementation compares
      // the entire form state, so changing and then reverting won't make it clean
      // This behavior is acceptable for most use cases
      expect(result.current.isDirty).toBe(false);
    });

    it('should track dirty state through complex operations', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act - perform multiple operations
      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.addSet(0, { weight: 100, reps: 10 });
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.updateSet(0, 0, { completed: true });
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on empty exercise array', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      // Act & Assert - should not crash
      expect(() => {
        act(() => {
          result.current.removeExercise(0);
          result.current.updateExercise(0, { notes: 'test' });
          result.current.reorderExercises(0, 1);
        });
      }).not.toThrow();

      expect(result.current.formState.exercises).toHaveLength(0);
    });

    it('should handle operations on exercises with empty sets', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
      });

      // Act & Assert - should not crash
      expect(() => {
        act(() => {
          result.current.removeSet(0, 0);
          result.current.updateSet(0, 0, { weight: 100 });
          result.current.duplicateSet(0, 0);
        });
      }).not.toThrow();

      expect(result.current.formState.exercises[0].sets).toHaveLength(0);
    });

    it('should handle undefined/null values in validation', () => {
      // Arrange
      const { result } = renderHook(() => useWorkoutFormState());

      act(() => {
        result.current.addExercise('exercise-1', 'Squat');
        result.current.addSet(0, {
          weight: undefined,
          reps: null as any,
          rpe: undefined,
        });
      });

      // Act
      const validation = result.current.validateForm();

      // Assert - should handle undefined/null values gracefully
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.field === 'performanceData')).toBe(true);
    });
  });
});
