import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import { ActionCard } from '@/shared/components/ActionCard';
import { Icon } from '@/shared/components/Icon';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

import { Session } from './PlanStructureList';

export interface SessionCardProps {
  /**
   * The session data to display
   */
  session: Session;
  /**
   * Whether this is the first session in the list
   */
  isFirst?: boolean;
  /**
   * Whether this is the last session in the list
   */
  isLast?: boolean;
  /**
   * Callback fired when the session should be reordered
   */
  onReorder?: (sessionId: string, direction: 'up' | 'down') => void;
  /**
   * Callback fired when the session should be edited
   */
  onEdit?: (sessionId: string) => void;
  /**
   * Callback fired when the session should be deleted
   */
  onDelete?: (sessionId: string) => void;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A card component that displays a workout session with controls for reordering, editing, and deleting.
 * Uses the ActionCard component to provide consistent styling and behavior.
 *
 * @example
 * ```tsx
 * <SessionCard
 *   session={session}
 *   isFirst={false}
 *   isLast={false}
 *   onReorder={handleReorder}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export const SessionCard = ({
  session,
  isFirst = false,
  isLast = false,
  onReorder,
  onEdit,
  onDelete,
  'data-testid': testId = 'session-card',
}: SessionCardProps) => {
  const { t } = useAppTranslation();

  const handleMoveUp = () => {
    onReorder?.(session.id, 'up');
  };

  const handleMoveDown = () => {
    onReorder?.(session.id, 'down');
  };

  const handleEdit = () => {
    onEdit?.(session.id);
  };

  const handleDelete = () => {
    onDelete?.(session.id);
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
              data-testid='session-card-move-up'
              aria-label={t('trainingPlan.editor.moveUp')}
            >
              <Icon name='arrow-back' sx={{ transform: 'rotate(90deg)' }} />
            </IconButton>
            <IconButton
              size='small'
              disabled={isLast}
              onClick={handleMoveDown}
              data-testid='session-card-move-down'
              aria-label={t('trainingPlan.editor.moveDown')}
            >
              <Icon name='arrow-forward' sx={{ transform: 'rotate(90deg)' }} />
            </IconButton>
            {/* Edit button */}
            <IconButton
              size='small'
              onClick={handleEdit}
              data-testid='session-card-edit'
              aria-label={t('common.edit')}
            >
              <Icon name='edit' />
            </IconButton>
            {/* Delete button */}
            <IconButton
              size='small'
              onClick={handleDelete}
              data-testid='session-card-delete'
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
        data-testid='session-card-header'
      >
        {session.name}
      </ActionCard.Header>

      <ActionCard.Content data-testid='session-card-content'>
        <Stack spacing={2}>
          {/* Session details */}
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            <Chip
              label={t('trainingPlan.editor.executionCount', { count: session.execution_count })}
              size='small'
              variant='outlined'
              data-testid='session-card-execution-count'
            />
            {session.is_deload && (
              <Chip
                label={t('trainingPlan.editor.deloadSession')}
                size='small'
                color='warning'
                variant='outlined'
                data-testid='session-card-deload-indicator'
              />
            )}
            {session.day_of_week && (
              <Chip
                label={t('trainingPlan.editor.dayOfWeek', { day: session.day_of_week })}
                size='small'
                variant='outlined'
                data-testid='session-card-day-of-week'
              />
            )}
          </Stack>

          {/* Session notes */}
          {session.notes && (
            <Box>
              <Typography variant='body2' color='text.secondary' data-testid='session-card-notes'>
                {session.notes}
              </Typography>
            </Box>
          )}
        </Stack>
      </ActionCard.Content>
    </ActionCard>
  );
};
