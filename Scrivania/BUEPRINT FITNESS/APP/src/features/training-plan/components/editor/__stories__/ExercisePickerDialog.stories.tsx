import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import type { Exercise } from '../ExercisePickerDialog';
import { ExercisePickerDialog } from '../ExercisePickerDialog';

// Mock exercises data
const mockExercises: Exercise[] = [
  {
    id: 'ex1',
    name: 'Bench Press',
    description: 'Horizontal pressing movement for chest development',
    category: 'chest',
    movement_type: 'push',
    movement_pattern: 'horizontal_press',
    difficulty: 'intermediate',
    equipment: ['barbell', 'bench'],
    muscle_activation: { chest: 0.8, triceps: 0.6, shoulders: 0.4 },
    counter_type: 'reps',
    joint_type: 'multi_joint',
    notes: 'Keep shoulder blades retracted throughout the movement',
    substitutions: ['dumbbell_press', 'push_ups'],
  },
  {
    id: 'ex2',
    name: 'Barbell Rows',
    description: 'Horizontal pulling movement for back development',
    category: 'back',
    movement_type: 'pull',
    movement_pattern: 'horizontal_pull',
    difficulty: 'intermediate',
    equipment: ['barbell'],
    muscle_activation: { latissimus: 0.8, rhomboids: 0.7, biceps: 0.5 },
    counter_type: 'reps',
    joint_type: 'multi_joint',
    substitutions: ['dumbbell_rows', 'cable_rows'],
  },
  {
    id: 'ex3',
    name: 'Push-ups',
    description: 'Bodyweight pressing movement for upper body strength',
    category: 'chest',
    movement_type: 'push',
    movement_pattern: 'horizontal_press',
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    muscle_activation: { chest: 0.7, triceps: 0.6, core: 0.4 },
    counter_type: 'reps',
    joint_type: 'multi_joint',
    notes: 'Maintain rigid plank position throughout',
    substitutions: ['incline_push_ups', 'knee_push_ups'],
  },
  {
    id: 'ex4',
    name: 'Deadlift',
    description: 'Hip-hinge movement for posterior chain development',
    category: 'back',
    movement_type: 'pull',
    movement_pattern: 'hip_hinge',
    difficulty: 'advanced',
    equipment: ['barbell'],
    muscle_activation: { hamstrings: 0.9, glutes: 0.8, erector_spinae: 0.7, traps: 0.6 },
    counter_type: 'reps',
    joint_type: 'multi_joint',
    notes: 'Keep bar close to body throughout the lift',
    substitutions: ['sumo_deadlift', 'trap_bar_deadlift'],
  },
  {
    id: 'ex5',
    name: 'Plank',
    description: 'Isometric core stability exercise',
    category: 'core',
    movement_type: 'static',
    movement_pattern: 'anti_extension',
    difficulty: 'beginner',
    equipment: ['bodyweight'],
    muscle_activation: { core: 0.9, shoulders: 0.5 },
    counter_type: 'time',
    joint_type: 'isolation',
    notes: 'Maintain neutral spine position',
    substitutions: ['side_plank', 'dead_bug'],
  },
];

const meta = {
  title: 'Training Plan/Editor/ExercisePickerDialog',
  component: ExercisePickerDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal dialog for selecting an exercise from a list of available exercises. Provides search and filtering capabilities to help users find the right exercise.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      description: 'Whether the dialog is open',
      control: { type: 'boolean' },
    },
    onClose: {
      description: 'Callback fired when the dialog should be closed',
      action: 'close',
    },
    exercises: {
      description: 'Array of available exercises to choose from',
      control: { type: 'object' },
    },
    onSelectExercise: {
      description: 'Callback fired when an exercise is selected',
      action: 'selectExercise',
    },
    isLoading: {
      description: 'Whether the dialog is in a loading state',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof ExercisePickerDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: action('close'),
    exercises: mockExercises,
    onSelectExercise: action('selectExercise'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    open: true,
    onClose: action('close'),
    exercises: mockExercises,
    onSelectExercise: action('selectExercise'),
    isLoading: true,
  },
};

export const EmptyExercises: Story = {
  args: {
    open: true,
    onClose: action('close'),
    exercises: [],
    onSelectExercise: action('selectExercise'),
    isLoading: false,
  },
};

export const SingleExercise: Story = {
  args: {
    open: true,
    onClose: action('close'),
    exercises: [mockExercises[0]],
    onSelectExercise: action('selectExercise'),
    isLoading: false,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: action('close'),
    exercises: mockExercises,
    onSelectExercise: action('selectExercise'),
    isLoading: false,
  },
};
