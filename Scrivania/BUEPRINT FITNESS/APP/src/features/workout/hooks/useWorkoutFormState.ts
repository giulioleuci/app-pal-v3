import { useCallback, useMemo, useState } from 'react';

export interface SetData {
  id: string;
  weight?: number;
  reps?: number;
  distance?: number;
  duration?: number;
  rpe?: number;
  restTime?: number;
  notes?: string;
  completed: boolean;
  isPlanned: boolean;
}

export interface ExerciseData {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  sets: SetData[];
  notes?: string;
  restTime?: number;
  substitutionId?: string;
}

export interface WorkoutFormData {
  id?: string;
  name: string;
  trainingPlanId?: string;
  trainingPlanName?: string;
  sessionId?: string;
  sessionName?: string;
  startTime: Date;
  endTime?: Date;
  exercises: ExerciseData[];
  notes?: string;
  userRating?: number;
  isTemplate: boolean;
}

export interface ValidationError {
  field: string;
  exerciseIndex?: number;
  setIndex?: number;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface UseWorkoutFormStateResult {
  formState: WorkoutFormData;
  updateWorkoutDetails: (
    updates: Partial<
      Pick<WorkoutFormData, 'name' | 'notes' | 'userRating' | 'startTime' | 'endTime'>
    >
  ) => void;
  updateExercise: (index: number, data: Partial<ExerciseData>) => void;
  addExercise: (exerciseId: string, exerciseName: string) => void;
  removeExercise: (index: number) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  addSet: (exerciseIndex: number, setData?: Partial<SetData>) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetData>) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  duplicateSet: (exerciseIndex: number, setIndex: number) => void;
  validateForm: () => ValidationResult;
  resetForm: () => void;
  isDirty: boolean;
  hasChanges: boolean;
}

/**
 * Hook for managing complex workout creation/editing form state with validation.
 *
 * Manages nested workout form data with exercises and sets, providing validation
 * and state management functions. Eliminates extensive useState management in
 * components by centralizing workout form logic and validation rules.
 *
 * @param initialWorkout Optional initial workout data for editing
 * @returns Object with form state and management functions
 *
 * @example
 * ```typescript
 * const {
 *   formState,
 *   updateWorkoutDetails,
 *   addExercise,
 *   addSet,
 *   updateSet,
 *   validateForm,
 *   isDirty
 * } = useWorkoutFormState(existingWorkout);
 *
 * // Update workout name
 * const handleNameChange = (name: string) => {
 *   updateWorkoutDetails({ name });
 * };
 *
 * // Add a new exercise
 * const handleAddExercise = (exerciseId: string, name: string) => {
 *   addExercise(exerciseId, name);
 * };
 *
 * // Validate before submission
 * const handleSubmit = () => {
 *   const validation = validateForm();
 *   if (validation.isValid) {
 *     submitWorkout(formState);
 *   } else {
 *     showValidationErrors(validation.errors);
 *   }
 * };
 * ```
 */
