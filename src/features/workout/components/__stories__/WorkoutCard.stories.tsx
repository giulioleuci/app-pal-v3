import Container from '@mui/material/Container';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { WorkoutCard } from '../WorkoutCard';

const meta: Meta<typeof WorkoutCard> = {
  title: 'Features/Workout/WorkoutCard',
  component: WorkoutCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Enhanced workout card displaying workout information with dedicated action buttons for viewing details and editing.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Container maxWidth='sm' sx={{ py: 2 }}>
        <Story />
      </Container>
    ),
  ],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the workout',
    },
    trainingPlanName: {
      control: 'text',
      description: 'Name of the training plan',
    },
    sessionName: {
      control: 'text',
      description: 'Name of the workout session',
    },
    startTime: {
      control: 'number',
      description: 'Start time as Unix timestamp',
    },
    endTime: {
      control: 'number',
      description: 'End time as Unix timestamp (optional for in-progress workouts)',
    },
    durationSeconds: {
      control: 'number',
      description: 'Duration in seconds (optional for in-progress workouts)',
    },
    totalVolume: {
      control: 'number',
      description: 'Total volume in kg (optional)',
    },
    notes: {
      control: 'text',
      description: 'User notes about the workout (optional)',
    },
    userRating: {
      control: { type: 'range', min: 1, max: 5, step: 1 },
      description: 'User rating from 1-5 stars (optional)',
    },
    createdAt: {
      control: 'number',
      description: 'Creation timestamp',
    },
    updatedAt: {
      control: 'number',
      description: 'Last update timestamp',
    },
    onViewDetails: {
      action: 'onViewDetails',
      description: 'Callback for viewing workout details (exercises and sets)',
    },
    onEditWorkout: {
      action: 'onEditWorkout',
      description: 'Callback for editing the workout',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Current timestamp for realistic examples
const now = Date.now();
const oneHourAgo = now - 3600 * 1000;
const twoHoursAgo = now - 2 * 3600 * 1000;

export const CompletedWorkout: Story = {
  args: {
    id: 'workout-1',
    trainingPlanName: 'Push Pull Legs',
    sessionName: 'Push Day - Chest & Triceps',
    startTime: twoHoursAgo,
    endTime: oneHourAgo,
    durationSeconds: 3600, // 1 hour
    totalVolume: 2500,
    notes: 'Great session! Felt strong on bench press today.',
    userRating: 5,
    createdAt: twoHoursAgo,
    updatedAt: oneHourAgo,
    onViewDetails: action('onViewDetails'),
    onEditWorkout: action('onEditWorkout'),
  },
};

export const InProgressWorkout: Story = {
  args: {
    id: 'workout-2',
    trainingPlanName: 'Upper Lower Split',
    sessionName: 'Upper Body Power',
    startTime: oneHourAgo,
    // No endTime or durationSeconds for in-progress workout
    totalVolume: 1200,
    createdAt: oneHourAgo,
    updatedAt: oneHourAgo,
    onViewDetails: action('onViewDetails'),
    onEditWorkout: action('onEditWorkout'),
  },
};

export const ShortWorkout: Story = {
  args: {
    id: 'workout-3',
    trainingPlanName: 'Quick HIIT',
    sessionName: 'Morning Cardio',
    startTime: now - 30 * 60 * 1000, // 30 minutes ago
    endTime: now,
    durationSeconds: 1800, // 30 minutes
    notes: 'Quick morning session before work',
    userRating: 4,
    createdAt: now - 30 * 60 * 1000,
    updatedAt: now,
    onViewDetails: action('onViewDetails'),
    onEditWorkout: action('onEditWorkout'),
  },
};

export const MinimalWorkout: Story = {
  args: {
    id: 'workout-4',
    trainingPlanName: 'Strength Training',
    sessionName: 'Deadlift Focus',
    startTime: now - 5400 * 1000, // 90 minutes ago
    endTime: now - 900 * 1000, // 15 minutes ago
    durationSeconds: 4500, // 75 minutes
    createdAt: now - 5400 * 1000,
    updatedAt: now - 900 * 1000,
    onViewDetails: action('onViewDetails'),
    onEditWorkout: action('onEditWorkout'),
  },
};

export const LongWorkoutWithNotes: Story = {
  args: {
    id: 'workout-5',
    trainingPlanName: 'Bodybuilding Split',
    sessionName: 'Leg Day - Quads & Glutes',
    startTime: now - 7200 * 1000, // 2 hours ago
    endTime: now - 900 * 1000, // 15 minutes ago
    durationSeconds: 6300, // 105 minutes
    totalVolume: 4200,
    notes:
      'Brutal leg session! Squats felt heavy today but managed to hit all reps. Need to focus more on glute activation next time.',
    userRating: 3,
    createdAt: now - 7200 * 1000,
    updatedAt: now - 900 * 1000,
    onViewDetails: action('onViewDetails'),
    onEditWorkout: action('onEditWorkout'),
  },
};

/**
 * Multiple workout cards showing different states and scenarios
 */
export const MultipleWorkouts: Story = {
  render: () => (
    <Container maxWidth='sm' sx={{ py: 2 }}>
      <WorkoutCard {...CompletedWorkout.args!} data-testid='completed-workout' />
      <WorkoutCard {...InProgressWorkout.args!} data-testid='in-progress-workout' />
      <WorkoutCard {...ShortWorkout.args!} data-testid='short-workout' />
      <WorkoutCard {...MinimalWorkout.args!} data-testid='minimal-workout' />
    </Container>
  ),
};
