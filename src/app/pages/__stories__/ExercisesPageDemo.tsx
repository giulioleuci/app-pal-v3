import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { PageHeader } from '@/shared/components/PageHeader';
import { VirtualizedCardList } from '@/shared/components/VirtualizedCardList';

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

const ExerciseCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ChipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
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

interface ExercisesPageDemoProps {
  exercises?: ExerciseItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
}

/**
 * Demo version of ExercisesPage for Storybook that accepts mock data as props.
 * This version doesn't use database hooks and is safe for browser environments.
 */
export const ExercisesPageDemo: React.FC<ExercisesPageDemoProps> = ({
  exercises = [],
  isLoading = false,
  isError = false,
  error = null,
  isEmpty = false,
}) => {
  const { t } = useTranslation();

  // Handle exercise creation
  const handleCreateExercise = () => {
    console.log('Create exercise clicked');
  };

  // Handle exercise item click
  const handleExerciseClick = (exercise: ExerciseItem) => {
    console.log('Exercise clicked:', exercise.id);
  };

  // Get primary muscle groups from muscle activation data
  const getPrimaryMuscles = (muscleActivation: Record<string, number>) => {
    return Object.entries(muscleActivation)
      .filter(([_, activation]) => activation >= 0.7) // Primary activation threshold
      .map(([muscle, _]) => muscle)
      .slice(0, 3); // Limit to 3 primary muscles
  };

  // Render individual exercise card
  const renderExerciseItem = (exercise: ExerciseItem, index: number) => {
    const primaryMuscles = getPrimaryMuscles(exercise.muscleActivation);
    const equipment = Array.isArray(exercise.equipment) ? exercise.equipment : [];

    return (
      <ExerciseCard
        key={exercise.id}
        onClick={() => handleExerciseClick(exercise)}
        data-testid={`exercise-item-${index}`}
        sx={{ cursor: 'pointer' }}
      >
        <CardContent>
          <Typography variant='h6' component='h3' gutterBottom>
            {exercise.name}
          </Typography>

          {exercise.description && (
            <Typography variant='body2' color='text.secondary' gutterBottom>
              {exercise.description}
            </Typography>
          )}

          <ChipContainer>
            <Chip label={exercise.category} size='small' color='primary' variant='outlined' />
            <Chip
              label={exercise.difficulty}
              size='small'
              color={
                exercise.difficulty === 'beginner'
                  ? 'success'
                  : exercise.difficulty === 'intermediate'
                    ? 'warning'
                    : 'error'
              }
              variant='outlined'
            />
            {equipment.slice(0, 2).map((item, idx) => (
              <Chip key={idx} label={item} size='small' variant='outlined' />
            ))}
            {equipment.length > 2 && (
              <Chip label={`+${equipment.length - 2}`} size='small' variant='outlined' />
            )}
          </ChipContainer>

          {primaryMuscles.length > 0 && (
            <ChipContainer>
              <Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
                {t('exercise.primaryMuscles', 'Primary Muscles')}:
              </Typography>
              {primaryMuscles.map((muscle, idx) => (
                <Chip key={idx} label={muscle} size='small' color='secondary' variant='filled' />
              ))}
            </ChipContainer>
          )}

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}
          >
            <Typography variant='caption' color='text.secondary'>
              {exercise.movementType} • {exercise.jointType}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {exercise.counterType}
            </Typography>
          </Box>
        </CardContent>
      </ExerciseCard>
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
      title={t('exercises.empty.title', 'No exercises found')}
      description={t(
        'exercises.empty.description',
        'Create your first exercise to build your library'
      )}
      actionLabel={t('exercises.empty.action', 'Create Exercise')}
      onAction={handleCreateExercise}
      data-testid='exercises-empty-state'
    />
  );

  // Page-level error handling
  if (isError && error) {
    return (
      <StyledContainer maxWidth='lg'>
        <PageHeader
          title={t('pages.exercises.title', 'Exercise Library')}
          subtitle={t('pages.exercises.subtitle', 'Manage your exercise database')}
        />
        <ErrorDisplay
          error={error}
          onRetry={() => window.location.reload()}
          data-testid='exercises-page-error'
        />
      </StyledContainer>
    );
  }

  return (
    <>
      <StyledContainer maxWidth='lg' data-testid='exercises-page'>
        <PageHeader
          title={t('pages.exercises.title', 'Exercise Library')}
          subtitle={t('pages.exercises.subtitle', 'Manage your exercise database')}
          data-testid='exercises-page-header'
        />

        <VirtualizedCardList
          items={exercises}
          renderCard={renderExerciseItem}
          getItemKey={(item) => item.id}
          estimateSize={180}
          getSearchableText={(item) =>
            `${item.name} ${item.description} ${item.category} ${item.movementType} ${item.notes || ''}`
          }
          isLoading={isLoading}
          searchPlaceholder={t('exercises.search.placeholder', 'Search exercises...')}
          emptyState={
            isEmpty || exercises.length === 0
              ? {
                  title: t('exercises.empty.title', 'No exercises found'),
                  description: t(
                    'exercises.empty.description',
                    'Create your first exercise to build your library'
                  ),
                  action: undefined,
                }
              : undefined
          }
          data-testid='exercises-page-list'
        />
      </StyledContainer>

      {/* Floating Action Button for Creating Exercises */}
      <StyledFab
        color='primary'
        aria-label={t('exercise.create.button', 'Create Exercise')}
        onClick={handleCreateExercise}
        data-testid='exercises-page-create-fab'
      >
        <AddIcon />
      </StyledFab>
    </>
  );
};