export function useWorkoutFormState(
  initialWorkout?: Partial<WorkoutFormData>
): UseWorkoutFormStateResult {
  // Initialize form state
  const createInitialState = (): WorkoutFormData => ({
    name: initialWorkout?.name || 'New Workout',
    trainingPlanId: initialWorkout?.trainingPlanId,
    trainingPlanName: initialWorkout?.trainingPlanName,
    sessionId: initialWorkout?.sessionId,
    sessionName: initialWorkout?.sessionName,
    startTime: initialWorkout?.startTime || new Date(),
    endTime: initialWorkout?.endTime,
    exercises: initialWorkout?.exercises || [],
    notes: initialWorkout?.notes,
    userRating: initialWorkout?.userRating,
    isTemplate: initialWorkout?.isTemplate || false,
  });

  // Create initial state once to ensure both formState and initialState are identical
  const initialStateData = useMemo(() => createInitialState(), [initialWorkout]);
  const [formState, setFormState] = useState<WorkoutFormData>(initialStateData);
  const [initialState, setInitialState] = useState<WorkoutFormData>(initialStateData);

  // Track if form has been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(initialState);
  }, [formState, initialState]);

  const hasChanges = isDirty;

  /**
   * Updates top-level workout details
   */
  const updateWorkoutDetails = useCallback(
    (
      updates: Partial<
        Pick<WorkoutFormData, 'name' | 'notes' | 'userRating' | 'startTime' | 'endTime'>
      >
    ) => {
      setFormState((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    []
  );

  /**
   * Updates an exercise at a specific index
   */
  const updateExercise = useCallback((index: number, data: Partial<ExerciseData>) => {
    setFormState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === index ? { ...exercise, ...data } : exercise
      ),
    }));
  }, []);

  /**
   * Adds a new exercise to the workout
   */
  const addExercise = useCallback((exerciseId: string, exerciseName: string) => {
    const newExercise: ExerciseData = {
      id: `exercise_${Date.now()}_${Math.random()}`,
      exerciseId,
      exerciseName,
      orderIndex: 0, // Will be updated by reorder logic
      sets: [],
      restTime: 60, // Default rest time
    };

    setFormState((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));
  }, []);

  /**
   * Removes an exercise from the workout
   */
  const removeExercise = useCallback((index: number) => {
    setFormState((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Reorders exercises in the workout
   */
  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setFormState((prev) => {
      // Safety check: ensure indices are valid
      if (
        fromIndex < 0 ||
        fromIndex >= prev.exercises.length ||
        toIndex < 0 ||
        toIndex >= prev.exercises.length
      ) {
        return prev; // No change if indices are invalid
      }

      const newExercises = [...prev.exercises];
      const [movedExercise] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, movedExercise);

      // Update order indices
      return {
        ...prev,
        exercises: newExercises.map((exercise, index) => ({
          ...exercise,
          orderIndex: index,
        })),
      };
    });
  }, []);

  /**
   * Adds a new set to an exercise
   */
  const addSet = useCallback((exerciseIndex: number, setData: Partial<SetData> = {}) => {
    const newSet: SetData = {
      id: `set_${Date.now()}_${Math.random()}`,
      weight: setData.weight,
      reps: setData.reps,
      distance: setData.distance,
      duration: setData.duration,
      rpe: setData.rpe,
      restTime: setData.restTime || 60,
      notes: setData.notes,
      completed: setData.completed || false,
      isPlanned: setData.isPlanned || true,
    };

    setFormState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex ? { ...exercise, sets: [...exercise.sets, newSet] } : exercise
      ),
    }));
  }, []);

  /**
   * Updates a specific set within an exercise
   */
  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, data: Partial<SetData>) => {
      setFormState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((exercise, i) =>
          i === exerciseIndex
            ? {
                ...exercise,
                sets: exercise.sets.map((set, j) => (j === setIndex ? { ...set, ...data } : set)),
              }
            : exercise
        ),
      }));
    },
    []
  );

  /**
   * Removes a set from an exercise
   */
  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setFormState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? { ...exercise, sets: exercise.sets.filter((_, j) => j !== setIndex) }
          : exercise
      ),
    }));
  }, []);

  /**
   * Duplicates a set within an exercise
   */
  const duplicateSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setFormState((prev) => {
      const exercise = prev.exercises[exerciseIndex];
      if (!exercise) return prev;

      const setToDuplicate = exercise.sets[setIndex];
      if (!setToDuplicate) return prev;

      const duplicatedSet: SetData = {
        ...setToDuplicate,
        id: `set_${Date.now()}_${Math.random()}`,
        completed: false, // Reset completion status
      };

      const newSets = [...exercise.sets];
      newSets.splice(setIndex + 1, 0, duplicatedSet);

      return {
        ...prev,
        exercises: prev.exercises.map((ex, i) =>
          i === exerciseIndex ? { ...ex, sets: newSets } : ex
        ),
      };
    });
  }, []);

  /**
   * Validates the entire form and returns validation results
   */
  const validateForm = useCallback((): ValidationResult => {
    const errors: ValidationError[] = [];

    // Validate workout name
    if (!formState.name.trim()) {
      errors.push({
        field: 'name',
        message: 'Workout name is required',
      });
    }

    // Validate start time
    if (!formState.startTime) {
      errors.push({
        field: 'startTime',
        message: 'Start time is required',
      });
    }

    // Validate end time if provided
    if (formState.endTime && formState.startTime && formState.endTime <= formState.startTime) {
      errors.push({
        field: 'endTime',
        message: 'End time must be after start time',
      });
    }

    // Validate exercises
    if (formState.exercises.length === 0) {
      errors.push({
        field: 'exercises',
        message: 'At least one exercise is required',
      });
    }

    // Validate each exercise
    formState.exercises.forEach((exercise, exerciseIndex) => {
      if (!exercise.exerciseName.trim()) {
        errors.push({
          field: 'exerciseName',
          exerciseIndex,
          message: 'Exercise name is required',
        });
      }

      if (exercise.sets.length === 0) {
        errors.push({
          field: 'sets',
          exerciseIndex,
          message: 'At least one set is required for each exercise',
        });
      }

      // Validate each set
      exercise.sets.forEach((set, setIndex) => {
        // Check for required fields based on exercise type
        if (set.weight !== undefined && set.weight < 0) {
          errors.push({
            field: 'weight',
            exerciseIndex,
            setIndex,
            message: 'Weight must be a positive number',
          });
        }

        if (set.reps !== undefined && set.reps <= 0) {
          errors.push({
            field: 'reps',
            exerciseIndex,
            setIndex,
            message: 'Reps must be a positive number',
          });
        }

        if (set.rpe !== undefined && (set.rpe < 1 || set.rpe > 10)) {
          errors.push({
            field: 'rpe',
            exerciseIndex,
            setIndex,
            message: 'RPE must be between 1 and 10',
          });
        }

        if (set.duration !== undefined && set.duration <= 0) {
          errors.push({
            field: 'duration',
            exerciseIndex,
            setIndex,
            message: 'Duration must be a positive number',
          });
        }

        if (set.distance !== undefined && set.distance <= 0) {
          errors.push({
            field: 'distance',
            exerciseIndex,
            setIndex,
            message: 'Distance must be a positive number',
          });
        }

        // Ensure at least one performance metric is provided
        const hasPerformanceData =
          (set.weight !== undefined && set.weight !== null) ||
          (set.reps !== undefined && set.reps !== null) ||
          (set.duration !== undefined && set.duration !== null) ||
          (set.distance !== undefined && set.distance !== null);

        if (!hasPerformanceData) {
          errors.push({
            field: 'performanceData',
            exerciseIndex,
            setIndex,
            message:
              'At least one performance metric (weight, reps, duration, or distance) is required',
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [formState]);

  /**
   * Resets the form to its initial state
   */
  const resetForm = useCallback(() => {
    const newInitialState = createInitialState();
    setFormState(newInitialState);
    setInitialState(newInitialState);
  }, [initialWorkout]);

  return {
    formState,
    updateWorkoutDetails,
    updateExercise,
    addExercise,
    removeExercise,
    reorderExercises,
    addSet,
    updateSet,
    removeSet,
    duplicateSet,
    validateForm,
    resetForm,
    isDirty,
    hasChanges,
  };
}
