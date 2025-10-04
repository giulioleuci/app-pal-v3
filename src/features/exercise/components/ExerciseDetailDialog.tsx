import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { capitalize } from '@mui/material/utils';
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

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  gap: theme.spacing(1),
}));

const MetadataSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
}));

const MuscleActivationItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const MuscleLabel = styled(Typography)(({ theme }) => ({
  minWidth: '120px',
  marginRight: theme.spacing(2),
  fontWeight: 500,
}));

const ChipContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
}));

export interface ExerciseDetailDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when dialog should close
   */
  onClose: () => void;
  /**
   * Exercise unique identifier
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
   * Exercise category
   */
  category: string;
  /**
   * Movement type
   */
  movementType: string;
  /**
   * Movement pattern (optional)
   */
  movementPattern?: string;
  /**
   * Difficulty level
   */
  difficulty: string;
  /**
   * Required equipment array
   */
  equipment: string[];
  /**
   * Muscle activation mapping with percentages (0-1)
   */
  muscleActivation: Record<string, number>;
  /**
   * Counter type (reps, time, distance)
   */
  counterType: string;
  /**
   * Joint type (single, multi)
   */
  jointType: string;
  /**
   * Exercise notes
   */
  notes?: string;
  /**
   * Exercise substitutions
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
   * Callback for editing the exercise
   */
  onEditExercise: (exerciseId: string) => void;
  /**
   * Test ID for automation
   */
  'data-testid'?: string;
}

/**
 * Detailed exercise dialog showing comprehensive exercise information including
 * muscle activation sliders showing activation percentages from 0-100% for each muscle group.
 *
 * This is a "dumb" component that receives all data as props.
 */
export const ExerciseDetailDialog: React.FC<ExerciseDetailDialogProps> = ({
  open,
  onClose,
  id,
  name,
  description,
  category,
  movementType,
  movementPattern,
  difficulty,
  equipment,
  muscleActivation,
  counterType,
  jointType,
  notes,
  substitutions,
  createdAt,
  updatedAt,
  onEditExercise,
  'data-testid': testId,
}) => {
  const { t } = useTranslation();

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

  // Get activation color based on percentage
  const getActivationColor = (percentage: number) => {
    if (percentage >= 0.8) return 'error'; // High activation (80%+)
    if (percentage >= 0.6) return 'warning'; // Moderate activation (60-79%)
    if (percentage >= 0.3) return 'primary'; // Low activation (30-59%)
    return 'secondary'; // Minimal activation (<30%)
  };

  // Sort muscles by activation level (highest first)
  const sortedMuscleActivation = Object.entries(muscleActivation).sort(([, a], [, b]) => b - a);

  // Handle edit button click
  const handleEditExercise = () => {
    onEditExercise(id);
    onClose();
  };

  // Format timestamps
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth data-testid={testId}>
      <StyledDialogTitle>
        <Box>
          <Typography variant='h6' component='h2'>
            {name}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('exercise.detailsTitle')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small' data-testid={`${testId}-close`}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Exercise description */}
        {description && (
          <Typography variant='body1' paragraph>
            {description}
          </Typography>
        )}

        {/* Exercise metadata */}
        <MetadataSection elevation={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                {t('exercise.basicInfo')}
              </Typography>
              <ChipContainer>
                <Chip label={capitalize(category)} size='small' color='primary' variant='filled' />
                <Chip
                  label={capitalize(difficulty)}
                  size='small'
                  color={getDifficultyColor(difficulty)}
                  variant='filled'
                />
                <Chip label={capitalize(movementType)} size='small' variant='outlined' />
              </ChipContainer>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                {t('exercise.technicalSpecs')}
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant='body2'>
                  <strong>{t('exercise.counterType')}:</strong> {capitalize(counterType)}
                </Typography>
                <Typography variant='body2'>
                  <strong>{t('exercise.jointType')}:</strong> {capitalize(jointType)} joint
                </Typography>
                {movementPattern && (
                  <Typography variant='body2'>
                    <strong>{t('exercise.movementPattern')}:</strong> {capitalize(movementPattern)}
                  </Typography>
                )}
              </Stack>
            </Grid>
          </Grid>
        </MetadataSection>

        {/* Equipment required */}
        {equipment.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' gutterBottom>
              {t('exercise.equipment')} ({equipment.length})
            </Typography>
            <ChipContainer>
              {equipment.map((item, index) => (
                <Chip
                  key={index}
                  label={capitalize(item)}
                  size='small'
                  color='secondary'
                  variant='outlined'
                />
              ))}
            </ChipContainer>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Muscle activation section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant='h6' gutterBottom>
            {t('exercise.muscleActivation')} ({sortedMuscleActivation.length}{' '}
            {t('exercise.muscles')})
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            {t('exercise.muscleActivationDescription')}
          </Typography>

          {sortedMuscleActivation.map(([muscle, activation]) => {
            const percentage = Math.round(activation * 100);
            const color = getActivationColor(activation);

            return (
              <MuscleActivationItem key={muscle}>
                <MuscleLabel variant='body2'>{capitalize(muscle)}</MuscleLabel>
                <Box sx={{ flex: 1, mx: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant='caption' sx={{ minWidth: '40px' }}>
                      {percentage}%
                    </Typography>
                    <Box sx={{ flex: 1, mx: 1 }}>
                      <LinearProgress
                        variant='determinate'
                        value={percentage}
                        color={color}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Chip
                      label={
                        percentage >= 80
                          ? t('exercise.activationHigh')
                          : percentage >= 60
                            ? t('exercise.activationModerate')
                            : percentage >= 30
                              ? t('exercise.activationLow')
                              : t('exercise.activationMinimal')
                      }
                      size='small'
                      color={color}
                      variant='outlined'
                      sx={{ minWidth: '80px', fontSize: '0.6875rem' }}
                    />
                  </Box>
                </Box>
              </MuscleActivationItem>
            );
          })}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Exercise substitutions */}
        {substitutions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' gutterBottom>
              {t('exercise.substitutions')} ({substitutions.length})
            </Typography>
            <ChipContainer>
              {substitutions.map((sub, index) => (
                <Chip key={index} label={capitalize(sub)} size='small' variant='outlined' />
              ))}
            </ChipContainer>
          </Box>
        )}

        {/* Exercise notes */}
        {notes && (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' gutterBottom>
              {t('exercise.notes')}
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{
                fontStyle: 'italic',
                padding: 2,
                backgroundColor: 'action.hover',
                borderRadius: 1,
              }}
            >
              {notes}
            </Typography>
          </Box>
        )}

        {/* Timestamps */}
        <Box sx={{ mt: 3 }}>
          <Stack direction='row' spacing={3}>
            <Typography variant='caption' color='text.secondary'>
              {t('common.created')}: {formatDate(createdAt)}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {t('common.updated')}: {formatDate(updatedAt)}
            </Typography>
          </Stack>
        </Box>
      </StyledDialogContent>

      <Divider />

      <StyledDialogActions>
        <Button onClick={onClose} variant='outlined' data-testid={`${testId}-close-button`}>
          {t('common.close')}
        </Button>
        <Button
          onClick={handleEditExercise}
          variant='contained'
          startIcon={<EditIcon />}
          data-testid={`${testId}-edit-button`}
        >
          {t('exercise.actions.editData')}
        </Button>
      </StyledDialogActions>
    </Dialog>
  );
};
