import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import NotesIcon from '@mui/icons-material/Notes';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import StopIcon from '@mui/icons-material/Stop';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useSnackbar } from '@/app/providers/SnackbarProvider';
import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorDisplay } from '@/shared/components/ErrorDisplay';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
}));

const TimerCard = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: theme.zIndex.appBar - 1,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
}));

const ProgressCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const ExerciseCard = styled(Card)<{ disabled?: boolean }>(({ theme, disabled }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  opacity: disabled ? 0.6 : 1,
  backgroundColor: disabled ? theme.palette.action.disabledBackground : 'inherit',
}));

const SetRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '40px 1fr 1fr 80px 50px 50px 50px',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const GroupCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.grey[50],
  border: `2px solid ${theme.palette.primary.light}`,
}));

const CompactTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    height: 40,
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(0.5, 1),
    textAlign: 'center',
  },
}));

interface PerformedSetData {
  id: string;
  counterType: 'reps' | 'mins' | 'secs';
  counts: number;
  weight?: number;
  completed: boolean;
  notes?: string;
  rpe?: number;
  percentage?: number;
  setType?: 'regular' | 'myo-rep-main' | 'myo-rep-mini';
  parentSetId?: string; // For myo-rep mini sets
  // Historical/estimated data for pre-filling
  estimatedCounts?: number;
  estimatedWeight?: number;
  estimatedRpe?: number;
}

interface ExerciseData {
  id: string;
  name: string;
  counterType: 'reps' | 'mins' | 'secs';
  sets: PerformedSetData[];
  isDisabled: boolean;
  notes?: string;
  // Historical data
  lastPerformance?: {
    date: Date;
    bestWeight?: number;
    avgRpe?: number;
    totalVolume?: number;
  };
}

interface GroupData {
  id: string;
  type: 'single' | 'superset' | 'circuit' | 'emom' | 'amrap' | 'warmup' | 'stretching';
  exercises: ExerciseData[];
  restSeconds?: number;
  rounds?: number; // For circuits and supersets
  superset_structure?: 'alternating' | 'round_robin'; // How to organize superset
}

/**
 * WorkoutPage component for active workout management with full data input capabilities.
 *
 * Provides comprehensive workout tracking including:
 * - Per-set input fields for weight, reps/time, RPE
 * - Historical data pre-filling
 * - Add/remove sets functionality
 * - Exercise notes and completion tracking
 * - Exercise disable/enable functionality
 * - Add new exercises to workout
 * - Real-time progress tracking with timer
 *
 * Uses the useWorkoutSession hook for reactive data management.
 */
