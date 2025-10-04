import Stack from '@mui/material/Stack';
import React from 'react';

import { ExerciseGroupCard } from './ExerciseGroupCard';

export interface ExerciseGroup {
  id: string;
  type: string;
  rounds?: {
    min: number;
    max: number;
  };
  duration_minutes?: number;
  rest_time_seconds?: number;
  applied_exercises: AppliedExercise[];
}

export interface AppliedExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  set_configuration: {
    type: string;
    sets: number;
    reps?: number;
    duration_seconds?: number;
    weight_percentage?: number;
  };
  rest_time_seconds?: number;
  execution_count: number;
}

export interface SessionContentEditorProps {
  /**
   * Array of exercise groups to display
   */
  exerciseGroups: ExerciseGroup[];
  /**
   * Callback fired when an exercise group should be reordered
   */
  onReorderGroup?: (groupId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when an exercise group should be edited
   */
  onEditGroup?: (groupId: string) => void;
  /**
   * Callback fired when an exercise group should be deleted
   */
  onDeleteGroup?: (groupId: string) => void;
  /**
   * Callback fired when an applied exercise should be reordered within a group
   */
  onReorderExercise?: (exerciseId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when an applied exercise should be edited
   */
  onEditExercise?: (exerciseId: string) => void;
  /**
   * Callback fired when an applied exercise should be deleted
   */
  onDeleteExercise?: (exerciseId: string) => void;
  /**
   * Callback fired when a new exercise should be added to a group
   */
  onAddExercise?: (groupId: string) => void;
  /**
   * Callback fired when a new exercise group should be added
   */
  onAddGroup?: () => void;
  /**
   * Whether the editor is in a loading state
   */
  isLoading?: boolean;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A component that renders a vertical stack of ExerciseGroupCard components for editing session content.
 * Each group contains nested applied exercises with their own editing controls.
 * Follows the mobile-first vertical layout strategy.
 *
 * @example
 * ```tsx
 * <SessionContentEditor
 *   exerciseGroups={exerciseGroups}
 *   onReorderGroup={handleReorderGroup}
 *   onEditGroup={handleEditGroup}
 *   onDeleteGroup={handleDeleteGroup}
 *   onReorderExercise={handleReorderExercise}
 *   onEditExercise={handleEditExercise}
 *   onDeleteExercise={handleDeleteExercise}
 *   onAddExercise={handleAddExercise}
 *   onAddGroup={handleAddGroup}
 * />
 * ```
 */
export const SessionContentEditor = ({
  exerciseGroups,
  onReorderGroup,
  onEditGroup,
  onDeleteGroup,
  onReorderExercise,
  onEditExercise,
  onDeleteExercise,
  onAddExercise,
  onAddGroup,
  isLoading = false,
  'data-testid': testId = 'session-content-editor',
}: SessionContentEditorProps) => {
  return (
    <Stack
      spacing={3}
      data-testid={testId}
      sx={{
        width: '100%',
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? 'none' : 'auto',
      }}
    >
      {exerciseGroups.map((group, index) => (
        <ExerciseGroupCard
          key={group.id}
          exerciseGroup={group}
          isFirst={index === 0}
          isLast={index === exerciseGroups.length - 1}
          onReorderGroup={onReorderGroup}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onReorderExercise={onReorderExercise}
          onEditExercise={onEditExercise}
          onDeleteExercise={onDeleteExercise}
          onAddExercise={onAddExercise}
          data-testid={`exercise-group-card-${group.id}`}
        />
      ))}
    </Stack>
  );
};
