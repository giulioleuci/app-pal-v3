import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

const StyledCard = styled(Card)(({ theme }) => ({
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

const MetadataRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(2),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(1, 2, 2),
  gap: theme.spacing(1),
}));

export interface ExerciseCardProps {
  /**
   * Unique identifier for the exercise
   */
  id: string;
  /**
   * Exercise name
   */
  name: string;
  /**
   * Exercise description
   */
  description: string;
  /**
   * Exercise category (e.g., strength, cardio, flexibility)
   */
  category: string;
  /**
   * Movement type (e.g., compound, isolation)
   */
  movementType: string;
  /**
   * Movement pattern (optional)
   */
  movementPattern?: string;
  /**
   * Difficulty level (beginner, intermediate, advanced)
   */
  difficulty: string;
  /**
   * Required equipment array
   */
  equipment: string[];
  /**
   * Muscle activation mapping (muscle name -> activation percentage 0-1)
   */
  muscleActivation: Record<string, number>;
  /**
   * Counter type (reps, time, distance, etc.)
   */
  counterType: string;
  /**
   * Joint type (single, multi)
   */
  jointType: string;
  /**
   * Exercise notes (optional)
   */
  notes?: string;
  /**
   * Exercise substitutions array
   */
  substitutions: string[];
  /**
   * Creation timestamp
   */
  createdAt: number;
  /**
   * Last update timestamp
   */
  updatedAt: number;
  /**
   * Callback for viewing exercise details (including muscle activation)
   */
  onViewDetails: (exerciseId: string) => void;
  /**
   * Callback for editing the exercise
   */
  onEditExercise: (exerciseId: string) => void;
  /**
   * Test ID for automation
   */
  'data-testid'?: string;
}

/**
 * Enhanced exercise card component displaying exercise information with action buttons.
 * Features dedicated buttons for viewing detailed muscle activation and editing the exercise.
 *
 * This is a "dumb" component that receives all data as props and handles user
 * interactions by calling function props.
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  id,
  name,
  description,
  category,
  movementType,
  difficulty,
  equipment,
  muscleActivation,
  counterType,
  jointType,
  onViewDetails,
  onEditExercise,
  'data-testid': testId,
}) => {
  const { t } = useTranslation();

  // Get primary muscle groups (activation >= 70%)
  const getPrimaryMuscles = (activation: Record<string, number>) => {
    return Object.entries(activation)
      .filter(([_, value]) => value >= 0.7)
      .map(([muscle, _]) => muscle)
      .slice(0, 3); // Limit to 3 primary muscles
  };

  // Get difficulty color
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle view details button click
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(id);
  };

  // Handle edit exercise button click
  const handleEditExercise = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditExercise(id);
  };

  const primaryMuscles = getPrimaryMuscles(muscleActivation);
  const displayEquipment = Array.isArray(equipment) ? equipment : [];

  return (
    <StyledCard data-testid={testId}>
      <CardContent>
        <Typography variant='h6' component='h3' gutterBottom>
          {name}
        </Typography>

        {description && (
          <Typography
            variant='body2'
            color='text.secondary'
            gutterBottom
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </Typography>
        )}

        {/* Exercise metadata chips */}
        <ChipContainer>
          <Chip label={category} size='small' color='primary' variant='outlined' />
          <Chip
            label={difficulty}
            size='small'
            color={getDifficultyColor(difficulty)}
            variant='outlined'
          />
          <Chip label={movementType} size='small' variant='outlined' />
        </ChipContainer>

        {/* Equipment chips */}
        {displayEquipment.length > 0 && (
          <ChipContainer>
            <Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
              {t('exercise.equipment')}:
            </Typography>
            {displayEquipment.slice(0, 3).map((item, idx) => (
              <Chip key={idx} label={item} size='small' variant='outlined' color='secondary' />
            ))}
            {displayEquipment.length > 3 && (
              <Chip
                label={`+${displayEquipment.length - 3}`}
                size='small'
                variant='outlined'
                color='secondary'
              />
            )}
          </ChipContainer>
        )}

        {/* Primary muscle groups */}
        {primaryMuscles.length > 0 && (
          <ChipContainer>
            <Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
              {t('exercise.primaryMuscles')}:
            </Typography>
            {primaryMuscles.map((muscle, idx) => (
              <Chip key={idx} label={muscle} size='small' color='secondary' variant='filled' />
            ))}
          </ChipContainer>
        )}

        {/* Technical details */}
        <MetadataRow>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Typography variant='caption' color='text.secondary'>
              {jointType} joint
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {counterType}
            </Typography>
          </Stack>
          <Typography variant='caption' color='text.secondary'>
            {Object.keys(muscleActivation).length} muscles
          </Typography>
        </MetadataRow>
      </CardContent>

      <Divider />

      <StyledCardActions>
        <Button
          size='small'
          startIcon={<InfoIcon />}
          onClick={handleViewDetails}
          data-testid={`${testId}-view-details`}
          sx={{ flex: 1 }}
        >
          {t('exercise.actions.viewDetails')}
        </Button>

        <Button
          size='small'
          startIcon={<EditIcon />}
          onClick={handleEditExercise}
          data-testid={`${testId}-edit-exercise`}
          sx={{ flex: 1 }}
        >
          {t('exercise.actions.editData')}
        </Button>
      </StyledCardActions>
    </StyledCard>
  );
};
