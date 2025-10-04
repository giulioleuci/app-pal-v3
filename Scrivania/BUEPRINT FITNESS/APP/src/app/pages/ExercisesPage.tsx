import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { ExerciseCard } from '@/features/exercise/components/ExerciseCard';
import { ExerciseDetailDialog } from '@/features/exercise/components/ExerciseDetailDialog';
import { useExerciseCRUD } from '@/features/exercise/hooks/useExerciseCRUD';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { PageHeader } from '@/shared/components/PageHeader';
import { VirtualizedCardList } from '@/shared/components/VirtualizedCardList';
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

interface ExerciseItem {
  id: string;
  name: string;
  description: string;
  category: string;
  movementType: string;
  movementPattern?: string;
  difficulty: string;
  equipment: string[]; // Parsed from JSON string
  muscleActivation: Record<string, number>; // Parsed from JSON string
  counterType: string;
  jointType: string;
  notes?: string;
  substitutions: string[]; // Parsed from JSON string
  createdAt: number;
  updatedAt: number;
}

/**
 * Smart page component for browsing and managing exercises with virtualization.
 * Uses the useExerciseCRUD hook for data fetching and CRUD operations,
 * and the VirtualizedCardList component for efficient rendering.
 *
 * Features:
 * - Virtualized rendering for large exercise databases
 * - Page-level error handling with ErrorDisplay component
 * - Global feedback via snackbar notifications
 * - Floating action button for creating new exercises
 * - Contextual onboarding via EmptyState component
 * - Search and filter functionality across exercise fields
 * - Visual representation of exercise metadata (equipment, muscle groups, etc.)
 *
 * Follows the Page-Level Error Handling Protocol and Global Feedback Protocol.
 */
export const ExercisesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const activeProfileId = useActiveProfileId();

  // State for exercise detail dialog
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);

  // Set page title
  usePageTitle('exercises', t('pages.exercises.title'));

  // Exercise CRUD operations
  const {
    data: exercises,
    isLoading,
    isError,
    error,
    create: createExercise,
    update: updateExercise,
    delete: deleteExercise,
  } = useExerciseCRUD(activeProfileId || '');

  // Handle exercise creation
  const handleCreateExercise = () => {
    navigate('/exercises/create');
  };

  // Handle view exercise details
  const handleViewExerciseDetails = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setIsDetailDialogOpen(true);
  };

  // Handle edit exercise
  const handleEditExercise = (exerciseId: string) => {
    navigate(`/exercises/edit/${exerciseId}`);
  };

  // Handle close detail dialog
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedExerciseId(null);
  };

  // Handle exercise deletion with confirmation
  const handleDeleteExercise = async (exercise: ExerciseItem) => {
    try {
      await deleteExercise.mutateAsync(exercise.id);
      showSuccess(t('exercise.actions.deleted', { exerciseName: exercise.name }));
    } catch (_error) {
      const errorMessage =
        error instanceof Error ? error.message : t('exercise.actions.deleteError');
      showError(errorMessage);
    }
  };

  // Render individual exercise card
  const renderExerciseItem = (exercise: ExerciseItem, index: number) => {
    return (
      <ExerciseCard
        key={exercise.id}
        id={exercise.id}
        name={exercise.name}
        description={exercise.description}
        category={exercise.category}
        movementType={exercise.movementType}
        movementPattern={exercise.movementPattern}
        difficulty={exercise.difficulty}
        equipment={exercise.equipment}
        muscleActivation={exercise.muscleActivation}
        counterType={exercise.counterType}
        jointType={exercise.jointType}
        notes={exercise.notes}
        substitutions={exercise.substitutions}
        createdAt={exercise.createdAt}
        updatedAt={exercise.updatedAt}
        onViewDetails={handleViewExerciseDetails}
        onEditExercise={handleEditExercise}
        data-testid={`exercise-item-${index}`}
      />
    );
  };

  // Loading skeleton for VirtualizedCardList
  const renderLoadingSkeleton = () => (
    <Box sx={{ mb: 2 }}>
      <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 2 }} />
    </Box>
  );

  // Empty state component
  const renderEmptyState = () => (
    <EmptyState
      icon='FitnessCenter'
      title={t('exercises.empty.title')}
      description={t('exercises.empty.description')}
      actionLabel={t('exercises.empty.action')}
      onAction={handleCreateExercise}
      data-testid='exercises-empty-state'
    />
  );

  // Page-level error handling
  if (isError && error) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.exercises.title')} subtitle={t('pages.exercises.subtitle')} />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='exercises-page-error'
        />
      </StyledContainer>
    );
  }

  // Don't render if no active profile
  if (!activeProfileId) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader title={t('pages.exercises.title')} subtitle={t('pages.exercises.subtitle')} />
        <ErrorDisplay
          error={new Error(t('profile.noActiveProfile'))}
          data-testid='exercises-page-no-profile'
        />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='exercises-page'>
        <PageHeader
          title={t('pages.exercises.title')}
          subtitle={t('pages.exercises.subtitle')}
          data-testid='exercises-page-header'
        />

        <VirtualizedCardList
          data={exercises || []}
          renderItem={renderExerciseItem}
          renderLoadingSkeleton={renderLoadingSkeleton}
          renderEmptyState={renderEmptyState}
          isLoading={isLoading}
          isEmpty={(exercises || []).length === 0}
          searchPlaceholder={t('exercises.search.placeholder')}
          searchFields={['name', 'description', 'category', 'movementType', 'notes']}
          data-testid='exercises-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Exercises */}
      <StyledFab
        color='primary'
        aria-label={t('exercise.create.button')}
        onClick={handleCreateExercise}
        data-testid='exercises-page-create-fab'
      >
        <AddIcon />
      </StyledFab>

      {/* Exercise Detail Dialog */}
      {selectedExerciseId && (
        <ExerciseDetailDialog
          open={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          id={exercises?.find((e) => e.id === selectedExerciseId)?.id || ''}
          name={exercises?.find((e) => e.id === selectedExerciseId)?.name || ''}
          description={exercises?.find((e) => e.id === selectedExerciseId)?.description || ''}
          category={exercises?.find((e) => e.id === selectedExerciseId)?.category || ''}
          movementType={exercises?.find((e) => e.id === selectedExerciseId)?.movementType || ''}
          movementPattern={exercises?.find((e) => e.id === selectedExerciseId)?.movementPattern}
          difficulty={exercises?.find((e) => e.id === selectedExerciseId)?.difficulty || ''}
          equipment={exercises?.find((e) => e.id === selectedExerciseId)?.equipment || []}
          muscleActivation={
            exercises?.find((e) => e.id === selectedExerciseId)?.muscleActivation || {}
          }
          counterType={exercises?.find((e) => e.id === selectedExerciseId)?.counterType || ''}
          jointType={exercises?.find((e) => e.id === selectedExerciseId)?.jointType || ''}
          notes={exercises?.find((e) => e.id === selectedExerciseId)?.notes}
          substitutions={exercises?.find((e) => e.id === selectedExerciseId)?.substitutions || []}
          createdAt={exercises?.find((e) => e.id === selectedExerciseId)?.createdAt || 0}
          updatedAt={exercises?.find((e) => e.id === selectedExerciseId)?.updatedAt || 0}
          onEditExercise={handleEditExercise}
          data-testid='exercises-page-detail-dialog'
        />
      )}
    </>
  );
};
