import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import type { ExerciseGroup } from '../SessionContentEditor';
import { SessionContentEditor } from '../SessionContentEditor';

// Mock exercise groups data
const mockExerciseGroups: ExerciseGroup[] = [
  {
    id: '1',
    type: 'superset',
    rounds: { min: 3, max: 4 },
    rest_time_seconds: 120,
    applied_exercises: [
      {
        id: '1',
        exercise_id: 'ex1',
        exercise_name: 'Bench Press',
        set_configuration: {
          type: 'strength',
          sets: 4,
          reps: 6,
          weight_percentage: 85,
        },
        rest_time_seconds: 180,
        execution_count: 0,
      },
      {
        id: '2',
        exercise_id: 'ex2',
        exercise_name: 'Barbell Rows',
        set_configuration: {
          type: 'strength',
          sets: 4,
          reps: 6,
          weight_percentage: 80,
        },
        rest_time_seconds: 180,
        execution_count: 0,
      },
    ],
  },
  {
    id: '2',
    type: 'circuit',
    duration_minutes: 15,
    applied_exercises: [
      {
        id: '3',
        exercise_id: 'ex3',
        exercise_name: 'Push-ups',
        set_configuration: {
          type: 'endurance',
          sets: 3,
          reps: 15,
        },
        execution_count: 0,
      },
      {
        id: '4',
        exercise_id: 'ex4',
        exercise_name: 'Squats',
        set_configuration: {
          type: 'endurance',
          sets: 3,
          reps: 20,
        },
        execution_count: 0,
      },
    ],
  },
  {
    id: '3',
    type: 'strength',
    applied_exercises: [
      {
        id: '5',
        exercise_id: 'ex5',
        exercise_name: 'Deadlift',
        set_configuration: {
          type: 'strength',
          sets: 5,
          reps: 3,
          weight_percentage: 90,
        },
        rest_time_seconds: 240,
        execution_count: 0,
      },
    ],
  },
];

const meta = {
  title: 'Training Plan/Editor/SessionContentEditor',
  component: SessionContentEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A component that renders a vertical stack of ExerciseGroupCard components for editing session content. Each group contains nested applied exercises with their own editing controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    exerciseGroups: {
      description: 'Array of exercise groups to display',
      control: { type: 'object' },
    },
    onReorderGroup: {
      description: 'Callback fired when an exercise group should be reordered',
      action: 'reorderGroup',
    },
    onEditGroup: {
      description: 'Callback fired when an exercise group should be edited',
      action: 'editGroup',
    },
    onDeleteGroup: {
      description: 'Callback fired when an exercise group should be deleted',
      action: 'deleteGroup',
    },
    onReorderExercise: {
      description: 'Callback fired when an applied exercise should be reordered within a group',
      action: 'reorderExercise',
    },
    onEditExercise: {
      description: 'Callback fired when an applied exercise should be edited',
      action: 'editExercise',
    },
    onDeleteExercise: {
      description: 'Callback fired when an applied exercise should be deleted',
      action: 'deleteExercise',
    },
    onAddExercise: {
      description: 'Callback fired when a new exercise should be added to a group',
      action: 'addExercise',
    },
    onAddGroup: {
      description: 'Callback fired when a new exercise group should be added',
      action: 'addGroup',
    },
    isLoading: {
      description: 'Whether the editor is in a loading state',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof SessionContentEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    exerciseGroups: mockExerciseGroups,
    onReorderGroup: action('reorderGroup'),
    onEditGroup: action('editGroup'),
    onDeleteGroup: action('deleteGroup'),
    onReorderExercise: action('reorderExercise'),
    onEditExercise: action('editExercise'),
    onDeleteExercise: action('deleteExercise'),
    onAddExercise: action('addExercise'),
    onAddGroup: action('addGroup'),
    isLoading: false,
  },
};

export const Empty: Story = {
  args: {
    exerciseGroups: [],
    onReorderGroup: action('reorderGroup'),
    onEditGroup: action('editGroup'),
    onDeleteGroup: action('deleteGroup'),
    onReorderExercise: action('reorderExercise'),
    onEditExercise: action('editExercise'),
    onDeleteExercise: action('deleteExercise'),
    onAddExercise: action('addExercise'),
    onAddGroup: action('addGroup'),
    isLoading: false,
  },
};

export const SingleGroup: Story = {
  args: {
    exerciseGroups: [mockExerciseGroups[0]],
    onReorderGroup: action('reorderGroup'),
    onEditGroup: action('editGroup'),
    onDeleteGroup: action('deleteGroup'),
    onReorderExercise: action('reorderExercise'),
    onEditExercise: action('editExercise'),
    onDeleteExercise: action('deleteExercise'),
    onAddExercise: action('addExercise'),
    onAddGroup: action('addGroup'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    exerciseGroups: mockExerciseGroups,
    onReorderGroup: action('reorderGroup'),
    onEditGroup: action('editGroup'),
    onDeleteGroup: action('deleteGroup'),
    onReorderExercise: action('reorderExercise'),
    onEditExercise: action('editExercise'),
    onDeleteExercise: action('deleteExercise'),
    onAddExercise: action('addExercise'),
    onAddGroup: action('addGroup'),
    isLoading: true,
  },
};
