import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ExerciseDetailDialog } from '../ExerciseDetailDialog';

const meta: Meta<typeof ExerciseDetailDialog> = {
  title: 'Features/Exercise/ExerciseDetailDialog',
  component: ExerciseDetailDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Comprehensive exercise detail dialog showing muscle activation levels with visual sliders (0-100%) and complete exercise database information.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when dialog should close',
    },
    id: {
      control: 'text',
      description: 'Exercise unique identifier',
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
      description: 'Muscle activation mapping (0-1 scale)',
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
      description: 'Exercise notes',
    },
    substitutions: {
      control: 'object',
      description: 'Exercise substitutions array',
    },
    onEditExercise: {
      action: 'onEditExercise',
      description: 'Callback for editing the exercise',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for testing the dialog
const DialogWrapper = (args: any) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant='contained' onClick={() => setOpen(true)}>
        Open Exercise Detail Dialog
      </Button>
      <ExerciseDetailDialog {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

// Current timestamp for realistic examples
const now = Date.now();

export const CompoundExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-1',
    name: 'Barbell Back Squat',
    description:
      'A fundamental compound movement that targets the quadriceps, glutes, and core while building overall lower body strength. This exercise is considered the king of all lower body movements and forms the foundation of many strength training programs.',
    category: 'strength',
    movementType: 'compound',
    difficulty: 'intermediate',
    equipment: ['barbell', 'squat rack', 'weight plates', 'safety bars'],
    muscleActivation: {
      quadriceps: 0.92,
      glutes: 0.85,
      core: 0.78,
      hamstrings: 0.65,
      calves: 0.45,
      'lower back': 0.58,
      'upper back': 0.35,
      'hip flexors': 0.42,
    },
    counterType: 'reps',
    jointType: 'multi',
    notes:
      'Focus on maintaining proper depth (hip crease below knee cap), keeping chest up, and ensuring knees track over toes. Breathe in at the top, hold breath during descent and ascent, then exhale at the top.',
    substitutions: [
      'front squat',
      'goblet squat',
      'leg press',
      'Bulgarian split squats',
      'hack squat',
    ],
    createdAt: now - 86400000, // 1 day ago
    updatedAt: now - 3600000, // 1 hour ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};

export const IsolationExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-2',
    name: 'Bicep Curls',
    description:
      'Classic isolation exercise specifically targeting the biceps brachii muscle. Excellent for building arm mass and strength.',
    category: 'strength',
    movementType: 'isolation',
    difficulty: 'beginner',
    equipment: ['dumbbells'],
    muscleActivation: {
      biceps: 0.95,
      forearms: 0.42,
      'anterior deltoid': 0.28,
      brachialis: 0.65,
      brachioradialis: 0.38,
    },
    counterType: 'reps',
    jointType: 'single',
    movementPattern: 'pull',
    notes:
      'Keep elbows stationary at your sides. Control the weight both up and down. Avoid swinging or using momentum.',
    substitutions: [
      'hammer curls',
      'cable curls',
      'resistance band curls',
      'concentration curls',
      'preacher curls',
    ],
    createdAt: now - 172800000, // 2 days ago
    updatedAt: now - 7200000, // 2 hours ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};

export const CardioExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-3',
    name: 'High-Intensity Interval Training (HIIT)',
    description:
      'Alternating between high-intensity work periods and recovery periods to improve cardiovascular fitness, increase metabolic rate, and burn calories efficiently. This training method is time-effective and provides both aerobic and anaerobic benefits.',
    category: 'cardio',
    movementType: 'compound',
    difficulty: 'advanced',
    equipment: ['timer', 'optional: bodyweight'],
    muscleActivation: {
      'cardiovascular system': 0.98,
      quadriceps: 0.68,
      glutes: 0.62,
      core: 0.75,
      calves: 0.58,
      hamstrings: 0.55,
      'hip flexors': 0.48,
      shoulders: 0.45,
      chest: 0.35,
    },
    counterType: 'time',
    jointType: 'multi',
    movementPattern: 'explosive',
    notes:
      'Warm up thoroughly before starting. Work at 85-95% effort during high-intensity intervals. Monitor heart rate throughout the session. Allow adequate recovery between intervals.',
    substitutions: [
      'steady-state cardio',
      'circuit training',
      'tabata protocol',
      'fartlek training',
      'sprint intervals',
    ],
    createdAt: now - 259200000, // 3 days ago
    updatedAt: now - 1800000, // 30 minutes ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};

export const FlexibilityExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-4',
    name: 'Seated Forward Fold',
    description:
      'A fundamental yoga pose and stretching exercise that improves hamstring and lower back flexibility while promoting relaxation and stress relief.',
    category: 'flexibility',
    movementType: 'isolation',
    difficulty: 'beginner',
    equipment: ['yoga mat', 'optional: yoga strap'],
    muscleActivation: {
      hamstrings: 0.88,
      calves: 0.45,
      'lower back': 0.52,
      glutes: 0.35,
      'spine extensors': 0.42,
    },
    counterType: 'time',
    jointType: 'multi',
    movementPattern: 'stretch',
    notes:
      'Hold the stretch for 30-60 seconds. Breathe deeply and avoid bouncing. Focus on lengthening the spine before folding forward. Stop if you feel sharp pain.',
    substitutions: [
      'standing forward fold',
      'hamstring stretch with strap',
      'pigeon pose',
      'figure-4 stretch',
    ],
    createdAt: now - 432000000, // 5 days ago
    updatedAt: now - 86400000, // 1 day ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};

export const AdvancedExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-5',
    name: 'Olympic Clean & Jerk',
    description:
      'The most complex Olympic weightlifting movement combining explosive power, perfect technique, coordination, and mobility. This exercise targets nearly every muscle in the body and requires extensive coaching to master safely. It consists of two phases: the clean (lifting the barbell to the shoulders) and the jerk (pressing it overhead).',
    category: 'strength',
    movementType: 'compound',
    difficulty: 'advanced',
    equipment: [
      'Olympic barbell',
      'bumper plates',
      'lifting platform',
      'weightlifting shoes',
      'chalk',
      'lifting belt',
    ],
    muscleActivation: {
      quadriceps: 0.92,
      glutes: 0.88,
      shoulders: 0.94,
      'upper back': 0.85,
      core: 0.91,
      triceps: 0.78,
      forearms: 0.82,
      calves: 0.68,
      hamstrings: 0.72,
      'hip flexors': 0.55,
      'lower back': 0.75,
      chest: 0.35,
      lats: 0.65,
      rhomboids: 0.58,
      trapezius: 0.88,
    },
    counterType: 'reps',
    jointType: 'multi',
    movementPattern: 'explosive',
    notes:
      'This is an extremely technical movement that requires extensive coaching and practice. Master the individual components (deadlift, high pull, front squat, overhead press) before attempting the full movement. Start with a broomstick or empty barbell to learn proper technique. Requires excellent mobility in ankles, hips, thoracic spine, and shoulders.',
    substitutions: [
      'power clean',
      'hang clean',
      'push press',
      'front squat + overhead press',
      'kettlebell clean & jerk',
    ],
    createdAt: now - 1209600000, // 2 weeks ago
    updatedAt: now - 43200000, // 12 hours ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};

export const BodyweightExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-6',
    name: 'Push-ups',
    description:
      'Classic bodyweight exercise that builds upper body strength and muscular endurance. Can be modified for all fitness levels and performed anywhere.',
    category: 'strength',
    movementType: 'compound',
    difficulty: 'beginner',
    equipment: ['none'],
    muscleActivation: {
      chest: 0.82,
      triceps: 0.76,
      'anterior deltoid': 0.68,
      core: 0.55,
      'serratus anterior': 0.48,
      'posterior deltoid': 0.25,
    },
    counterType: 'reps',
    jointType: 'multi',
    movementPattern: 'push',
    notes:
      'Maintain a straight line from head to heels. Lower until chest nearly touches the ground. Keep elbows at 45-degree angle to torso.',
    substitutions: [
      'incline push-ups',
      'decline push-ups',
      'knee push-ups',
      'wall push-ups',
      'diamond push-ups',
    ],
    createdAt: now - 604800000, // 1 week ago
    updatedAt: now - 10800000, // 3 hours ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};

export const MinimalActivationExercise: Story = {
  render: DialogWrapper,
  args: {
    id: 'exercise-7',
    name: 'Calf Raises',
    description:
      'Simple isolation exercise targeting the calf muscles, specifically the gastrocnemius and soleus.',
    category: 'strength',
    movementType: 'isolation',
    difficulty: 'beginner',
    equipment: ['optional: dumbbells', 'step or platform'],
    muscleActivation: {
      calves: 0.95,
      soleus: 0.85,
      'tibialis anterior': 0.15,
      core: 0.25,
    },
    counterType: 'reps',
    jointType: 'single',
    notes: 'Rise up on toes as high as possible, hold briefly, then lower slowly with control.',
    substitutions: ['seated calf raises', 'single-leg calf raises', 'jump rope'],
    createdAt: now - 345600000, // 4 days ago
    updatedAt: now - 21600000, // 6 hours ago
    onClose: action('onClose'),
    onEditExercise: action('onEditExercise'),
  },
};
