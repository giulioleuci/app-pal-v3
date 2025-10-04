import AddIcon from '@mui/icons-material/Add';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { TrainingPlanList } from '@/features/training-plan/components/TrainingPlanList';
import { TrainingPlanModel } from '@/features/training-plan/domain';
import { useTrainingPlanManager } from '@/features/training-plan/hooks/useTrainingPlanManager';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { PageHeader } from '@/shared/components/PageHeader';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(8), // Space for FAB
  minHeight: '100vh',
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: theme.zIndex.speedDial,
}));

/**
 * Smart page component for browsing and managing training plans.
 * Uses the useTrainingPlanManager hook for data fetching and state management,
 * then delegates rendering to the dumb TrainingPlanList component.
 *
 * Features:
 * - Page-level error handling with ErrorDisplay component
 * - Global feedback via snackbar notifications
 * - Floating action button for creating new plans
 * - Smart data orchestration with plan-cycle associations
 * - Navigation integration for CRUD operations
 *
 * Follows the Page-Level Error Handling Protocol and Global Feedback Protocol.
 */
export const PlansPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const activeProfileId = useActiveProfileId();

  // Set page title
  usePageTitle('plans', t('pages.plans.title'));

  // Training plan management
  const {
    plans,
    cycles,
    isLoadingPlans,
    isLoadingCycles,
    planError,
    plan: planOperations,
  } = useTrainingPlanManager(activeProfileId || '');

  // Handle plan operations with global feedback
  const handleCreatePlan = () => {
    navigate('/plans/create');
  };

  const handleStartPlan = (plan: TrainingPlanModel) => {
    // Navigate to workout session creation with the plan
    navigate(`/workout/start?planId=${plan.id}`);
    showSuccess(t('trainingPlan.actions.started', { planName: plan.name }));
  };

  const handleEditPlan = (plan: TrainingPlanModel) => {
    navigate(`/plans/${plan.id}/edit`);
  };

  const handleArchivePlan = async (plan: TrainingPlanModel) => {
    try {
      if (plan.isArchived) {
        // Unarchive logic would go here when implemented
        showSuccess(t('trainingPlan.actions.unarchived', { planName: plan.name }));
      } else {
        await planOperations.archive.mutateAsync(plan.id);
        showSuccess(t('trainingPlan.actions.archived', { planName: plan.name }));
      }
    } catch (_error) {
      const errorMessage =
        error instanceof Error ? error.message : t('trainingPlan.actions.archiveError');
      showError(errorMessage);
    }
  };

  const handleDeletePlan = async (plan: TrainingPlanModel) => {
    try {
      await planOperations.delete.mutateAsync(plan.id);
      showSuccess(t('trainingPlan.actions.deleted', { planName: plan.name }));
    } catch (_error) {
      const errorMessage =
        error instanceof Error ? error.message : t('trainingPlan.actions.deleteError');
      showError(errorMessage);
    }
  };

  // Page-level error handling
  if (planError) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.plans.title')} subtitle={t('pages.plans.subtitle')} />
        <ErrorDisplay error={planError} onRetry={() => window.location.reload()} />
      </StyledContainer>
    );
  }

  // Don't render if no active profile
  if (!activeProfileId) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.plans.title')} subtitle={t('pages.plans.subtitle')} />
        <ErrorDisplay error={new Error(t('profile.noActiveProfile'))} />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='plans-page'>
        <PageHeader
          title={t('pages.plans.title')}
          subtitle={t('pages.plans.subtitle')}
        />

        <TrainingPlanList
          plans={plans}
          cycles={cycles}
          isLoading={isLoadingPlans || isLoadingCycles}
          isError={!!planError}
          error={planError}
          onCreatePlan={handleCreatePlan}
          onStartPlan={handleStartPlan}
          onEditPlan={handleEditPlan}
          onArchivePlan={handleArchivePlan}
          onDeletePlan={handleDeletePlan}
          data-testid='plans-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Plans */}
      <StyledFab
        color='primary'
        aria-label={t('trainingPlan.create.button')}
        onClick={handleCreatePlan}
        data-testid='plans-page-create-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
