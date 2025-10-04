import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import { ActionCard } from '@/shared/components/ActionCard';
import { Icon } from '@/shared/components/Icon';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

import { AppliedExercise } from './SessionContentEditor';

export interface AppliedExerciseCardProps {
  /**
   * The applied exercise data to display
   */
  appliedExercise: AppliedExercise;
  /**
   * Whether this is the first exercise in the group
   */
  isFirst?: boolean;
  /**
   * Whether this is the last exercise in the group
   */
  isLast?: boolean;
  /**
   * Callback fired when the exercise should be reordered
   */
  onReorder?: (exerciseId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when the exercise should be edited
   */
  onEdit?: (exerciseId: string) => void;
  /**
   * Callback fired when the exercise should be deleted
   */
  onDelete?: (exerciseId: string) => void;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A nested card component that displays an applied exercise with its configuration details
 * and controls for reordering, editing, and deleting. This is a smaller, more compact
 * version of the ActionCard design to fit within exercise groups.
 *
 * @example
 * ```tsx
 * <AppliedExerciseCard
 *   appliedExercise={appliedExercise}
 *   isFirst={false}
 *   isLast={false}
 *   onReorder={handleReorder}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const AppliedExerciseCard = ({
  appliedExercise,
  isFirst = false,
  isLast = false,
  onReorder,
  onEdit,
  onDelete,
  'data-testid': testId = 'applied-exercise-card',
}: AppliedExerciseCardProps) => {
  const { t } = useAppTranslation();

  const handleMoveUp = () => {
    onReorder?.(appliedExercise.id, 'up');
  };

  const handleMoveDown = () => {
    onReorder?.(appliedExercise.id, 'down');
  };

  const handleEdit = () => {
    onEdit?.(appliedExercise.id);
  };

  const handleDelete = () => {
    onDelete?.(appliedExercise.id);
  };

  const formatSetConfiguration = (config: AppliedExercise['set_configuration']) => {
    const parts = [];
    parts.push(t('trainingPlan.editor.sets', { count: config.sets }));

    if (config.reps) {
      parts.push(t('trainingPlan.editor.reps', { count: config.reps }));
    }

    if (config.duration_seconds) {
      const minutes = Math.floor(config.duration_seconds / 60);
      const seconds = config.duration_seconds % 60;
      if (minutes > 0) {
        parts.push(t('trainingPlan.editor.durationMinutesSeconds', { minutes, seconds }));
      } else {
        parts.push(t('trainingPlan.editor.durationSeconds', { seconds }));
      }
    }

    if (config.weight_percentage) {
      parts.push(
        t('trainingPlan.editor.weightPercentage', { percentage: config.weight_percentage })
      );
    }

    return parts.join(' × ');
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
    <Box
      data-testid={testId}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        backgroundColor: 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Stack spacing={1.5}>
        {/* Header with exercise name and controls */}
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography
            variant='subtitle2'
            component='h4'
            fontWeight='medium'
            data-testid='applied-exercise-card-name'
            sx={{ flex: 1, mr: 1 }}
          >
            {appliedExercise.exercise_name}
          </Typography>

          <Stack direction='row' spacing={0.5}>
            {/* Reorder controls */}
            <IconButton
              size='small'
              disabled={isFirst}
              onClick={handleMoveUp}
              data-testid='applied-exercise-card-move-up'
              aria-label={t('trainingPlan.editor.moveUp')}
            >
              <Icon name='arrow-back' sx={{ transform: 'rotate(90deg)', fontSize: 16 }} />
            </IconButton>
            <IconButton
              size='small'
              disabled={isLast}
              onClick={handleMoveDown}
              data-testid='applied-exercise-card-move-down'
              aria-label={t('trainingPlan.editor.moveDown')}
            >
              <Icon name='arrow-forward' sx={{ transform: 'rotate(90deg)', fontSize: 16 }} />
            </IconButton>
            {/* Edit button */}
            <IconButton
              size='small'
              onClick={handleEdit}
              data-testid='applied-exercise-card-edit'
              aria-label={t('common.edit')}
            >
              <Icon name='edit' sx={{ fontSize: 16 }} />
            </IconButton>
            {/* Delete button */}
            <IconButton
              size='small'
              onClick={handleDelete}
              data-testid='applied-exercise-card-delete'
              aria-label={t('common.delete')}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                },
              }}
            >
              <Icon name='delete' sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Stack>

        {/* Exercise configuration details */}
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Chip
            label={formatSetConfiguration(appliedExercise.set_configuration)}
            size='small'
            variant='filled'
            color='primary'
            data-testid='applied-exercise-card-configuration'
          />

          <Chip
            label={t('trainingPlan.editor.executionCount', {
              count: appliedExercise.execution_count,
            })}
            size='small'
            variant='outlined'
            data-testid='applied-exercise-card-execution-count'
          />

          {appliedExercise.rest_time_seconds && (
            <Chip
              label={formatRestTime(appliedExercise.rest_time_seconds)}
              size='small'
              variant='outlined'
              data-testid='applied-exercise-card-rest-time'
            />
          )}
        </Stack>

        {/* Set configuration type indicator */}
        <Box>
          <Typography
            variant='caption'
            color='text.secondary'
            data-testid='applied-exercise-card-type'
          >
            {t('trainingPlan.editor.setType', { type: appliedExercise.set_configuration.type })}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};