export function WorkoutPage(): React.ReactElement {
  const { t } = useTranslation();
  const activeProfileResult = useActiveProfileId();
  const profileId = activeProfileResult?.profileId || 'demo-profile-id';
  const { showSnackbar } = useSnackbar();

  // Local state for workout data
  const [workoutData, setWorkoutData] = useState<GroupData[]>([
    {
      id: 'group-1',
      type: 'superset',
      restSeconds: 120,
      rounds: 3, // 3 rounds of superset
      superset_structure: 'alternating',
      exercises: [
        {
          id: 'ex-1',
          name: 'Bench Press',
          counterType: 'reps',
          isDisabled: false,
          lastPerformance: {
            date: new Date('2024-01-15'),
            bestWeight: 85,
            avgRpe: 8.2,
            totalVolume: 2550,
          },
          sets: [
            {
              id: 'set-1',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 10,
              estimatedWeight: 80,
              estimatedRpe: 7,
            },
            {
              id: 'set-2',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 8,
              estimatedWeight: 85,
              estimatedRpe: 8,
            },
            {
              id: 'set-3',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 6,
              estimatedWeight: 90,
              estimatedRpe: 9,
            },
          ],
        },
        {
          id: 'ex-2',
          name: 'Incline Dumbbell Press',
          counterType: 'reps',
          isDisabled: false,
          lastPerformance: {
            date: new Date('2024-01-15'),
            bestWeight: 30,
            avgRpe: 7.8,
            totalVolume: 900,
          },
          sets: [
            {
              id: 'set-4',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 12,
              estimatedWeight: 25,
              estimatedRpe: 7,
            },
            {
              id: 'set-5',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 10,
              estimatedWeight: 27.5,
              estimatedRpe: 8,
            },
            {
              id: 'set-6',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 8,
              estimatedWeight: 30,
              estimatedRpe: 9,
            },
          ],
        },
      ],
    },
    {
      id: 'group-2',
      type: 'single',
      restSeconds: 180,
      exercises: [
        {
          id: 'ex-3',
          name: 'Squats',
          counterType: 'reps',
          isDisabled: false,
          lastPerformance: {
            date: new Date('2024-01-12'),
            bestWeight: 120,
            avgRpe: 8.5,
            totalVolume: 4200,
          },
          sets: [
            {
              id: 'set-7',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 15,
              estimatedWeight: 100,
              estimatedRpe: 7,
            },
            {
              id: 'set-8',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 12,
              estimatedWeight: 105,
              estimatedRpe: 8,
            },
            {
              id: 'set-9',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 10,
              estimatedWeight: 110,
              estimatedRpe: 9,
            },
            {
              id: 'set-10',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              estimatedCounts: 8,
              estimatedWeight: 115,
              estimatedRpe: 9,
            },
          ],
        },
      ],
    },
    {
      id: 'group-3',
      type: 'single',
      restSeconds: 90,
      exercises: [
        {
          id: 'ex-4',
          name: 'Bicep Curls (Myo-Reps)',
          counterType: 'reps',
          isDisabled: false,
          lastPerformance: {
            date: new Date('2024-01-10'),
            bestWeight: 15,
            avgRpe: 9.0,
            totalVolume: 450,
          },
          sets: [
            {
              id: 'set-11',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              setType: 'myo-rep-main',
              estimatedCounts: 15,
              estimatedWeight: 15,
              estimatedRpe: 8,
            },
            {
              id: 'set-12',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              setType: 'myo-rep-mini',
              parentSetId: 'set-11',
              estimatedCounts: 5,
              estimatedWeight: 15,
              estimatedRpe: 9,
            },
            {
              id: 'set-13',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              setType: 'myo-rep-mini',
              parentSetId: 'set-11',
              estimatedCounts: 4,
              estimatedWeight: 15,
              estimatedRpe: 9,
            },
            {
              id: 'set-14',
              counterType: 'reps',
              counts: 0,
              weight: 0,
              completed: false,
              setType: 'myo-rep-mini',
              parentSetId: 'set-11',
              estimatedCounts: 3,
              estimatedWeight: 15,
              estimatedRpe: 10,
            },
          ],
        },
      ],
    },
  ]);

  const [showNotes, setShowNotes] = useState<{ [key: string]: boolean }>({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCounterType, setNewExerciseCounterType] = useState<'reps' | 'mins' | 'secs'>(
    'reps'
  );
  const [rpeModalOpen, setRpeModalOpen] = useState<string | null>(null);
  const [tempRpeValue, setTempRpeValue] = useState<number>(0);

  usePageTitle(t('pages.workout.title'));

  const {
    activeWorkout,
    isActiveWorkout,
    workoutTimer,
    isLoadingActive,
    end,
    pause,
    resume,
    updateMetadata,
    endError,
    pauseError,
    resumeError,
    updateError,
    isEnding,
    isPausing,
    isResuming,
    isUpdatingMetadata,
  } = useWorkoutSession(profileId);

  // Calculate progress
  const allSets = workoutData
    .filter((group) => !group.exercises.every((ex) => ex.isDisabled))
    .flatMap((group) => group.exercises.filter((ex) => !ex.isDisabled).flatMap((ex) => ex.sets));
  const completedSets = allSets.filter((set) => set.completed);
  const progressPercentage = allSets.length > 0 ? (completedSets.length / allSets.length) * 100 : 0;

  // Handlers
  const handleSetDataChange = (
    groupId: string,
    exerciseId: string,
    setId: string,
    field: keyof PerformedSetData,
    value: any
  ) => {
    setWorkoutData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      sets: exercise.sets.map((set) =>
                        set.id === setId ? { ...set, [field]: value } : set
                      ),
                    }
                  : exercise
              ),
            }
          : group
      )
    );
  };

  const handleSetComplete = (groupId: string, exerciseId: string, setId: string) => {
    handleSetDataChange(groupId, exerciseId, setId, 'completed', true);
    showSnackbar(t('workout.setCompleted'), 'success');
  };

  const handleAddSet = (groupId: string, exerciseId: string) => {
    setWorkoutData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      sets: [
                        ...exercise.sets,
                        {
                          id: `set-${Date.now()}`,
                          counterType: exercise.counterType,
                          counts: 0,
                          weight: 0,
                          completed: false,
                          estimatedCounts:
                            exercise.sets[exercise.sets.length - 1]?.estimatedCounts || 10,
                          estimatedWeight:
                            exercise.sets[exercise.sets.length - 1]?.estimatedWeight || 0,
                          estimatedRpe: exercise.sets[exercise.sets.length - 1]?.estimatedRpe || 8,
                        },
                      ],
                    }
                  : exercise
              ),
            }
          : group
      )
    );
  };

  const handleRemoveSet = (groupId: string, exerciseId: string, setId: string) => {
    setWorkoutData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      sets: exercise.sets.filter((set) => set.id !== setId),
                    }
                  : exercise
              ),
            }
          : group
      )
    );
  };

  const handleToggleExercise = (groupId: string, exerciseId: string) => {
    setWorkoutData((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              exercises: group.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? { ...exercise, isDisabled: !exercise.isDisabled }
                  : exercise
              ),
            }
          : group
      )
    );
  };

  const handleToggleNotes = (id: string) => {
    setShowNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenRpeModal = (setId: string, currentRpe: number) => {
    setTempRpeValue(currentRpe || 0);
    setRpeModalOpen(setId);
  };

  const handleCloseRpeModal = () => {
    setRpeModalOpen(null);
    setTempRpeValue(0);
  };

  const handleSaveRpe = (groupId: string, exerciseId: string, setId: string) => {
    handleSetDataChange(groupId, exerciseId, setId, 'rpe', tempRpeValue);
    handleCloseRpeModal();
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) return;

    const newExercise: ExerciseData = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      counterType: newExerciseCounterType,
      isDisabled: false,
      sets: [
        {
          id: `set-${Date.now()}`,
          counterType: newExerciseCounterType,
          counts: 0,
          weight: 0,
          completed: false,
          estimatedCounts:
            newExerciseCounterType === 'reps' ? 10 : newExerciseCounterType === 'mins' ? 5 : 30,
          estimatedWeight: 0,
          estimatedRpe: 8,
        },
      ],
    };

    // Add to the last group or create a new single group
    setWorkoutData((prev) => {
      const lastGroup = prev[prev.length - 1];
      if (lastGroup && lastGroup.type === 'single') {
        return prev.map((group, index) =>
          index === prev.length - 1
            ? { ...group, exercises: [...group.exercises, newExercise] }
            : group
        );
      } else {
        return [
          ...prev,
          {
            id: `group-${Date.now()}`,
            type: 'single' as const,
            exercises: [newExercise],
            restSeconds: 120,
          },
        ];
      }
    });

    setShowAddExercise(false);
    setNewExerciseName('');
    setNewExerciseCounterType('reps');
    showSnackbar(`${newExerciseName} added to workout`, 'success');
  };

  const handleTimerControl = () => {
    if (!workoutTimer) return;
    if (workoutTimer.isRunning) {
      pause.mutate(activeWorkout?.[0]?.id || '');
    } else {
      resume.mutate(activeWorkout?.[0]?.id || '');
    }
  };

  const handleSaveWorkout = () => {
    if (!activeWorkout?.[0]?.id) return;
    updateMetadata.mutate({
      workoutLogId: activeWorkout[0].id,
      notes: `Completed ${completedSets.length}/${allSets.length} sets`,
    });
  };

  const handleEndWorkout = () => {
    if (!activeWorkout?.[0]?.id) return;
    end.mutate(activeWorkout[0].id);
  };

  const getCounterLabel = (counterType: 'reps' | 'mins' | 'secs') => {
    switch (counterType) {
      case 'reps':
        return 'Reps';
      case 'mins':
        return 'Min';
      case 'secs':
        return 'Sec';
      default:
        return 'Count';
    }
  };

  const renderSetInput = (
    group: GroupData,
    exercise: ExerciseData,
    set: PerformedSetData,
    setIndex: number
  ) => {
    const isMyoRepMini = set.setType === 'myo-rep-mini';
    const isMyoRepMain = set.setType === 'myo-rep-main';

    return (
      <SetRow
        key={set.id}
        sx={{
          backgroundColor: isMyoRepMini ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
          borderLeft: isMyoRepMini ? '3px solid #1976d2' : 'none',
          paddingLeft: isMyoRepMini ? 2 : 1,
        }}
      >
        <Typography
          variant='body2'
          sx={{
            minWidth: 40,
            fontWeight: isMyoRepMain ? 'bold' : 'medium',
            color: isMyoRepMini ? 'primary.main' : 'inherit',
          }}
        >
          {isMyoRepMini ? `↳${setIndex + 1}` : setIndex + 1}
          {isMyoRepMain && ' ★'}
        </Typography>

        {/* Counts Input */}
        <CompactTextField
          type='number'
          placeholder={set.estimatedCounts?.toString() || '0'}
          value={set.counts === 0 ? '' : set.counts || ''}
          onChange={(e) =>
            handleSetDataChange(
              group.id,
              exercise.id,
              set.id,
              'counts',
              Number(e.target.value) || 0
            )
          }
          size='small'
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Typography variant='caption' color='text.secondary'>
                  {getCounterLabel(exercise.counterType)}
                </Typography>
              </InputAdornment>
            ),
          }}
          data-testid={`set-counts-${set.id}`}
        />

        {/* Weight Input */}
        <CompactTextField
          type='number'
          placeholder={set.estimatedWeight?.toString() || '0'}
          value={set.weight === 0 ? '' : set.weight || ''}
          onChange={(e) =>
            handleSetDataChange(
              group.id,
              exercise.id,
              set.id,
              'weight',
              Number(e.target.value) || 0
            )
          }
          size='small'
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Typography variant='caption' color='text.secondary'>
                  kg
                </Typography>
              </InputAdornment>
            ),
          }}
          data-testid={`set-weight-${set.id}`}
        />

        {/* RPE Button */}
        <Tooltip title='Set RPE (Rate of Perceived Exertion)'>
          <Button
            variant='outlined'
            size='small'
            onClick={() => handleOpenRpeModal(set.id, set.rpe || 0)}
            sx={{ minWidth: 60, fontSize: '0.75rem' }}
            data-testid={`set-rpe-button-${set.id}`}
          >
            {set.rpe ? `${set.rpe}/10` : 'RPE'}
          </Button>
        </Tooltip>

        {/* Notes Toggle */}
        <Tooltip title='Notes'>
          <IconButton
            size='small'
            onClick={() => handleToggleNotes(set.id)}
            color={showNotes[set.id] ? 'primary' : 'default'}
          >
            <NotesIcon fontSize='small' />
          </IconButton>
        </Tooltip>

        {/* Remove Set */}
        <Tooltip title='Remove Set'>
          <IconButton
            size='small'
            onClick={() => handleRemoveSet(group.id, exercise.id, set.id)}
            disabled={exercise.sets.length <= 1}
          >
            <RemoveIcon fontSize='small' />
          </IconButton>
        </Tooltip>

        {/* Complete Set */}
        <Tooltip title='Complete Set'>
          <ToggleButton
            value='completed'
            selected={set.completed}
            onChange={() => handleSetComplete(group.id, exercise.id, set.id)}
            size='small'
            color='success'
            data-testid={`set-complete-${set.id}`}
          >
            <CheckCircleIcon fontSize='small' />
          </ToggleButton>
        </Tooltip>
      </SetRow>
    );
  };

  const renderExercise = (group: GroupData, exercise: ExerciseData) => (
    <ExerciseCard
      key={exercise.id}
      disabled={exercise.isDisabled}
      data-testid={`exercise-${exercise.id}`}
    >
      <CardContent>
        {/* Exercise Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant='h6'>{exercise.name}</Typography>
            {exercise.lastPerformance && (
              <Typography variant='caption' color='text.secondary'>
                Last: {exercise.lastPerformance.bestWeight}kg ×{' '}
                {Math.round(exercise.lastPerformance.avgRpe || 0)} RPE |{' '}
                {exercise.lastPerformance.totalVolume}kg total
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title='Notes'>
              <IconButton
                size='small'
                onClick={() => handleToggleNotes(exercise.id)}
                color={showNotes[exercise.id] ? 'primary' : 'default'}
              >
                <NotesIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={exercise.isDisabled ? 'Enable Exercise' : 'Disable Exercise'}>
              <IconButton
                size='small'
                onClick={() => handleToggleExercise(group.id, exercise.id)}
                color={exercise.isDisabled ? 'error' : 'default'}
              >
                {exercise.isDisabled ? <VisibilityOffIcon /> : <FitnessCenter />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Exercise Notes */}
        {showNotes[exercise.id] && (
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder='Exercise notes...'
            value={exercise.notes || ''}
            onChange={(e) => {
              setWorkoutData((prev) =>
                prev.map((g) =>
                  g.id === group.id
                    ? {
                        ...g,
                        exercises: g.exercises.map((ex) =>
                          ex.id === exercise.id ? { ...ex, notes: e.target.value } : ex
                        ),
                      }
                    : g
                )
              );
            }}
            sx={{ mb: 2 }}
            size='small'
            data-testid={`exercise-notes-${exercise.id}`}
          />
        )}

        {/* Sets Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 1fr 80px 50px 50px 50px',
            alignItems: 'center',
            gap: 1,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            mb: 1,
          }}
        >
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            Set
          </Typography>
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            {getCounterLabel(exercise.counterType)}
          </Typography>
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            Weight
          </Typography>
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            RPE
          </Typography>
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            Notes
          </Typography>
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            Del
          </Typography>
          <Typography variant='subtitle2' sx={{ textAlign: 'center' }}>
            Done
          </Typography>
        </Box>

        {/* Sets */}
        {!exercise.isDisabled &&
          (() => {
            const hasMyo = exercise.sets.some((set) => set.setType?.includes('myo-rep'));

            if (hasMyo) {
              // Group myo-rep sets: main set followed by its mini sets
              const mainSets = exercise.sets.filter(
                (set) => set.setType === 'myo-rep-main' || !set.setType
              );
              const miniSets = exercise.sets.filter((set) => set.setType === 'myo-rep-mini');

              return mainSets.map((mainSet, mainIndex) => {
                const relatedMinis = miniSets.filter((mini) => mini.parentSetId === mainSet.id);

                return (
                  <Box key={mainSet.id}>
                    {renderSetInput(group, exercise, mainSet, mainIndex)}
                    {relatedMinis.map((miniSet, miniIndex) =>
                      renderSetInput(group, exercise, miniSet, miniIndex)
                    )}
                    {mainIndex < mainSets.length - 1 && <Box sx={{ height: 8 }} />}
                  </Box>
                );
              });
            } else {
              // Regular sets
              return exercise.sets.map((set, index) => renderSetInput(group, exercise, set, index));
            }
          })()}

        {/* Set Notes */}
        {exercise.sets.map(
          (set) =>
            showNotes[set.id] && (
              <TextField
                key={`notes-${set.id}`}
                fullWidth
                multiline
                rows={1}
                placeholder={`Set ${exercise.sets.indexOf(set) + 1} notes...`}
                value={set.notes || ''}
                onChange={(e) =>
                  handleSetDataChange(group.id, exercise.id, set.id, 'notes', e.target.value)
                }
                sx={{ mt: 1 }}
                size='small'
                data-testid={`set-notes-${set.id}`}
              />
            )
        )}

        {/* Add Set Button */}
        {!exercise.isDisabled && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => handleAddSet(group.id, exercise.id)}
            size='small'
            sx={{ mt: 2 }}
            data-testid={`add-set-${exercise.id}`}
          >
            Add Set
          </Button>
        )}
      </CardContent>
    </ExerciseCard>
  );

  const renderNonStandardGroup = (group: GroupData) => {
    const activeExercises = group.exercises.filter((ex) => !ex.isDisabled);
    const maxSets = Math.max(...activeExercises.map((ex) => ex.sets.length));

    return (
      <GroupCard key={group.id} data-testid={`group-${group.id}`}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            {group.type.charAt(0).toUpperCase() + group.type.slice(1)} Group
            {group.restSeconds && (
              <Typography component='span' variant='body2' color='text.secondary' sx={{ ml: 1 }}>
                ({group.restSeconds}s rest)
              </Typography>
            )}
          </Typography>

          {Array.from({ length: maxSets }, (_, roundIndex) => (
            <Box key={roundIndex} sx={{ mb: 3 }}>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Round {roundIndex + 1}
              </Typography>
              {activeExercises.map((exercise) => {
                const set = exercise.sets[roundIndex];
                if (!set) return null;

                return (
                  <Box key={`${exercise.id}-${set.id}`} sx={{ mb: 2 }}>
                    <Typography variant='body2' fontWeight='medium' gutterBottom>
                      {exercise.name}
                    </Typography>
                    {renderSetInput(group, exercise, set, roundIndex)}
                    {showNotes[set.id] && (
                      <TextField
                        fullWidth
                        multiline
                        rows={1}
                        placeholder={`${exercise.name} round ${roundIndex + 1} notes...`}
                        value={set.notes || ''}
                        onChange={(e) =>
                          handleSetDataChange(
                            group.id,
                            exercise.id,
                            set.id,
                            'notes',
                            e.target.value
                          )
                        }
                        sx={{ mt: 1 }}
                        size='small'
                        data-testid={`round-notes-${set.id}`}
                      />
                    )}
                  </Box>
                );
              })}
              {roundIndex < maxSets - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </CardContent>
      </GroupCard>
    );
  };

  if (isLoadingActive) {
    return (
      <StyledContainer maxWidth='md'>
        <PageHeader title={t('pages.workout.title')} />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>{t('common.loading')}</Typography>
        </Box>
      </StyledContainer>
    );
  }

  if (endError || pauseError || resumeError || updateError) {
    return (
      <StyledContainer maxWidth='md'>
        <PageHeader title={t('pages.workout.title')} />
        <ErrorDisplay
          error={endError || pauseError || resumeError || updateError}
          onRetry={() => window.location.reload()}
        />
      </StyledContainer>
    );
  }

  if (!isActiveWorkout || !activeWorkout) {
    return (
      <StyledContainer maxWidth='md'>
        <PageHeader title={t('pages.workout.title')} />
        <EmptyState
          icon={<Icon name='fitness_center' />}
          title={t('workout.noActiveWorkout')}
          description={t('workout.noActiveWorkoutDescription')}
          action={
            <Button
              variant='contained'
              startIcon={<Icon name='play_arrow' />}
              data-testid='start-workout-button'
            >
              {t('workout.startNewWorkout')}
            </Button>
          }
        />
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth='md'>
      <PageHeader title={t('pages.workout.title')} />

      {/* Timer Card */}
      {workoutTimer && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TimerCard data-testid='workout-timer'>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h4' fontWeight='bold'>
                  {workoutTimer.formattedTime}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  {t('workout.elapsedTime')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleTimerControl}
                  disabled={isPausing || isResuming}
                  sx={{ color: 'inherit' }}
                  data-testid='timer-control-button'
                >
                  {workoutTimer.isRunning ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton
                  onClick={handleEndWorkout}
                  disabled={isEnding}
                  sx={{ color: 'inherit' }}
                  data-testid='end-workout-button'
                >
                  <StopIcon />
                </IconButton>
              </Box>
            </Box>
          </TimerCard>
        </motion.div>
      )}

      {/* Progress Card */}
      <ProgressCard data-testid='workout-progress'>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant='h6'>{t('workout.progress')}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {completedSets.length}/{allSets.length} {t('workout.sets')}
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
            data-testid='progress-bar'
          />
          <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
            {Math.round(progressPercentage)}% {t('workout.complete')}
          </Typography>
        </CardContent>
      </ProgressCard>

      {/* Workout Content */}
      <Box>
        {workoutData.map((group) => {
          if (group.type === 'single') {
            return group.exercises.map((exercise) => renderExercise(group, exercise));
          } else {
            return renderNonStandardGroup(group);
          }
        })}
      </Box>

      {/* Add Exercise Button */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            variant='outlined'
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setShowAddExercise(true)}
            data-testid='add-exercise-button'
          >
            Add Exercise
          </Button>
        </CardContent>
      </Card>

      {/* Add Exercise Dialog */}
      <Dialog
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add New Exercise</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Exercise Name'
            fullWidth
            variant='outlined'
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            sx={{ mb: 2 }}
            data-testid='exercise-name-input'
          />
          <FormControl fullWidth>
            <InputLabel>Counter Type</InputLabel>
            <Select
              value={newExerciseCounterType}
              label='Counter Type'
              onChange={(e) =>
                setNewExerciseCounterType(e.target.value as 'reps' | 'mins' | 'secs')
              }
              data-testid='exercise-counter-type-select'
            >
              <MenuItem value='reps'>Repetitions</MenuItem>
              <MenuItem value='mins'>Minutes</MenuItem>
              <MenuItem value='secs'>Seconds</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddExercise(false)}>Cancel</Button>
          <Button
            onClick={handleAddExercise}
            variant='contained'
            disabled={!newExerciseName.trim()}
            data-testid='confirm-add-exercise-button'
          >
            Add Exercise
          </Button>
        </DialogActions>
      </Dialog>

      {/* RPE Modal */}
      {rpeModalOpen && (
        <Dialog
          open={!!rpeModalOpen}
          onClose={handleCloseRpeModal}
          maxWidth='sm'
          fullWidth
          data-testid='rpe-modal'
        >
          <DialogTitle>
            Set RPE (Rate of Perceived Exertion)
            <Typography variant='caption' display='block' color='text.secondary'>
              How hard did this set feel? Scale 1-10
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant='h4' color='primary' gutterBottom>
                {tempRpeValue}/10
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {tempRpeValue === 0
                  ? 'Select your perceived exertion'
                  : tempRpeValue <= 3
                    ? 'Very Easy'
                    : tempRpeValue <= 5
                      ? 'Easy'
                      : tempRpeValue <= 7
                        ? 'Moderate'
                        : tempRpeValue <= 8
                          ? 'Hard'
                          : tempRpeValue <= 9
                            ? 'Very Hard'
                            : 'Maximum Effort'}
              </Typography>
            </Box>
            <Rating
              value={tempRpeValue}
              max={10}
              size='large'
              onChange={(_, value) => setTempRpeValue(value || 0)}
              sx={{ fontSize: '2rem' }}
              data-testid='rpe-rating'
            />
            <Box
              sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  variant={tempRpeValue === value ? 'contained' : 'outlined'}
                  size='small'
                  onClick={() => setTempRpeValue(value)}
                  sx={{ minWidth: 40 }}
                >
                  {value}
                </Button>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRpeModal}>Cancel</Button>
            <Button
              onClick={() => {
                // Find the set info from rpeModalOpen ID
                const setInfo = workoutData
                  .flatMap((group) =>
                    group.exercises.flatMap((ex) =>
                      ex.sets.map((set) => ({
                        groupId: group.id,
                        exerciseId: ex.id,
                        setId: set.id,
                      }))
                    )
                  )
                  .find((info) => info.setId === rpeModalOpen);

                if (setInfo) {
                  handleSaveRpe(setInfo.groupId, setInfo.exerciseId, setInfo.setId);
                }
              }}
              variant='contained'
              disabled={tempRpeValue === 0}
            >
              Save RPE
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Action Buttons */}
      <Stack direction='row' spacing={2} sx={{ mt: 3 }}>
        <Button
          variant='contained'
          startIcon={<SaveIcon />}
          onClick={handleSaveWorkout}
          disabled={isUpdatingMetadata}
          fullWidth
          data-testid='save-workout-button'
        >
          {isUpdatingMetadata ? t('common.saving') : t('workout.saveWorkout')}
        </Button>
        <Button
          variant='outlined'
          startIcon={<CheckCircleIcon />}
          onClick={handleEndWorkout}
          disabled={isEnding}
          fullWidth
          data-testid='complete-workout-button'
        >
          {isEnding ? t('common.ending') : t('workout.completeWorkout')}
        </Button>
      </Stack>
    </StyledContainer>
  );
}
