import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Stack from '@mui/material/Stack';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { CreateTrainingPlanDialog } from '@/features/training-plan/components/editor/CreateTrainingPlanDialog';
import { PlanStructureList } from '@/features/training-plan/components/editor/PlanStructureList';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

// Mock hook - replace with actual implementation
const usePlanEditorData = (planId?: string) => {
  // This would be replaced with actual data fetching logic
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock data structure
  const data = {
    plan: planId
      ? {
          id: planId,
          name: 'Full Body Workout',
          description: 'A comprehensive full body training plan',
          sessions: [
            {
              id: '1',
              name: 'Upper Body',
              notes: 'Focus on compound movements',
              execution_count: 3,
              is_deload: false,
              day_of_week: 'Monday',
            },
            {
              id: '2',
              name: 'Lower Body',
              notes: 'Heavy leg day',
              execution_count: 2,
              is_deload: false,
              day_of_week: 'Wednesday',
            },
            {
              id: '3',
              name: 'Deload Session',
              notes: 'Light recovery workout',
              execution_count: 1,
              is_deload: true,
              day_of_week: 'Friday',
            },
          ],
        }
      : null,
  };

  const createPlan = async (planData: { name: string; description?: string }) => {
    setIsLoading(true);
    try {
      // Mock creation logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Creating plan:', planData);
    } catch (err) {
      setError(err as Error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const reorderSession = async (sessionId: string, direction: 'up' | 'down') => {
    console.log('Reordering session:', sessionId, direction);
  };

  const editSession = async (sessionId: string) => {
    console.log('Editing session:', sessionId);
  };

  const deleteSession = async (sessionId: string) => {
    console.log('Deleting session:', sessionId);
  };

  const addSession = async () => {
    console.log('Adding new session');
  };

  return {
    data,
    isLoading,
    isError,
    error,
    createPlan,
    reorderSession,
    editSession,
    deleteSession,
    addSession,
  };
};

/**
 * A smart page component for editing training plan structure.
 * Manages the state and data fetching for plan editing, then passes data down
 * to the PlanStructureList component. Follows the Data-First Design Protocol.
 *
 * Features:
 * - PageHeader with back button and page title management
 * - Global feedback via snackbar notifications
 * - Error handling with ErrorDisplay component
 * - Empty state handling for new plans
 * - Floating action button for creating new plans
 *
 * @example
 * Route: /plan-editor/:id?
 * ```tsx
 * <Route path="/plan-editor/:id?" element={<PlanEditorPage />} />
 * ```
 */
export const PlanEditorPage = () => {
  const { t } = useAppTranslation();
  const { id: planId } = useParams<{ id?: string }>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Set page title
  usePageTitle('planEditor', planId ? t('pageTitles.editPlan') : t('pageTitles.createPlan'));

  // Data-First Design Protocol: Fetch data and map to presentation
  const {
    data,
    isLoading,
    isError,
    error,
    createPlan,
    reorderSession,
    editSession,
    deleteSession,
    addSession,
  } = usePlanEditorData(planId);

  // Handle error state
  if (isError && error) {
    return (
      <Container maxWidth='md' sx={{ py: 3 }}>
        <PageHeader title={t('pageTitles.planEditor')} showBackButton />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='plan-editor-error'
        />
      </Container>
    );
  }

  // Handle creating a new plan
  const handleCreatePlan = async (planData: { name: string; description?: string }) => {
    try {
      await createPlan(planData);
      // Show success notification
      // The global snackbar would be triggered here in a real implementation
    } catch (err) {
      // Error handling is managed by the hook
      console.error('Failed to create plan:', err);
    }
  };

  // Handle session actions with global feedback
  const handleReorderSession = async (sessionId: string, direction: 'up' | 'down') => {
    try {
      await reorderSession(sessionId, direction);
      // Show success notification
    } catch (err) {
      console.error('Failed to reorder session:', err);
    }
  };

  const handleEditSession = (sessionId: string) => {
    editSession(sessionId);
    // Navigate to session editor or open edit dialog
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      // Show success notification
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleAddSession = async () => {
    try {
      await addSession();
      // Show success notification
    } catch (err) {
      console.error('Failed to add session:', err);
    }
  };

  return (
    <Container maxWidth='md' sx={{ py: 3 }} data-testid='plan-editor-page'>
      <PageHeader
        title={planId ? data.plan?.name || t('pageTitles.editPlan') : t('pageTitles.createPlan')}
        subtitle={planId ? data.plan?.description : undefined}
        showBackButton
        data-testid='plan-editor-page-header'
      />

      <Stack spacing={3}>
        {!planId ? (
          // Empty state for new plan creation
          <EmptyState
            icon='add'
            title={t('trainingPlan.editor.noPlanSelected')}
            description={t('trainingPlan.editor.createFirstPlan')}
            actionLabel={t('trainingPlan.editor.createPlan')}
            onAction={() => setIsCreateDialogOpen(true)}
            data-testid='plan-editor-empty-state'
          />
        ) : data.plan?.sessions && data.plan.sessions.length > 0 ? (
          // Plan structure list
          <PlanStructureList
            sessions={data.plan.sessions}
            onReorderSession={handleReorderSession}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSession}
            onAddSession={handleAddSession}
            isLoading={isLoading}
            data-testid='plan-editor-structure-list'
          />
        ) : (
          // Empty state for plan with no sessions
          <EmptyState
            icon='workout'
            title={t('trainingPlan.editor.noSessions')}
            description={t('trainingPlan.editor.addFirstSession')}
            actionLabel={t('trainingPlan.editor.addSession')}
            onAction={handleAddSession}
            data-testid='plan-editor-no-sessions'
          />
        )}
      </Stack>

      {/* Floating action button for creating new plans */}
      {!planId && (
        <Fab
          color='primary'
          aria-label={t('trainingPlan.editor.createPlan')}
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid='plan-editor-create-fab'
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Icon name='add' />
        </Fab>
      )}

      {/* Create plan dialog */}
      <CreateTrainingPlanDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreatePlan={handleCreatePlan}
        isLoading={isLoading}
        data-testid='plan-editor-create-dialog'
      />
    </Container>
  );
};
