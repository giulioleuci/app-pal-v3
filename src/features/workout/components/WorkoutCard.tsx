import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
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

const MetadataRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(1),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(1, 2, 2),
  gap: theme.spacing(1),
}));

export interface WorkoutCardProps {
  /**
   * Unique identifier for the workout
   */
  id: string;
  /**
   * Name of the training plan
   */
  trainingPlanName: string;
  /**
   * Name of the workout session
   */
  sessionName: string;
  /**
   * Start time as Unix timestamp
   */
  startTime: number;
  /**
   * End time as Unix timestamp (optional for in-progress workouts)
   */
  endTime?: number;
  /**
   * Duration in seconds (optional for in-progress workouts)
   */
  durationSeconds?: number;
  /**
   * Total volume in kg (optional)
   */
  totalVolume?: number;
  /**
   * User notes about the workout (optional)
   */
  notes?: string;
  /**
   * User rating from 1-5 stars (optional)
   */
  userRating?: number;
  /**
   * Creation timestamp
   */
  createdAt: number;
  /**
   * Last update timestamp
   */
  updatedAt: number;
  /**
   * Callback for viewing workout details (exercises and sets)
   */
  onViewDetails: (workoutId: string) => void;
  /**
   * Callback for editing the workout
   */
  onEditWorkout: (workoutId: string) => void;
  /**
   * Test ID for automation
   */
  'data-testid'?: string;
}

/**
 * Enhanced workout card component displaying workout information with action buttons.
 * Features dedicated buttons for viewing exercise details and editing the workout.
 *
 * This is a "dumb" component that receives all data as props and handles user
 * interactions by calling function props.
 */
export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  id,
  trainingPlanName,
  sessionName,
  startTime,
  endTime,
  durationSeconds,
  totalVolume,
  notes,
  userRating,
  onViewDetails,
  onEditWorkout,
  'data-testid': testId,
}) => {
  const { t } = useTranslation();

  // Format workout date
  const startDate = new Date(startTime);
  const formattedDate = startDate.toLocaleDateString();
  const formattedTime = startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format workout duration
  const formatDuration = () => {
    if (!durationSeconds) {
      return t('workout.inProgress');
    }

    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Handle view details button click
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(id);
  };

  // Handle edit workout button click
  const handleEditWorkout = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditWorkout(id);
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffc107' : '#e0e0e0' }}>
        ⭐
      </span>
    ));
  };

  return (
    <StyledCard data-testid={testId}>
      <CardContent>
        <Typography variant='h6' component='h3' gutterBottom>
          {sessionName}
        </Typography>

        <Typography variant='body2' color='text.secondary' gutterBottom sx={{ fontWeight: 500 }}>
          {trainingPlanName}
        </Typography>

        <MetadataRow>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Typography variant='caption' color='text.secondary'>
              {formattedDate}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {formattedTime}
            </Typography>
          </Stack>
          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
            {formatDuration()}
          </Typography>
        </MetadataRow>

        {/* Additional workout metrics */}
        {(totalVolume || userRating) && (
          <Stack direction='row' spacing={3} sx={{ mt: 1.5 }}>
            {totalVolume && (
              <Typography variant='caption' color='text.secondary'>
                {t('workout.totalVolume')}: <strong>{totalVolume}kg</strong>
              </Typography>
            )}
            {userRating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant='caption' color='text.secondary'>
                  {t('workout.rating')}:
                </Typography>
                <Box sx={{ display: 'flex', fontSize: '0.75rem' }}>
                  {renderStarRating(userRating)}
                </Box>
              </Box>
            )}
          </Stack>
        )}

        {/* Workout notes */}
        {notes && (
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{
              display: 'block',
              mt: 1.5,
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            "{notes}"
          </Typography>
        )}
      </CardContent>

      <Divider />

      <StyledCardActions>
        <Button
          size='small'
          startIcon={<VisibilityIcon />}
          onClick={handleViewDetails}
          data-testid={`${testId}-view-details`}
          sx={{ flex: 1 }}
        >
          {t('workout.actions.viewExercises')}
        </Button>

        <Button
          size='small'
          startIcon={<EditIcon />}
          onClick={handleEditWorkout}
          data-testid={`${testId}-edit-workout`}
          sx={{ flex: 1 }}
        >
          {t('workout.actions.editWorkout')}
        </Button>
      </StyledCardActions>
    </StyledCard>
  );
};
