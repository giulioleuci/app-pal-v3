import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
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

import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';

// Re-export for the demo
export type { WorkoutPageDemoProps };
import { PageHeader } from '@/shared/components/PageHeader';

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

const SetRow = styled(Box)<{ setType?: 'regular' | 'myo-rep-main' | 'myo-rep-mini' }>(
  ({ theme, setType }) => ({
    display: 'grid',
    gridTemplateColumns: '40px 1fr 1fr 80px 50px 50px 50px',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(setType === 'myo-rep-mini' ? 0.5 : 1),
    paddingLeft: setType === 'myo-rep-mini' ? theme.spacing(4) : theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: setType === 'myo-rep-mini' ? theme.palette.grey[50] : 'transparent',
    '&:last-child': {
      borderBottom: 'none',
    },
  })
);

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
  estimatedCounts?: number;
  estimatedWeight?: number;
  estimatedRpe?: number;
  setType?: 'regular' | 'myo-rep-main' | 'myo-rep-mini';
  parentSetId?: string;
}

interface ExerciseData {
  id: string;
  name: string;
  counterType: 'reps' | 'mins' | 'secs';
  sets: PerformedSetData[];
  isDisabled: boolean;
  notes?: string;
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
}

interface WorkoutPageDemoProps {
  /**
   * Whether to show an active workout or empty state
   */
  hasActiveWorkout?: boolean;
  /**
   * Whether the timer is running
   */
  isTimerRunning?: boolean;
  /**
   * Timer display value in MM:SS format
   */
  timerValue?: string;
  /**
   * Whether to show loading state
   */
  isLoading?: boolean;
  /**
   * Whether to show error state
   */
  hasError?: boolean;
  /**
   * Pre-completed set IDs for demo purposes
   */
  initialCompletedSets?: string[];
  /**
   * Whether to show the add exercise dialog
   */
  showAddExerciseDialog?: boolean;
  /**
   * Pre-filled data for exercises with some user inputs
   */
  hasPreFilledData?: boolean;
  /**
   * Type of workout to demonstrate different group structures
   */
  workoutType?: 'standard' | 'superset-focused' | 'myo-reps-focused' | 'circuit-training';
  /**
   * Whether to show the RPE modal demo
   */
  showRPEModal?: boolean;
}

/**
 * Demo component for WorkoutPage showcasing the complete workout input interface.
 * Demonstrates actual input fields for sets with weight, reps/time, RPE tracking.
 */
