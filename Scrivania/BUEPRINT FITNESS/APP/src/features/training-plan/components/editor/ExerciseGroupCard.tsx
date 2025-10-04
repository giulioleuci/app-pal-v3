import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import { ActionCard } from '@/shared/components/ActionCard';
import { Icon } from '@/shared/components/Icon';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

import { AppliedExerciseCard } from './AppliedExerciseCard';
import { AppliedExercise, ExerciseGroup } from './SessionContentEditor';

export interface ExerciseGroupCardProps {
  /**
   * The exercise group data to display
   */
  exerciseGroup: ExerciseGroup;
  /**
   * Whether this is the first group in the list
   */
  isFirst?: boolean;
  /**
   * Whether this is the last group in the list
   */
  isLast?: boolean;
  /**
   * Callback fired when the group should be reordered
   */
  onReorderGroup?: (groupId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when the group should be edited
   */
  onEditGroup?: (groupId: string) => void;
  /**
   * Callback fired when the group should be deleted
   */
  onDeleteGroup?: (groupId: string) => void;
  /**
   * Callback fired when an exercise should be reordered within this group
   */
  onReorderExercise?: (exerciseId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when an exercise should be edited
   */
  onEditExercise?: (exerciseId: string) => void;
  /**
   * Callback fired when an exercise should be deleted
   */
  onDeleteExercise?: (exerciseId: string) => void;
  /**
   * Callback fired when a new exercise should be added to this group
   */
  onAddExercise?: (groupId: string) => void;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A card component that displays an exercise group with its nested applied exercises.
 * Each group contains controls for reordering, editing, and deleting, and displays
 * a nested stack of AppliedExerciseCard components.
 *
 * @example
 * ```tsx
 * <ExerciseGroupCard
 *   exerciseGroup={exerciseGroup}
 *   isFirst={false}
 *   isLast={false}
 *   onReorderGroup={handleReorderGroup}
 *   onEditGroup={handleEditGroup}
 *   onDeleteGroup={handleDeleteGroup}
 *   onReorderExercise={handleReorderExercise}
 *   onEditExercise={handleEditExercise}
 *   onDeleteExercise={handleDeleteExercise}
 *   onAddExercise={handleAddExercise}
 * />
 * ```
 */
export const ExerciseGroupCard = ({
  exerciseGroup,
  isFirst = false,
  isLast = false,
  onReorderGroup,
  onEditGroup,
  onDeleteGroup,
  onReorderExercise,
  onEditExercise,
  onDeleteExercise,
  onAddExercise,
  'data-testid': testId = 'exercise-group-card',
}: ExerciseGroupCardProps) => {
  const { t } = useAppTranslation();

  const handleMoveUp = () => {
    onReorderGroup?.(exerciseGroup.id, 'up');
  };

  const handleMoveDown = () => {
    onReorderGroup?.(exerciseGroup.id, 'down');
  };

  const handleEdit = () => {
    onEditGroup?.(exerciseGroup.id);
  };

  const handleDelete = () => {
    onDeleteGroup?.(exerciseGroup.id);
  };

  const handleAddExercise = () => {
    onAddExercise?.(exerciseGroup.id);
  };

  const formatRounds = (rounds?: { min: number; max: number }) => {
    if (!rounds) return null;
    if (rounds.min === rounds.max) {
      return t('trainingPlan.editor.rounds', { count: rounds.min });
    }
    return t('trainingPlan.editor.roundsRange', { min: rounds.min, max: rounds.max });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    return t('trainingPlan.editor.duration', { minutes });
  };

  const formatRestTime = (seconds?: number) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0 && remainingSeconds > 0) {
      return t('trainingPlan.editor.restTimeMinutesSeconds', {
        minutes,
        seconds: remainingSeconds,
      });
    } else if (minutes > 0) {
      return t('trainingPlan.editor.restTimeMinutes', { minutes });
    } else {
      return t('trainingPlan.editor.restTimeSeconds', { seconds });
    }
  };

  return (
    <ActionCard data-testid={testId}>
      <ActionCard.Header
        action={
          <Stack direction='row' spacing={0.5}>
            {/* Reorder controls */}
            <IconButton
              size='small'
              disabled={isFirst}
              onClick={handleMoveUp}
              data-testid='exercise-group-card-move-up'
              aria-label={t('trainingPlan.editor.moveUp')}
            >
              <Icon name='arrow-back' sx={{ transform: 'rotate(90deg)' }} />
            </IconButton>
            <IconButton
              size='small'
              disabled={isLast}
              onClick={handleMoveDown}
              data-testid='exercise-group-card-move-down'
              aria-label={t('trainingPlan.editor.moveDown')}
            >
              <Icon name='arrow-forward' sx={{ transform: 'rotate(90deg)' }} />
            </IconButton>
            {/* Edit button */}
            <IconButton
              size='small'
              onClick={handleEdit}
              data-testid='exercise-group-card-edit'
              aria-label={t('common.edit')}
            >
              <Icon name='edit' />
            </IconButton>
            {/* Delete button */}
            <IconButton
              size='small'
              onClick={handleDelete}
              data-testid='exercise-group-card-delete'
              aria-label={t('common.delete')}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                },
              }}
            >
              <Icon name='delete' />
            </IconButton>
          </Stack>
        }
        data-testid='exercise-group-card-header'
      >
        {t('trainingPlan.editor.exerciseGroupType', { type: exerciseGroup.type })}
      </ActionCard.Header>

      <ActionCard.Content data-testid='exercise-group-card-content'>
        <Stack spacing={2}>
          {/* Group details */}
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            <Chip
              label={exerciseGroup.type}
              size='small'
              color='primary'
              variant='outlined'
              data-testid='exercise-group-card-type'
            />
            {exerciseGroup.rounds && (
              <Chip
                label={formatRounds(exerciseGroup.rounds)}
                size='small'
                variant='outlined'
                data-testid='exercise-group-card-rounds'
              />
            )}
            {exerciseGroup.duration_minutes && (
              <Chip
                label={formatDuration(exerciseGroup.duration_minutes)}
                size='small'
                variant='outlined'
                data-testid='exercise-group-card-duration'
              />
            )}
            {exerciseGroup.rest_time_seconds && (
              <Chip
                label={formatRestTime(exerciseGroup.rest_time_seconds)}
                size='small'
                variant='outlined'
                data-testid='exercise-group-card-rest-time'
              />
            )}
          </Stack>

          {/* Applied exercises */}
          {exerciseGroup.applied_exercises.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant='subtitle2'
                  gutterBottom
                  data-testid='exercise-group-card-exercises-title'
                >
                  {t('trainingPlan.editor.exercises')}
                </Typography>
                <Stack spacing={1.5}>
                  {exerciseGroup.applied_exercises.map((exercise, index) => (
                    <AppliedExerciseCard
                      key={exercise.id}
                      appliedExercise={exercise}
                      isFirst={index === 0}
                      isLast={index === exerciseGroup.applied_exercises.length - 1}
                      onReorder={onReorderExercise}
                      onEdit={onEditExercise}
                      onDelete={onDeleteExercise}
                      data-testid={`applied-exercise-card-${exercise.id}`}
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Add exercise button */}
          <Box>
            <Button
              variant='outlined'
              startIcon={<Icon name='add' />}
              onClick={handleAddExercise}
              fullWidth
              data-testid='exercise-group-card-add-exercise'
            >
              {t('trainingPlan.editor.addExercise')}
            </Button>
          </Box>
        </Stack>
      </ActionCard.Content>
    </ActionCard>
  );
};
