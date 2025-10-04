import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TrainingCycleModel, TrainingPlanModel } from '@/features/training-plan/domain';
import { ActionCard } from '@/shared/components/ActionCard';

export interface TrainingPlanCardProps {
  /**
   * The training plan to display
   */
  plan: TrainingPlanModel;
  /**
   * The associated training cycle (if any)
   */
  cycle?: TrainingCycleModel;
  /**
   * Callback when user wants to start the plan
   */
  onStart?: (plan: TrainingPlanModel) => void;
  /**
   * Callback when user wants to edit the plan
   */
  onEdit?: (plan: TrainingPlanModel) => void;
  /**
   * Callback when user wants to archive the plan
   */
  onArchive?: (plan: TrainingPlanModel) => void;
  /**
   * Callback when user wants to delete the plan
   */
  onDelete?: (plan: TrainingPlanModel) => void;
  /**
   * Whether the plan is currently being processed
   */
  isLoading?: boolean;
  /**
   * Test identifier for the card
   */
  'data-testid'?: string;
}

export interface TrainingPlanCardSkeletonProps {
  /**
   * Test identifier for the skeleton
   */
  'data-testid'?: string;
}

/**
 * Skeleton component for loading state that matches the TrainingPlanCard layout
 */
export const TrainingPlanCardSkeleton = ({
  'data-testid': testId = 'training-plan-card-skeleton',
}: TrainingPlanCardSkeletonProps) => {
  return (
    <ActionCard data-testid={testId}>
      <ActionCard.Header>
        <Skeleton variant='text' width='60%' height={32} />
      </ActionCard.Header>
      <ActionCard.Content>
        <Skeleton variant='text' width='100%' height={20} sx={{ mb: 1 }} />
        <Skeleton variant='text' width='80%' height={20} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' width='100%' height={24} sx={{ borderRadius: 1 }} />
      </ActionCard.Content>
      <ActionCard.Actions>
        <Skeleton variant='circular' width={40} height={40} />
        <Skeleton variant='circular' width={40} height={40} />
        <Skeleton variant='circular' width={40} height={40} />
      </ActionCard.Actions>
    </ActionCard>
  );
};

/**
 * A training plan card component that displays plan information and actions.
 * Built using the ActionCard pattern for consistency with other app cards.
 * Displays plan metadata, associated cycle information, and provides
 * action buttons for starting, editing, archiving, and deleting plans.
 *
 * @example
 * ```tsx
 * <TrainingPlanCard
 *   plan={plan}
 *   cycle={associatedCycle}
 *   onStart={(plan) => console.log('Starting plan:', plan.name)}
 *   onEdit={(plan) => navigate(`/plans/${plan.id}/edit`)}
 *   onArchive={handleArchivePlan}
 *   onDelete={handleDeletePlan}
 * />
 * ```
 */
export const TrainingPlanCard = ({
  plan,
  cycle,
  onStart,
  onEdit,
  onArchive,
  onDelete,
  isLoading = false,
  'data-testid': testId = 'training-plan-card',
}: TrainingPlanCardProps) => {
  const { t } = useTranslation();

  // Format the plan description
  const description = plan.description || t('trainingPlan.noDescription');

  // Get cycle information
  const cycleInfo = cycle
    ? {
        name: cycle.name,
        goal: cycle.goal,
        isActive: cycle.isActive(new Date()),
        progress: cycle.getCompletionPercentage(new Date()),
      }
    : null;

  // Format session count
  const sessionCount = plan.getTotalSessions();
  const sessionLabel = t('trainingPlan.sessionCount', { count: sessionCount });

  // Handle action clicks
  const handleStart = () => onStart?.(plan);
  const handleEdit = () => onEdit?.(plan);
  const handleArchive = () => onArchive?.(plan);
  const handleDelete = () => onDelete?.(plan);

  if (isLoading) {
    return <TrainingPlanCardSkeleton data-testid={`${testId}-loading`} />;
  }

  return (
    <ActionCard data-testid={testId}>
      <ActionCard.Header data-testid={`${testId}-header`}>
        <Typography variant='h6' component='h3'>
          {plan.name}
        </Typography>
      </ActionCard.Header>

      <ActionCard.Content data-testid={`${testId}-content`}>
        {/* Plan Description */}
        <Typography
          variant='body2'
          color='text.secondary'
          paragraph
          data-testid={`${testId}-description`}
        >
          {description}
        </Typography>

        {/* Session Count */}
        <Typography variant='body2' sx={{ mb: 2 }} data-testid={`${testId}-session-count`}>
          {sessionLabel}
        </Typography>

        {/* Cycle Information */}
        {cycleInfo && (
          <Chip
            label={`${cycleInfo.name} • ${t(`trainingCycle.goal.${cycleInfo.goal}`)}`}
            color={cycleInfo.isActive ? 'primary' : 'default'}
            variant={cycleInfo.isActive ? 'filled' : 'outlined'}
            size='small'
            data-testid={`${testId}-cycle-chip`}
          />
        )}

        {/* Archived Status */}
        {plan.isArchived && (
          <Chip
            label={t('trainingPlan.archived')}
            color='warning'
            variant='outlined'
            size='small'
            sx={{ mt: cycleInfo ? 1 : 0 }}
            data-testid={`${testId}-archived-chip`}
          />
        )}
      </ActionCard.Content>

      <ActionCard.Actions data-testid={`${testId}-actions`}>
        {/* Start Plan Action */}
        {!plan.isArchived && (
          <IconButton
            onClick={handleStart}
            disabled={!onStart}
            color='primary'
            aria-label={t('trainingPlan.actions.start')}
            data-testid={`${testId}-start-button`}
          >
            <PlayArrowIcon />
          </IconButton>
        )}

        {/* Edit Plan Action */}
        <IconButton
          onClick={handleEdit}
          disabled={!onEdit}
          aria-label={t('trainingPlan.actions.edit')}
          data-testid={`${testId}-edit-button`}
        >
          <EditIcon />
        </IconButton>

        {/* Archive/Unarchive Plan Action */}
        <IconButton
          onClick={handleArchive}
          disabled={!onArchive}
          color={plan.isArchived ? 'default' : 'warning'}
          aria-label={
            plan.isArchived
              ? t('trainingPlan.actions.unarchive')
              : t('trainingPlan.actions.archive')
          }
          data-testid={`${testId}-archive-button`}
        >
          <ArchiveIcon />
        </IconButton>

        {/* Delete Plan Action */}
        <IconButton
          onClick={handleDelete}
          disabled={!onDelete}
          color='error'
          aria-label={t('trainingPlan.actions.delete')}
          data-testid={`${testId}-delete-button`}
        >
          <DeleteIcon />
        </IconButton>
      </ActionCard.Actions>
    </ActionCard>
  );
};