export function WorkoutPageDemo({
  hasActiveWorkout = true,
  isTimerRunning = true,
  timerValue = '15:32',
  isLoading = false,
  hasError = false,
  initialCompletedSets = [],
  showAddExerciseDialog = false,
  hasPreFilledData = false,
  workoutType = 'standard',
  showRPEModal = false,
}: WorkoutPageDemoProps): React.ReactElement {
  const { t } = useTranslation();
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set(initialCompletedSets));
  const [showNotes, setShowNotes] = useState<{ [key: string]: boolean }>({});
  const [showAddExercise, setShowAddExercise] = useState(showAddExerciseDialog);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCounterType, setNewExerciseCounterType] = useState<'reps' | 'mins' | 'secs'>(
    'reps'
  );
  const [rpeModalOpen, setRpeModalOpen] = useState<string | null>(showRPEModal ? 'set-1' : null);

  // Generate workout data based on workoutType
  const generateWorkoutData = (): GroupData[] => {
    switch (workoutType) {
      case 'superset-focused':
        return [
          {
            id: 'group-1',
            type: 'superset',
            restSeconds: 120,
            exercises: [
              {
                id: 'ex-1',
                name: 'Bench Press',
                counterType: 'reps',
                isDisabled: false,
                sets: [
                  {
                    id: 'set-1-series-1',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 10 : 0,
                    weight: hasPreFilledData ? 80 : 0,
                    completed: initialCompletedSets.includes('set-1-series-1'),
                    estimatedCounts: 10,
                    estimatedWeight: 80,
                    estimatedRpe: 7,
                  },
                  {
                    id: 'set-1-series-2',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 8 : 0,
                    weight: hasPreFilledData ? 85 : 0,
                    completed: initialCompletedSets.includes('set-1-series-2'),
                    estimatedCounts: 8,
                    estimatedWeight: 85,
                    estimatedRpe: 8,
                  },
                  {
                    id: 'set-1-series-3',
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
                sets: [
                  {
                    id: 'set-2-series-1',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 12 : 0,
                    weight: hasPreFilledData ? 25 : 0,
                    completed: initialCompletedSets.includes('set-2-series-1'),
                    estimatedCounts: 12,
                    estimatedWeight: 25,
                    estimatedRpe: 7,
                  },
                  {
                    id: 'set-2-series-2',
                    counterType: 'reps',
                    counts: 0,
                    weight: 0,
                    completed: false,
                    estimatedCounts: 10,
                    estimatedWeight: 27.5,
                    estimatedRpe: 8,
                  },
                  {
                    id: 'set-2-series-3',
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
        ];
      case 'myo-reps-focused':
        return [
          {
            id: 'group-1',
            type: 'single',
            restSeconds: 180,
            exercises: [
              {
                id: 'ex-1',
                name: 'Leg Press (Myo-Reps)',
                counterType: 'reps',
                isDisabled: false,
                sets: [
                  {
                    id: 'myo-main-1',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 15 : 0,
                    weight: hasPreFilledData ? 120 : 0,
                    completed: initialCompletedSets.includes('myo-main-1'),
                    setType: 'myo-rep-main',
                    estimatedCounts: 15,
                    estimatedWeight: 120,
                    estimatedRpe: 8,
                  },
                  {
                    id: 'myo-mini-1',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 5 : 0,
                    weight: hasPreFilledData ? 120 : 0,
                    completed: initialCompletedSets.includes('myo-mini-1'),
                    setType: 'myo-rep-mini',
                    parentSetId: 'myo-main-1',
                    estimatedCounts: 5,
                    estimatedWeight: 120,
                    estimatedRpe: 9,
                  },
                  {
                    id: 'myo-mini-2',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 4 : 0,
                    weight: hasPreFilledData ? 120 : 0,
                    completed: initialCompletedSets.includes('myo-mini-2'),
                    setType: 'myo-rep-mini',
                    parentSetId: 'myo-main-1',
                    estimatedCounts: 4,
                    estimatedWeight: 120,
                    estimatedRpe: 10,
                  },
                  {
                    id: 'myo-mini-3',
                    counterType: 'reps',
                    counts: 0,
                    weight: 0,
                    completed: false,
                    setType: 'myo-rep-mini',
                    parentSetId: 'myo-main-1',
                    estimatedCounts: 3,
                    estimatedWeight: 120,
                    estimatedRpe: 10,
                  },
                ],
              },
            ],
          },
        ];
      case 'circuit-training':
        return [
          {
            id: 'group-1',
            type: 'circuit',
            restSeconds: 60,
            exercises: [
              {
                id: 'ex-1',
                name: 'Push-ups',
                counterType: 'reps',
                isDisabled: false,
                sets: [
                  {
                    id: 'circuit-1-ex1',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 15 : 0,
                    completed: initialCompletedSets.includes('circuit-1-ex1'),
                    estimatedCounts: 15,
                    estimatedRpe: 7,
                  },
                  {
                    id: 'circuit-2-ex1',
                    counterType: 'reps',
                    counts: 0,
                    completed: false,
                    estimatedCounts: 12,
                    estimatedRpe: 8,
                  },
                ],
              },
              {
                id: 'ex-2',
                name: 'Squats',
                counterType: 'reps',
                isDisabled: false,
                sets: [
                  {
                    id: 'circuit-1-ex2',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 20 : 0,
                    completed: initialCompletedSets.includes('circuit-1-ex2'),
                    estimatedCounts: 20,
                    estimatedRpe: 6,
                  },
                  {
                    id: 'circuit-2-ex2',
                    counterType: 'reps',
                    counts: 0,
                    completed: false,
                    estimatedCounts: 18,
                    estimatedRpe: 7,
                  },
                ],
              },
              {
                id: 'ex-3',
                name: 'Mountain Climbers',
                counterType: 'secs',
                isDisabled: false,
                sets: [
                  {
                    id: 'circuit-1-ex3',
                    counterType: 'secs',
                    counts: hasPreFilledData ? 30 : 0,
                    completed: initialCompletedSets.includes('circuit-1-ex3'),
                    estimatedCounts: 30,
                    estimatedRpe: 8,
                  },
                  {
                    id: 'circuit-2-ex3',
                    counterType: 'secs',
                    counts: 0,
                    completed: false,
                    estimatedCounts: 30,
                    estimatedRpe: 9,
                  },
                ],
              },
            ],
          },
        ];
      default: // 'standard'
        return [
          {
            id: 'group-1',
            type: 'single',
            restSeconds: 180,
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
                    counts: hasPreFilledData ? 10 : 0,
                    weight: hasPreFilledData ? 80 : 0,
                    completed: initialCompletedSets.includes('set-1'),
                    rpe: hasPreFilledData ? 7 : undefined,
                    estimatedCounts: 10,
                    estimatedWeight: 80,
                    estimatedRpe: 7,
                  },
                  {
                    id: 'set-2',
                    counterType: 'reps',
                    counts: hasPreFilledData ? 8 : 0,
                    weight: hasPreFilledData ? 85 : 0,
                    completed: initialCompletedSets.includes('set-2'),
                    rpe: hasPreFilledData ? 8 : undefined,
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
            ],
          },
          {
            id: 'group-2',
            type: 'single',
            restSeconds: 120,
            exercises: [
              {
                id: 'ex-2',
                name: 'Plank',
                counterType: 'secs',
                isDisabled: false,
                sets: [
                  {
                    id: 'set-4',
                    counterType: 'secs',
                    counts: hasPreFilledData ? 60 : 0,
                    completed: initialCompletedSets.includes('set-4'),
                    rpe: hasPreFilledData ? 8 : undefined,
                    estimatedCounts: 60,
                    estimatedRpe: 8,
                  },
                  {
                    id: 'set-5',
                    counterType: 'secs',
                    counts: 0,
                    completed: false,
                    estimatedCounts: 45,
                    estimatedRpe: 9,
                  },
                ],
              },
            ],
          },
        ];
    }
  };

  const [workoutData, setWorkoutData] = useState<GroupData[]>(generateWorkoutData());

  const allSets = workoutData
    .filter((group) => !group.exercises.every((ex) => ex.isDisabled))
    .flatMap((group) => group.exercises.filter((ex) => !ex.isDisabled).flatMap((ex) => ex.sets));
  const actualCompletedSets = allSets.filter((set) => set.completed);
  const progressPercentage =
    allSets.length > 0 ? (actualCompletedSets.length / allSets.length) * 100 : 0;

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
  };

  const handleToggleNotes = (id: string) => {
    setShowNotes((prev) => ({ ...prev, [id]: !prev[id] }));
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
  ) => (
    <SetRow key={set.id} setType={set.setType}>
      {/* Set Number with Myo-Rep Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {set.setType === 'myo-rep-mini' && (
          <Icon name='subdirectory_arrow_right' sx={{ fontSize: 16, color: 'text.secondary' }} />
        )}
        <Typography
          variant='body2'
          sx={{
            fontWeight: set.setType === 'myo-rep-main' ? 'bold' : 'medium',
            color: set.setType === 'myo-rep-mini' ? 'text.secondary' : 'inherit',
          }}
        >
          {set.setType === 'myo-rep-main'
            ? 'Main'
            : set.setType === 'myo-rep-mini'
              ? `Mini ${setIndex}`
              : setIndex + 1}
        </Typography>
      </Box>

      {/* Counts Input */}
      <CompactTextField
        type='number'
        placeholder={set.estimatedCounts?.toString() || '0'}
        value={set.counts === 0 ? '' : set.counts || ''}
        onChange={(e) =>
          handleSetDataChange(group.id, exercise.id, set.id, 'counts', Number(e.target.value) || 0)
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

      {/* Weight Input - only show for exercises that need weight */}
      {exercise.counterType === 'reps' && (
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
      )}

      {/* RPE Button that opens modal */}
      <Button
        variant='outlined'
        size='small'
        onClick={() => setRpeModalOpen(set.id)}
        sx={{ minWidth: 60 }}
        data-testid={`set-rpe-button-${set.id}`}
      >
        {set.rpe ? `${set.rpe}/10` : 'RPE'}
      </Button>

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
          onClick={() => console.log('Remove set', set.id)}
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

  const renderGroupedExercises = (group: GroupData) => {
    if (group.type === 'superset' || group.type === 'circuit') {
      const maxSets = Math.max(...group.exercises.map((ex) => ex.sets.length));

      return (
        <GroupCard key={group.id} data-testid={`group-${group.id}`}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon name={group.type === 'superset' ? 'link' : 'refresh'} />
              {group.type === 'superset' ? 'Superset' : 'Circuit'}
              <Typography variant='body2' color='text.secondary'>
                ({group.exercises.length} exercises)
              </Typography>
            </Typography>

            {Array.from({ length: maxSets }, (_, seriesIndex) => (
              <Box key={seriesIndex} sx={{ mb: 3 }}>
                <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 'bold' }}>
                  Series {seriesIndex + 1}
                </Typography>

                {group.exercises.map((exercise) => {
                  const set = exercise.sets[seriesIndex];
                  if (!set) return null;

                  return (
                    <Box key={`${exercise.id}-${seriesIndex}`} sx={{ mb: 2 }}>
                      <Typography variant='body1' sx={{ mb: 1, fontWeight: 'medium' }}>
                        {exercise.name}
                      </Typography>
                      {renderSetInput(group, exercise, set, seriesIndex)}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </CardContent>
        </GroupCard>
      );
    }

    return group.exercises.map((exercise) => renderExercise(group, exercise));
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
                Last:{' '}
                {exercise.lastPerformance.bestWeight
                  ? `${exercise.lastPerformance.bestWeight}kg ×`
                  : ''}{' '}
                {Math.round(exercise.lastPerformance.avgRpe || 0)} RPE
                {exercise.lastPerformance.totalVolume &&
                  ` | ${exercise.lastPerformance.totalVolume}kg total`}
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
                onClick={() => console.log('Toggle exercise', exercise.id)}
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
            onChange={(e) => console.log('Exercise notes changed', e.target.value)}
            sx={{ mb: 2 }}
            size='small'
            data-testid={`exercise-notes-${exercise.id}`}
          />
        )}

        {/* Sets Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            mb: 1,
          }}
        >
          <Typography variant='subtitle2' sx={{ minWidth: 40 }}>
            Set
          </Typography>
          <Typography variant='subtitle2' sx={{ width: 70, textAlign: 'center' }}>
            {getCounterLabel(exercise.counterType)}
          </Typography>
          {exercise.counterType === 'reps' && (
            <Typography variant='subtitle2' sx={{ width: 80, textAlign: 'center' }}>
              Weight
            </Typography>
          )}
          <Typography variant='subtitle2' sx={{ flex: 1, textAlign: 'center' }}>
            RPE
          </Typography>
          <Typography variant='subtitle2' sx={{ width: 100 }}>
            Actions
          </Typography>
        </Box>

        {/* Sets */}
        {!exercise.isDisabled &&
          exercise.sets.map((set, index) => {
            // For myo-rep mini sets, calculate index relative to other mini sets
            let displayIndex = index;
            if (set.setType === 'myo-rep-mini') {
              const miniSetsBeforeThis = exercise.sets
                .slice(0, index)
                .filter((s) => s.setType === 'myo-rep-mini').length;
              displayIndex = miniSetsBeforeThis + 1;
            }
            return renderSetInput(group, exercise, set, displayIndex);
          })}

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
                onChange={(e) => console.log('Set notes changed', e.target.value)}
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
            onClick={() => console.log('Add set to', exercise.id)}
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

  if (isLoading) {
    return (
      <StyledContainer maxWidth='md'>
        <PageHeader title='Active Workout' />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </StyledContainer>
    );
  }

  if (hasError) {
    return (
      <StyledContainer maxWidth='md'>
        <PageHeader title='Active Workout' />
        <Box sx={{ py: 4 }}>
          <Typography color='error'>Error loading workout session</Typography>
        </Box>
      </StyledContainer>
    );
  }

  if (!hasActiveWorkout) {
    return (
      <StyledContainer maxWidth='md'>
        <PageHeader title='Active Workout' />
        <EmptyState
          icon={<Icon name='fitness_center' />}
          title='No Active Workout'
          description='Start a new workout to begin tracking your progress'
          action={
            <Button
              variant='contained'
              startIcon={<Icon name='play_arrow' />}
              data-testid='start-workout-button'
            >
              Start New Workout
            </Button>
          }
        />
      </StyledContainer>
    );
  }

  return (
    <StyledContainer maxWidth='md'>
      <PageHeader title='Active Workout' />

      {/* Timer Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TimerCard data-testid='workout-timer'>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='h4' fontWeight='bold'>
                {timerValue}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Elapsed Time
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'inherit' }} data-testid='timer-control-button'>
                {isTimerRunning ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <IconButton sx={{ color: 'inherit' }} data-testid='end-workout-button'>
                <StopIcon />
              </IconButton>
            </Box>
          </Box>
        </TimerCard>
      </motion.div>

      {/* Progress Card */}
      <ProgressCard data-testid='workout-progress'>
        <CardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant='h6'>Progress</Typography>
            <Typography variant='body2' color='text.secondary'>
              {actualCompletedSets.length}/{allSets.length} sets
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
            data-testid='progress-bar'
          />
          <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
            {Math.round(progressPercentage)}% complete
          </Typography>
        </CardContent>
      </ProgressCard>

      {/* Workout Content */}
      <Box>{workoutData.map((group) => renderGroupedExercises(group))}</Box>

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
            onClick={() => {
              console.log('Add exercise:', newExerciseName, newExerciseCounterType);
              setShowAddExercise(false);
              setNewExerciseName('');
            }}
            variant='contained'
            disabled={!newExerciseName.trim()}
            data-testid='confirm-add-exercise-button'
          >
            Add Exercise
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Buttons */}
      <Stack direction='row' spacing={2} sx={{ mt: 3 }}>
        <Button
          variant='contained'
          startIcon={<SaveIcon />}
          fullWidth
          data-testid='save-workout-button'
        >
          Save Workout
        </Button>
        <Button
          variant='outlined'
          startIcon={<CheckCircleIcon />}
          fullWidth
          data-testid='complete-workout-button'
        >
          Complete Workout
        </Button>
      </Stack>

      {/* RPE Modal */}
      <Dialog
        open={!!rpeModalOpen}
        onClose={() => setRpeModalOpen(null)}
        maxWidth='xs'
        fullWidth
        data-testid='rpe-modal'
      >
        <DialogTitle>Rate Perceived Exertion</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              How hard was this set?
            </Typography>
            <Rating
              value={
                rpeModalOpen
                  ? workoutData
                      .flatMap((g) => g.exercises)
                      .flatMap((e) => e.sets)
                      .find((s) => s.id === rpeModalOpen)?.rpe || 0
                  : 0
              }
              max={10}
              size='large'
              onChange={(_, value) => {
                if (rpeModalOpen && value) {
                  const group = workoutData.find((g) =>
                    g.exercises.some((e) => e.sets.some((s) => s.id === rpeModalOpen))
                  );
                  const exercise = group?.exercises.find((e) =>
                    e.sets.some((s) => s.id === rpeModalOpen)
                  );
                  if (group && exercise) {
                    handleSetDataChange(group.id, exercise.id, rpeModalOpen, 'rpe', value);
                  }
                }
              }}
              sx={{ fontSize: '2rem' }}
              data-testid='rpe-modal-rating'
            />
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1, textAlign: 'center' }}>
              1 = Very Easy, 10 = Maximum Effort
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRpeModalOpen(null)}>Cancel</Button>
          <Button
            onClick={() => setRpeModalOpen(null)}
            variant='contained'
            data-testid='rpe-modal-confirm'
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
}
