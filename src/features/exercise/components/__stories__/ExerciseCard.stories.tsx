import Container from '@mui/material/Container';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { ExerciseCard } from '../ExerciseCard';

const meta: Meta<typeof ExerciseCard> = {
  title: 'Features/Exercise/ExerciseCard',
  component: ExerciseCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Enhanced exercise card displaying exercise information with dedicated action buttons for viewing muscle activation details and editing.',
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
      description: 'Unique identifier for the exercise',
    },
    name: {
      control: 'text',
      description: 'Exercise name',
    },
    description: {
      control: 'text',
      description: 'Exercise description',
    },
    category: {
      control: 'select',
      options: ['strength', 'cardio', 'flexibility', 'mobility', 'balance'],
      description: 'Exercise category',
    },
    movementType: {
      control: 'select',
      options: ['compound', 'isolation', 'unilateral', 'bilateral'],
      description: 'Movement type',
    },
    difficulty: {
      control: 'select',
      options: ['beginner', 'intermediate', 'advanced'],
      description: 'Difficulty level',
    },
    equipment: {
      control: 'object',
      description: 'Required equipment array',
    },
    muscleActivation: {
      control: 'object',
      description: 'Muscle activation mapping (muscle name -> activation percentage 0-1)',
    },
    counterType: {
      control: 'select',
      options: ['reps', 'time', 'distance', 'calories'],
      description: 'Counter type',
    },
    jointType: {
      control: 'select',
      options: ['single', 'multi'],
      description: 'Joint type',
    },
    notes: {
      control: 'text',
      description: 'Exercise notes (optional)',
    },
    substitutions: {
      control: 'object',
      description: 'Exercise substitutions array',
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
      description: 'Callback for viewing exercise details (including muscle activation)',
    },
    onEditExercise: {
      action: 'onEditExercise',
      description: 'Callback for editing the exercise',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Current timestamp for realistic examples
const now = Date.now();

export const CompoundExercise: Story = {
  args: {
    id: 'exercise-1',
    name: 'Barbell Back Squat',
    description:
      'A fundamental compound movement that targets the quadriceps, glutes, and core while building overall lower body strength.',
    category: 'strength',
    movementType: 'compound',
    difficulty: 'intermediate',
    equipment: ['barbell', 'squat rack', 'weight plates'],
    muscleActivation: {
      quadriceps: 0.9,
      glutes: 0.8,
      core: 0.7,
      hamstrings: 0.6,
      calves: 0.4,
      'lower back': 0.5,
    },
    counterType: 'reps',
    jointType: 'multi',
    notes: 'Focus on depth and controlled movement. Keep chest up and knees tracking over toes.',
    substitutions: ['front squat', 'goblet squat', 'leg press'],
    createdAt: now - 86400000, // 1 day ago
    updatedAt: now - 3600000, // 1 hour ago
    onViewDetails: action('onViewDetails'),
    onEditExercise: action('onEditExercise'),
  },
};

export const IsolationExercise: Story = {
  args: {
    id: 'exercise-2',
    name: 'Bicep Curls',
    description: 'Isolation exercise targeting the biceps brachii muscle.',
    category: 'strength',
    movementType: 'isolation',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    muscleActivation: {
      biceps: 0.95,
      forearms: 0.4,
      'anterior deltoid': 0.2,
    },
    counterType: 'reps',
    jointType: 'single',
    substitutions: ['hammer curls', 'cable curls', 'resistance band curls'],
    createdAt: now - 172800000, // 2 days ago
    updatedAt: now - 7200000, // 2 hours ago
    onViewDetails: action('onViewDetails'),
    onEditExercise: action('onEditExercise'),
  },
};

export const CardioExercise: Story = {
  args: {
    id: 'exercise-3',
    name: 'High-Intensity Interval Training',
    description:
      'Alternating between high-intensity and recovery periods to improve cardiovascular fitness and burn calories.',
    category: 'cardio',
    movementType: 'compound',
    difficulty: 'advanced',
    equipment: ['none'],
    muscleActivation: {
      heart: 0.95,
      quadriceps: 0.6,
      glutes: 0.5,
      core: 0.7,
      calves: 0.6,
    },
    counterType: 'time',
    jointType: 'multi',
    notes: 'Warm up thoroughly before starting. Monitor heart rate throughout the session.',
    substitutions: ['steady-state cardio', 'circuit training', 'tabata protocol'],
    createdAt: now - 259200000, // 3 days ago
    updatedAt: now - 1800000, // 30 minutes ago
    onViewDetails: action('onViewDetails'),
    onEditExercise: action('onEditExercise'),
  },
};

export const BodyweightExercise: Story = {
  args: {
    id: 'exercise-4',
    name: 'Push-ups',
    description: 'Classic bodyweight exercise for upper body strength.',
    category: 'strength',
    movementType: 'compound',
    difficulty: 'beginner',
    equipment: ['none'],
    muscleActivation: {
      chest: 0.8,
      triceps: 0.7,
      'anterior deltoid': 0.6,
      core: 0.5,
    },
    counterType: 'reps',
    jointType: 'multi',
    substitutions: ['incline push-ups', 'decline push-ups', 'knee push-ups'],
    createdAt: now - 432000000, // 5 days ago
    updatedAt: now - 10800000, // 3 hours ago
    onViewDetails: action('onViewDetails'),
    onEditExercise: action('onEditExercise'),
  },
};

export const FlexibilityExercise: Story = {
  args: {
    id: 'exercise-5',
    name: 'Hamstring Stretch',
    description: 'Static stretch to improve hamstring flexibility and reduce lower back tension.',
    category: 'flexibility',
    movementType: 'isolation',
    difficulty: 'beginner',
    equipment: ['yoga mat'],
    muscleActivation: {
      hamstrings: 0.8,
      calves: 0.4,
      'lower back': 0.3,
    },
    counterType: 'time',
    jointType: 'single',
    notes: 'Hold stretch for 30-60 seconds. Breathe deeply and avoid bouncing.',
    substitutions: ['seated hamstring stretch', 'standing forward fold', 'pigeon pose'],
    createdAt: now - 604800000, // 1 week ago
    updatedAt: now - 86400000, // 1 day ago
    onViewDetails: action('onViewDetails'),
    onEditExercise: action('onEditExercise'),
  },
};

export const AdvancedExercise: Story = {
  args: {
    id: 'exercise-6',
    name: 'Olympic Clean & Jerk',
    description:
      'Advanced Olympic weightlifting movement combining explosive power, coordination, and technique. Targets multiple muscle groups in a complex movement pattern.',
    category: 'strength',
    movementType: 'compound',
    difficulty: 'advanced',
    equipment: ['Olympic barbell', 'weight plates', 'lifting platform', 'lifting shoes'],
    muscleActivation: {
      quadriceps: 0.9,
      glutes: 0.8,
      shoulders: 0.9,
      'upper back': 0.8,
      core: 0.9,
      triceps: 0.7,
      forearms: 0.8,
      calves: 0.6,
    },
    counterType: 'reps',
    jointType: 'multi',
    notes:
      'Requires extensive coaching and practice. Master technique with lighter weights before progressing. Highly technical movement requiring explosive power and mobility.',
    substitutions: ['power clean', 'hang clean', 'push press', 'front squat + overhead press'],
    createdAt: now - 1209600000, // 2 weeks ago
    updatedAt: now - 43200000, // 12 hours ago
    onViewDetails: action('onViewDetails'),
    onEditExercise: action('onEditExercise'),
  },
};

/**
 * Multiple exercise cards showing different categories and difficulty levels
 */
export const MultipleExercises: Story = {
  render: () => (
    <Container maxWidth='sm' sx={{ py: 2 }}>
      <ExerciseCard {...CompoundExercise.args!} data-testid='compound-exercise' />
      <ExerciseCard {...IsolationExercise.args!} data-testid='isolation-exercise' />
      <ExerciseCard {...CardioExercise.args!} data-testid='cardio-exercise' />
      <ExerciseCard {...BodyweightExercise.args!} data-testid='bodyweight-exercise' />
    </Container>
  ),
};
