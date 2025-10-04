import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { TrainingCycleModel, TrainingPlanModel } from '@/features/training-plan/domain';
import { EmptyState } from '@/shared/components/EmptyState';
import { PaginatedCardList } from '@/shared/components/PaginatedCardList';

import { TrainingPlanCard, TrainingPlanCardSkeleton } from './TrainingPlanCard';

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const SkeletonContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(2),
  width: '100%',
}));

export interface TrainingPlanListProps {
  /**
   * Array of training plans to display
   */
  plans: TrainingPlanModel[];
  /**
   * Array of training cycles for associating with plans
   */
  cycles?: TrainingCycleModel[];
  /**
   * Whether the data is currently loading
   */
  isLoading?: boolean;
  /**
   * Whether there was an error loading the data
   */
  isError?: boolean;
  /**
   * The error that occurred (if any)
   */
  error?: Error | null;
  /**
   * Callback when user wants to create a new plan
   */
  onCreatePlan?: () => void;
  /**
   * Callback when user wants to start a plan
   */
  onStartPlan?: (plan: TrainingPlanModel) => void;
  /**
   * Callback when user wants to edit a plan
   */
  onEditPlan?: (plan: TrainingPlanModel) => void;
  /**
   * Callback when user wants to archive a plan
   */
  onArchivePlan?: (plan: TrainingPlanModel) => void;
  /**
   * Callback when user wants to delete a plan
   */
  onDeletePlan?: (plan: TrainingPlanModel) => void;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A "dumb" component for displaying a list of training plans.
 * Uses the PaginatedCardList component for consistent pagination and search functionality.
 * Handles loading states with skeletons and empty states with contextual onboarding.
 *
 * Features:
 * - Skeleton loading state that prevents layout shift
 * - Animated transitions between states using framer-motion
 * - Search functionality for plan names and descriptions
 * - Empty state with onboarding guidance
 * - Responsive card grid layout
 *
 * @example
 * ```tsx
 * <TrainingPlanList
 *   plans={plans}
 *   cycles={cycles}
 *   isLoading={isLoadingPlans}
 *   onCreatePlan={() => navigate('/plans/create')}
 *   onStartPlan={(plan) => console.log('Starting', plan.name)}
 *   onEditPlan={(plan) => navigate(`/plans/${plan.id}/edit`)}
 *   onArchivePlan={handleArchive}
 *   onDeletePlan={handleDelete}
 * />
 * ```
 */
export const TrainingPlanList = ({
  plans,
  cycles = [],
  isLoading = false,
  isError = false,
  error,
  onCreatePlan,
  onStartPlan,
  onEditPlan,
  onArchivePlan,
  onDeletePlan,
  'data-testid': testId = 'training-plan-list',
}: TrainingPlanListProps) => {
  const { t } = useTranslation();

  // Create a map of cycle ID to cycle for efficient lookup
  const cycleMap = useMemo(() => {
    const map = new Map<string, TrainingCycleModel>();
    cycles.forEach((cycle) => {
      map.set(cycle.id, cycle);
    });
    return map;
  }, [cycles]);

  // Get searchable text from a training plan
  const getSearchableText = (plan: TrainingPlanModel): string => {
    const cycle = plan.cycleId ? cycleMap.get(plan.cycleId) : null;
    const cycleText = cycle ? ` ${cycle.name} ${cycle.goal}` : '';
    return `${plan.name} ${plan.description || ''}${cycleText}`;
  };

  // Render a single training plan card
  const renderCard = (plan: TrainingPlanModel) => {
    const associatedCycle = plan.cycleId ? cycleMap.get(plan.cycleId) : undefined;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        key={plan.id}
      >
        <TrainingPlanCard
          plan={plan}
          cycle={associatedCycle}
          onStart={onStartPlan}
          onEdit={onEditPlan}
          onArchive={onArchivePlan}
          onDelete={onDeletePlan}
          data-testid={`${testId}-card-${plan.id}`}
        />
      </motion.div>
    );
  };

  // Loading state with skeletons
  if (isLoading) {
    return (
      <StyledGrid data-testid={`${testId}-loading`}>
        <SkeletonContainer>
          {Array.from({ length: 6 }, (_, index) => (
            <TrainingPlanCardSkeleton key={index} data-testid={`${testId}-skeleton-${index}`} />
          ))}
        </SkeletonContainer>
      </StyledGrid>
    );
  }

  // Error state
  if (isError) {
    return (
      <EmptyState
        title={t('trainingPlan.list.error.title')}
        description={error?.message || t('trainingPlan.list.error.description')}
        action={
          <Button variant='outlined' onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        }
        data-testid={`${testId}-error`}
      />
    );
  }

  // Empty state
  const emptyState = {
    title: t('trainingPlan.list.empty.title'),
    description: t('trainingPlan.list.empty.description'),
    action: onCreatePlan ? (
      <Button
        variant='contained'
        startIcon={<AddIcon />}
        onClick={onCreatePlan}
        data-testid={`${testId}-create-button`}
      >
        {t('trainingPlan.create.button')}
      </Button>
    ) : undefined,
  };

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        data-testid={testId}
      >
        <PaginatedCardList
          items={plans}
          renderCard={renderCard}
          getSearchableText={getSearchableText}
          getItemKey={(plan) => plan.id}
          itemsPerPage={12}
          searchPlaceholder={t('trainingPlan.list.searchPlaceholder')}
          emptyState={emptyState}
          data-testid={`${testId}-paginated-list`}
        />
      </motion.div>
    </AnimatePresence>
  );
};
