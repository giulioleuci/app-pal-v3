import { useMemo } from 'react';
import { container } from 'tsyringe';

import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseQueryService } from '@/features/exercise/query-services/ExerciseQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { exercisesToDomain } from '@/shared/utils/transformations';

interface ExerciseInstructionData {
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  musclesTargeted: string[];
  setupSteps: string[];
}

/**
 * Hook for providing comprehensive exercise guidance and instructional content.
 *
 * Retrieves detailed exercise instructions, form cues, tips, and common mistakes
 * for UI display during workouts. Helps users maintain proper form and technique
 * by providing structured guidance information for each exercise.
 *
 * @param exerciseId The ID of the exercise to get instructions for
 * @returns Object with comprehensive exercise instruction data
 *
 * @example
 * ```typescript
 * const instructions = useExerciseInstructions(exerciseId);
 *
 * return (
 *   <Box>
 *     <Typography variant="h6">Instructions</Typography>
 *     {instructions.instructions.map((step, index) => (
 *       <Typography key={index}>• {step}</Typography>
 *     ))}
 *
 *     <Typography variant="h6">Tips</Typography>
 *     {instructions.tips.map((tip, index) => (
 *       <Alert key={index} severity="info">{tip}</Alert>
 *     ))}
 *   </Box>
 * );
 * ```
 */
export function useExerciseInstructions(exerciseId: string): ExerciseInstructionData {
  const exerciseQueryService = container.resolve(ExerciseQueryService);

  // Get the specific exercise reactively
  const exerciseQuery = exerciseId ? exerciseQueryService.getExerciseById(exerciseId) : null;
  const { data: exercises } = useObserveQuery(exerciseQuery, {
    transform: exercisesToDomain,
    enabled: !!exerciseId,
  });

  const instructionData = useMemo(() => {
    // Default empty instruction state
    const defaultInstructions: ExerciseInstructionData = {
      instructions: [],
      tips: [],
      commonMistakes: [],
      musclesTargeted: [],
      setupSteps: [],
    };

    const exercise = exercises?.[0];
    if (!exercise) {
      return defaultInstructions;
    }

    // Extract instruction data from the exercise
    // Note: These fields may need to be added to ExerciseModel if not present
    return {
      instructions: parseInstructionText(exercise.instructions || ''),
      tips: parseInstructionText(exercise.tips || ''),
      commonMistakes: parseInstructionText(exercise.commonMistakes || ''),
      musclesTargeted: exercise.muscleGroups || [],
      setupSteps: parseInstructionText(exercise.setupInstructions || ''),
    };
  }, [exercises]);

  return instructionData;
}

/**
 * Helper function to parse instruction text into array format.
 * Handles different formats like bullet points, numbered lists, or line breaks.
 */
function parseInstructionText(text: string): string[] {
  if (!text || text.trim() === '') {
    return [];
  }

  // Handle different instruction formats
  let items: string[] = [];

  // Check for numbered lists (1. 2. 3.)
  if (/^\d+\.\s/.test(text.trim())) {
    items = text
      .split(/\d+\.\s/)
      .filter((item) => item.trim() !== '')
      .map((item) => item.trim());
  }
  // Check for bullet points (• - *)
  else if (/^[•\-\*]\s/m.test(text)) {
    items = text
      .split(/\n[•\-\*]\s/)
      .filter((item) => item.trim() !== '')
      .map((item) => item.replace(/^[•\-\*]\s/, '').trim());
  }
  // Split by line breaks
  else if (text.includes('\n')) {
    items = text
      .split('\n')
      .filter((item) => item.trim() !== '')
      .map((item) => item.trim());
  }
  // Single instruction
  else {
    items = [text.trim()];
  }

  return items.filter((item) => item.length > 0);
}
