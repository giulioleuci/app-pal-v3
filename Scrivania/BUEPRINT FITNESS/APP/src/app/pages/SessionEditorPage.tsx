import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import type { Exercise } from '@/features/training-plan/components/editor/ExercisePickerDialog';
import { ExercisePickerDialog } from '@/features/training-plan/components/editor/ExercisePickerDialog';
import type {
  AppliedExercise,
  ExerciseGroup,
} from '@/features/training-plan/components/editor/SessionContentEditor';
import { SessionContentEditor } from '@/features/training-plan/components/editor/SessionContentEditor';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

// Mock hook - replace with actual implementation
const useSessionEditorData = (planId?: string, sessionId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock data structure
  const data = {
    session:
      planId && sessionId
        ? {
            id: sessionId,
            name: 'Upper Body Strength',
            notes: 'Focus on compound movements',
            exerciseGroups: [
              {
                id: '1',
                type: 'superset',
                rounds: { min: 3, max: 4 },
                rest_time_seconds: 120,
                applied_exercises: [
                  {
                    id: '1',
                    exercise_id: 'ex1',
                    exercise_name: 'Bench Press',
                    set_configuration: {
                      type: 'strength',
                      sets: 4,
                      reps: 6,
                      weight_percentage: 85,
                    },
                    rest_time_seconds: 180,
                    execution_count: 0,
                  },
                  {
                    id: '2',
                    exercise_id: 'ex2',
                    exercise_name: 'Barbell Rows',
                    set_configuration: {
                      type: 'strength',
                      sets: 4,
                      reps: 6,
                      weight_percentage: 80,
                    },
                    rest_time_seconds: 180,
                    execution_count: 0,
                  },
                ],
              },
              {
                id: '2',
                type: 'circuit',
                duration_minutes: 15,
                applied_exercises: [
                  {
                    id: '3',
                    exercise_id: 'ex3',
                    exercise_name: 'Push-ups',
                    set_configuration: {
                      type: 'endurance',
                      sets: 3,
                      reps: 15,
                    },
                    execution_count: 0,
                  },
                ],
              },
            ] as ExerciseGroup[],
          }
        : null,
    availableExercises: [
      {
        id: 'ex1',
        name: 'Bench Press',
        description: 'Horizontal pressing movement for chest development',
        category: 'chest',
        movement_type: 'push',
        movement_pattern: 'horizontal_press',
        difficulty: 'intermediate',
        equipment: ['barbell', 'bench'],
        muscle_activation: { chest: 0.8, triceps: 0.6, shoulders: 0.4 },
        counter_type: 'reps',
        joint_type: 'multi_joint',
        notes: 'Keep shoulder blades retracted',
        substitutions: ['dumbbell_press', 'push_ups'],
      },
      {
        id: 'ex2',
        name: 'Barbell Rows',
        description: 'Horizontal pulling movement for back development',
        category: 'back',
        movement_type: 'pull',
        movement_pattern: 'horizontal_pull',
        difficulty: 'intermediate',
        equipment: ['barbell'],
        muscle_activation: { latissimus: 0.8, rhomboids: 0.7, biceps: 0.5 },
        counter_type: 'reps',
        joint_type: 'multi_joint',
        substitutions: ['dumbbell_rows', 'cable_rows'],
      },
      {
        id: 'ex3',
        name: 'Push-ups',
        description: 'Bodyweight pressing movement',
        category: 'chest',
        movement_type: 'push',
        movement_pattern: 'horizontal_press',
        difficulty: 'beginner',
        equipment: ['bodyweight'],
        muscle_activation: { chest: 0.7, triceps: 0.6, core: 0.4 },
        counter_type: 'reps',
        joint_type: 'multi_joint',
        substitutions: ['incline_push_ups', 'knee_push_ups'],
      },
    ] as Exercise[],
  };

  // Mock action handlers
  const reorderGroup = async (groupId: string, direction: 'up' | 'down') => {
    console.log('Reordering group:', groupId, direction);
  };

  const editGroup = async (groupId: string) => {
    console.log('Editing group:', groupId);
  };

  const deleteGroup = async (groupId: string) => {
    console.log('Deleting group:', groupId);
  };

  const reorderExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    console.log('Reordering exercise:', exerciseId, direction);
  };

  const editExercise = async (exerciseId: string) => {
    console.log('Editing exercise:', exerciseId);
  };

  const deleteExercise = async (exerciseId: string) => {
    console.log('Deleting exercise:', exerciseId);
  };

  const addExercise = async (groupId: string, exercise: Exercise) => {
    console.log('Adding exercise to group:', groupId, exercise);
  };

  const addGroup = async () => {
    console.log('Adding new exercise group');
  };

  return {
    data,
    isLoading,
    isError,
    error,
    reorderGroup,
    editGroup,
    deleteGroup,
    reorderExercise,
    editExercise,
    deleteExercise,
    addExercise,
    addGroup,
  };
};

