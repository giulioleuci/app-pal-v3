import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import { FormDialog } from '@/shared/components/FormDialog';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  movement_type: string;
  movement_pattern?: string;
  difficulty: string;
  equipment: string[];
  muscle_activation: Record<string, number>;
  counter_type: string;
  joint_type: string;
  notes?: string;
  substitutions: string[];
}

export interface ExercisePickerDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback fired when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Array of available exercises to choose from
   */
  exercises: Exercise[];
  /**
   * Callback fired when an exercise is selected
   */
  onSelectExercise: (exercise: Exercise) => void;
  /**
   * Whether the dialog is in a loading state
   */
  isLoading?: boolean;
  /**
   * Test identifier for the dialog
   */
  'data-testid'?: string;
}

/**
 * A modal dialog for selecting an exercise from a list of available exercises.
 * Provides search and filtering capabilities to help users find the right exercise.
 * Uses Autocomplete for enhanced search functionality.
 *
 * @example
 * ```tsx
 * <ExercisePickerDialog
 *   open={isDialogOpen}
 *   onClose={handleCloseDialog}
 *   exercises={availableExercises}
 *   onSelectExercise={handleSelectExercise}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const ExercisePickerDialog = ({
  open,
  onClose,
  exercises,
  onSelectExercise,
  isLoading = false,
  'data-testid': testId = 'exercise-picker-dialog',
}: ExercisePickerDialogProps) => {
  const { t } = useAppTranslation();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const handleClose = () => {
    setSelectedExercise(null);
    onClose();
  };

  const handleSelectExercise = () => {
    if (selectedExercise) {
      onSelectExercise(selectedExercise);
      setSelectedExercise(null);
      onClose();
    }
  };

  const formatMuscleActivation = (muscleActivation: Record<string, number>) => {
    return Object.entries(muscleActivation)
      .filter(([, value]) => value > 0)
      .map(([muscle, value]) => `${muscle} (${Math.round(value * 100)}%)`)
      .join(', ');
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={t('trainingPlan.editor.selectExercise')}
      onSubmit={handleSelectExercise}
      isLoading={isLoading}
      isSubmitDisabled={!selectedExercise}
      submitText={t('common.select')}
      data-testid={testId}
      maxWidth='md'
    >
      <Autocomplete
        options={exercises}
        getOptionLabel={(option) => option.name}
        value={selectedExercise}
        onChange={(_, newValue) => setSelectedExercise(newValue)}
        disabled={isLoading}
        data-testid='exercise-picker-autocomplete'
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('trainingPlan.editor.searchExercises')}
            placeholder={t('trainingPlan.editor.searchExercisesPlaceholder')}
            fullWidth
          />
        )}
        renderOption={(props, option) => (
          <Box component='li' {...props} data-testid={`exercise-option-${option.id}`}>
            <Box sx={{ width: '100%' }}>
              <Typography variant='subtitle1' component='div' fontWeight='medium'>
                {option.name}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {option.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                <Chip label={option.category} size='small' color='primary' variant='outlined' />
                <Chip label={option.movement_type} size='small' variant='outlined' />
                <Chip
                  label={option.difficulty}
                  size='small'
                  color={
                    option.difficulty === 'beginner'
                      ? 'success'
                      : option.difficulty === 'intermediate'
                        ? 'warning'
                        : 'error'
                  }
                  variant='outlined'
                />
                <Chip label={option.counter_type} size='small' variant='outlined' />
              </Box>
              {option.equipment.length > 0 && (
                <Typography variant='caption' color='text.secondary' display='block'>
                  {t('exercise.equipment')}: {option.equipment.join(', ')}
                </Typography>
              )}
              {Object.keys(option.muscle_activation).length > 0 && (
                <Typography variant='caption' color='text.secondary' display='block'>
                  {t('exercise.muscleActivation')}:{' '}
                  {formatMuscleActivation(option.muscle_activation)}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter(
            (option) =>
              option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.category.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.movement_type.toLowerCase().includes(inputValue.toLowerCase()) ||
              option.equipment.some((eq) => eq.toLowerCase().includes(inputValue.toLowerCase()))
          );
          return filtered;
        }}
      />

      {selectedExercise && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: 1,
            borderColor: 'primary.main',
            borderRadius: 1,
            backgroundColor: 'primary.lighter',
          }}
          data-testid='exercise-picker-selected-exercise'
        >
          <Typography variant='h6' gutterBottom>
            {selectedExercise.name}
          </Typography>
          <Typography variant='body2' color='text.secondary' paragraph>
            {selectedExercise.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={selectedExercise.category} size='small' color='primary' />
            <Chip label={selectedExercise.movement_type} size='small' />
            <Chip label={selectedExercise.difficulty} size='small' />
            <Chip label={selectedExercise.counter_type} size='small' />
            <Chip label={selectedExercise.joint_type} size='small' />
          </Box>
          {selectedExercise.equipment.length > 0 && (
            <Typography variant='body2' gutterBottom>
              <strong>{t('exercise.equipment')}:</strong> {selectedExercise.equipment.join(', ')}
            </Typography>
          )}
          {Object.keys(selectedExercise.muscle_activation).length > 0 && (
            <Typography variant='body2' gutterBottom>
              <strong>{t('exercise.muscleActivation')}:</strong>{' '}
              {formatMuscleActivation(selectedExercise.muscle_activation)}
            </Typography>
          )}
          {selectedExercise.notes && (
            <Typography variant='body2' gutterBottom>
              <strong>{t('exercise.notes')}:</strong> {selectedExercise.notes}
            </Typography>
          )}
        </Box>
      )}
    </FormDialog>
  );
};
