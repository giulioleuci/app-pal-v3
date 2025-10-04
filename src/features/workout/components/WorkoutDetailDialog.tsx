import CloseIcon from '@mui/icons-material/Close';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(0, 3, 3),
}));

const ExerciseSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SetItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export interface PerformedSet {
  /**
   * Number of repetitions/time/distance performed
   */
  counts: number;
  /**
   * Weight used (optional, for weighted exercises)
   */
  weight?: number;
  /**
   * Whether the set was completed
   */
  completed: boolean;
  /**
   * RPE (Rate of Perceived Exertion) rating
   */
  rpe?: number;
  /**
   * Set notes
   */
  notes?: string;
  /**
   * Type of counter (reps, time, distance)
   */
  counterType: string;
}

export interface PerformedExercise {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Exercise name
   */
  exerciseName: string;
  /**
   * Exercise category
   */
  exerciseCategory: string;
  /**
   * Whether the exercise was skipped
   */
  isSkipped: boolean;
  /**
   * Exercise notes
   */
  notes?: string;
  /**
   * Total number of sets performed
   */
  totalSets?: number;
  /**
   * Total volume (weight × reps)
   */
  totalVolume?: number;
  /**
   * Individual sets performed
   */
  sets: PerformedSet[];
  /**
   * RPE effort rating for the entire exercise
   */
  rpeEffort?: string;
  /**
   * Estimated 1RM based on performance
   */
  estimated1rm?: number;
}

export interface WorkoutDetailDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when dialog should close
   */
  onClose: () => void;
  /**
   * Workout session name
   */
  sessionName: string;
  /**
   * Training plan name
   */
  trainingPlanName: string;
  /**
   * Workout start time
   */
  startTime: number;
  /**
   * Workout duration in seconds
   */
  durationSeconds?: number;
  /**
   * Total workout volume
   */
  totalVolume?: number;
  /**
   * User rating
   */
  userRating?: number;
  /**
   * Workout notes
   */
  notes?: string;
  /**
   * List of performed exercises with their sets
   */
  exercises: PerformedExercise[];
  /**
   * Test ID for automation
   */
  'data-testid'?: string;
}

/**
 * Dialog component displaying detailed workout information including all exercises and sets performed.
 * Shows comprehensive data about each exercise including sets, weights, reps, and performance metrics.
 *
 * This is a "dumb" component that receives all data as props.
 */
export const WorkoutDetailDialog: React.FC<WorkoutDetailDialogProps> = ({
  open,
  onClose,
  sessionName,
  trainingPlanName,
  startTime,
  durationSeconds,
  totalVolume,
  userRating,
  notes,
  exercises,
  'data-testid': testId,
}) => {
  const { t } = useTranslation();

  // Format workout date and time
  const startDate = new Date(startTime);
  const formattedDate = startDate.toLocaleDateString();
  const formattedTime = startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return t('workout.inProgress');

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format set display
  const formatSet = (set: PerformedSet) => {
    const { counts, weight, counterType, rpe } = set;

    let display = `${counts}`;

    switch (counterType.toLowerCase()) {
      case 'reps':
        display += ' reps';
        break;
      case 'time':
        display += 's';
        break;
      case 'distance':
        display += 'm';
        break;
      default:
        display += ` ${counterType}`;
    }

    if (weight) {
      display += ` @ ${weight}kg`;
    }

    if (rpe) {
      display += ` (RPE ${rpe})`;
    }

    return display;
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
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth data-testid={testId}>
      <StyledDialogTitle>
        <Box>
          <Typography variant='h6' component='h2'>
            {sessionName}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {trainingPlanName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small' data-testid={`${testId}-close`}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Workout metadata */}
        <Box sx={{ mb: 3 }}>
          <Stack direction='row' spacing={3} sx={{ mb: 1 }}>
            <Typography variant='caption' color='text.secondary'>
              {formattedDate} at {formattedTime}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {formatDuration(durationSeconds)}
            </Typography>
          </Stack>

          <Stack direction='row' spacing={3} alignItems='center'>
            {totalVolume && (
              <Typography variant='body2' color='text.secondary'>
                <strong>{totalVolume}kg</strong> total volume
              </Typography>
            )}
            {userRating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant='body2' color='text.secondary'>
                  Rating:
                </Typography>
                <Box sx={{ display: 'flex', fontSize: '0.875rem' }}>
                  {renderStarRating(userRating)}
                </Box>
              </Box>
            )}
          </Stack>

          {notes && (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ mt: 1.5, fontStyle: 'italic' }}
            >
              "{notes}"
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Exercises list */}
        <Typography variant='h6' gutterBottom>
          {t('workout.exercises')} ({exercises.length})
        </Typography>

        {exercises.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
            {t('workout.noExercises')}
          </Typography>
        ) : (
          <List disablePadding>
            {exercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                <ListItem disableGutters sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <FitnessCenter color={exercise.isSkipped ? 'disabled' : 'action'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant='subtitle1'
                            sx={{
                              textDecoration: exercise.isSkipped ? 'line-through' : 'none',
                              color: exercise.isSkipped ? 'text.disabled' : 'inherit',
                            }}
                          >
                            {exercise.exerciseName}
                          </Typography>
                          <Chip
                            label={exercise.exerciseCategory}
                            size='small'
                            variant='outlined'
                            color='primary'
                          />
                          {exercise.isSkipped && (
                            <Chip
                              label={t('exercise.skipped')}
                              size='small'
                              color='warning'
                              variant='outlined'
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {/* Exercise summary */}
                          <Stack direction='row' spacing={2}>
                            {exercise.totalSets && (
                              <Typography variant='caption' color='text.secondary'>
                                {exercise.totalSets} sets
                              </Typography>
                            )}
                            {exercise.totalVolume && (
                              <Typography variant='caption' color='text.secondary'>
                                {exercise.totalVolume}kg volume
                              </Typography>
                            )}
                            {exercise.estimated1rm && (
                              <Typography variant='caption' color='text.secondary'>
                                ~{exercise.estimated1rm}kg 1RM
                              </Typography>
                            )}
                          </Stack>

                          {/* Individual sets */}
                          {exercise.sets.length > 0 && (
                            <Box>
                              <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5 }}>
                                Sets performed:
                              </Typography>
                              {exercise.sets.map((set, setIndex) => (
                                <SetItem key={setIndex}>
                                  <Typography variant='caption'>
                                    Set {setIndex + 1}: {formatSet(set)}
                                  </Typography>
                                  {!set.completed && (
                                    <Chip
                                      label='Incomplete'
                                      size='small'
                                      color='warning'
                                      variant='outlined'
                                    />
                                  )}
                                </SetItem>
                              ))}
                            </Box>
                          )}

                          {/* Exercise notes */}
                          {exercise.notes && (
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{ fontStyle: 'italic' }}
                            >
                              Note: {exercise.notes}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                  </Box>
                </ListItem>
                {index < exercises.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </StyledDialogContent>
    </Dialog>
  );
};