/**
 * A smart page component for editing session content (exercise groups and applied exercises).
 * Manages the state and data fetching for session editing, then passes data down
 * to the SessionContentEditor component. Follows the Data-First Design Protocol.
 *
 * Features:
 * - PageHeader with back button and page title management
 * - Global feedback via snackbar notifications
 * - Error handling with ErrorDisplay component
 * - Empty state handling for sessions with no exercise groups
 * - Exercise picker dialog for adding exercises to groups
 * - Floating action button for adding new exercise groups
 *
 * @example
 * Route: /session-editor/:planId/:sessionId
 * ```tsx
 * <Route path="/session-editor/:planId/:sessionId" element={<SessionEditorPage />} />
 * ```
 */
export const SessionEditorPage = () => {
  const { t } = useAppTranslation();
  const { planId, sessionId } = useParams<{ planId?: string; sessionId?: string }>();
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Set page title
  usePageTitle('planEditor', t('pageTitles.sessionEditor'));

  // Data-First Design Protocol: Fetch data and map to presentation
  const {
    data,
    isLoading,
    isError,
    error,
    reorderGroup,
    editGroup,
    deleteGroup,
    reorderExercise,
    editExercise,
    deleteExercise,
    addExercise,
    addGroup,
  } = useSessionEditorData(planId, sessionId);

  // Handle error state
  if (isError && error) {
    return (
      <Container maxWidth='md' sx={{ py: 3 }}>
        <PageHeader title={t('pageTitles.sessionEditor')} showBackButton />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='session-editor-error'
        />
      </Container>
    );
  }

  // Handle action handlers with global feedback
  const handleReorderGroup = async (groupId: string, direction: 'up' | 'down') => {
    try {
      await reorderGroup(groupId, direction);
      // Show success notification
    } catch (err) {
      console.error('Failed to reorder group:', err);
    }
  };

  const handleEditGroup = (groupId: string) => {
    editGroup(groupId);
    // Open edit dialog or navigate to group editor
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      // Show success notification
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const handleReorderExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    try {
      await reorderExercise(exerciseId, direction);
      // Show success notification
    } catch (err) {
      console.error('Failed to reorder exercise:', err);
    }
  };

  const handleEditExercise = (exerciseId: string) => {
    editExercise(exerciseId);
    // Open edit dialog or navigate to exercise editor
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await deleteExercise(exerciseId);
      // Show success notification
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
  };

  const handleAddExercise = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsExercisePickerOpen(true);
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    if (selectedGroupId) {
      try {
        await addExercise(selectedGroupId, exercise);
        // Show success notification
      } catch (err) {
        console.error('Failed to add exercise:', err);
      }
    }
  };

  const handleAddGroup = async () => {
    try {
      await addGroup();
      // Show success notification
    } catch (err) {
      console.error('Failed to add group:', err);
    }
  };

  return (
    <Container maxWidth='md' sx={{ py: 3 }} data-testid='session-editor-page'>
      <PageHeader
        title={data.session?.name || t('pageTitles.sessionEditor')}
        subtitle={data.session?.notes}
        showBackButton
        data-testid='session-editor-page-header'
      />

      <Stack spacing={3}>
        {data.session?.exerciseGroups && data.session.exerciseGroups.length > 0 ? (
          // Session content editor
          <SessionContentEditor
            exerciseGroups={data.session.exerciseGroups}
            onReorderGroup={handleReorderGroup}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            onReorderExercise={handleReorderExercise}
            onEditExercise={handleEditExercise}
            onDeleteExercise={handleDeleteExercise}
            onAddExercise={handleAddExercise}
            onAddGroup={handleAddGroup}
            isLoading={isLoading}
            data-testid='session-editor-content'
          />
        ) : (
          // Empty state for session with no exercise groups
          <EmptyState
            icon='workout'
            title={t('trainingPlan.editor.noExerciseGroups')}
            description={t('trainingPlan.editor.addFirstExerciseGroup')}
            actionLabel={t('trainingPlan.editor.addExerciseGroup')}
            onAction={handleAddGroup}
            data-testid='session-editor-empty-state'
          />
        )}
      </Stack>

      {/* Floating action button for adding exercise groups */}
      <Fab
        color='primary'
        aria-label={t('trainingPlan.editor.addExerciseGroup')}
        onClick={handleAddGroup}
        data-testid='session-editor-add-group-fab'
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <Icon name='add' />
      </Fab>

      {/* Exercise picker dialog */}
      <ExercisePickerDialog
        open={isExercisePickerOpen}
        onClose={() => {
          setIsExercisePickerOpen(false);
          setSelectedGroupId(null);
        }}
        exercises={data.availableExercises}
        onSelectExercise={handleSelectExercise}
        isLoading={isLoading}
        data-testid='session-editor-exercise-picker'
      />
    </Container>
  );
};
