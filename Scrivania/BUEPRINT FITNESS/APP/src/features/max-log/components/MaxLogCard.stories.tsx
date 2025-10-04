import type { Meta, StoryObj } from '@storybook/react';

import { MaxLogCard } from './MaxLogCard';

const meta: Meta<typeof MaxLogCard> = {
  title: 'Features/Max Log/MaxLogCard',
  component: MaxLogCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the max log record',
    },
    exerciseId: {
      control: 'text',
      description: 'ID of the exercise associated with this max log',
    },
    exerciseName: {
      control: 'text',
      description: 'Human-readable name of the exercise',
    },
    weightEnteredByUser: {
      control: { type: 'number', min: 0, step: 0.5 },
      description: 'Weight lifted by the user in kilograms',
    },
    reps: {
      control: { type: 'number', min: 1, max: 50 },
      description: 'Number of repetitions performed',
    },
    estimated1RM: {
      control: { type: 'number', min: 0, step: 0.1 },
      description: 'Estimated 1-Rep Max calculated from weight and reps',
    },
    date: {
      control: 'date',
      description: 'Date when the max log was recorded',
    },
    notes: {
      control: 'text',
      description: 'Optional notes about the lift',
    },
    onViewDetails: {
      action: 'view-details',
      description: 'Callback when user wants to view detailed information',
    },
    onEdit: {
      action: 'edit',
      description: 'Callback when user wants to edit the max log',
    },
    onDelete: {
      action: 'delete',
      description: 'Callback when user wants to delete the max log',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MaxLogCard>;

export const Default: Story = {
  args: {
    id: 'max-log-1',
    exerciseId: 'exercise-bench-press',
    exerciseName: 'Bench Press',
    weightEnteredByUser: 100,
    reps: 5,
    estimated1RM: 112.5,
    date: new Date('2024-01-15T10:30:00'),
    notes: 'Felt strong today, good form throughout.',
    'data-testid': 'max-log-card-default',
  },
};

export const Direct1RM: Story = {
  args: {
    id: 'max-log-2',
    exerciseId: 'exercise-squat',
    exerciseName: 'Back Squat',
    weightEnteredByUser: 140,
    reps: 1,
    estimated1RM: 140,
    date: new Date('2024-01-20T14:15:00'),
    notes: 'New personal record! Perfect depth.',
    'data-testid': 'max-log-card-direct-1rm',
  },
};

export const HighReps: Story = {
  args: {
    id: 'max-log-3',
    exerciseId: 'exercise-deadlift',
    exerciseName: 'Conventional Deadlift',
    weightEnteredByUser: 80,
    reps: 12,
    estimated1RM: 115.2,
    date: new Date('2024-01-10T16:45:00'),
    notes: 'Volume day - focused on technique and endurance.',
    'data-testid': 'max-log-card-high-reps',
  },
};

export const WithoutNotes: Story = {
  args: {
    id: 'max-log-4',
    exerciseId: 'exercise-overhead-press',
    exerciseName: 'Overhead Press',
    weightEnteredByUser: 60,
    reps: 8,
    estimated1RM: 74.4,
    date: new Date('2024-01-12T09:20:00'),
    'data-testid': 'max-log-card-without-notes',
  },
};

export const LongExerciseName: Story = {
  args: {
    id: 'max-log-5',
    exerciseId: 'exercise-incline-dumbbell-press',
    exerciseName: 'Incline Dumbbell Bench Press (45 degrees)',
    weightEnteredByUser: 35,
    reps: 6,
    estimated1RM: 40.6,
    date: new Date('2024-01-18T11:00:00'),
    notes: 'Used dumbbells today instead of barbell for better range of motion.',
    'data-testid': 'max-log-card-long-name',
  },
};

export const LongNotes: Story = {
  args: {
    id: 'max-log-6',
    exerciseId: 'exercise-pull-up',
    exerciseName: 'Weighted Pull-ups',
    weightEnteredByUser: 25,
    reps: 4,
    estimated1RM: 28.1,
    date: new Date('2024-01-22T17:30:00'),
    notes:
      'Used 25kg plate attached to weight belt. Form was excellent on first 3 reps, slight breakdown on the 4th rep but still counted it. Next time I will try for 27.5kg for 3-4 reps to see if I can push the estimated 1RM higher.',
    'data-testid': 'max-log-card-long-notes',
  },
};

export const UnknownExercise: Story = {
  args: {
    id: 'max-log-7',
    exerciseId: 'exercise-unknown-123',
    exerciseName: undefined, // Will default to 'Unknown Exercise'
    weightEnteredByUser: 90,
    reps: 3,
    estimated1RM: 95.6,
    date: new Date('2024-01-25T13:45:00'),
    notes: 'Exercise data seems to be missing.',
    'data-testid': 'max-log-card-unknown-exercise',
  },
};

export const MinimalData: Story = {
  args: {
    id: 'max-log-8',
    exerciseId: 'exercise-minimal',
    exerciseName: 'Test Exercise',
    weightEnteredByUser: 20,
    reps: 1,
    estimated1RM: 20,
    date: new Date(),
    'data-testid': 'max-log-card-minimal',
  },
};
