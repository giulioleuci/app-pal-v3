import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import type { PerformedExercise } from '../WorkoutDetailDialog';
import { WorkoutDetailDialog } from '../WorkoutDetailDialog';

const meta: Meta<typeof WorkoutDetailDialog> = {
  title: 'Features/Workout/WorkoutDetailDialog',
  component: WorkoutDetailDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog displaying detailed workout information including all exercises and sets performed with comprehensive performance metrics.',
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
    sessionName: {
      control: 'text',
      description: 'Workout session name',
    },
    trainingPlanName: {
      control: 'text',
      description: 'Training plan name',
    },
    startTime: {
      control: 'number',
      description: 'Workout start time as timestamp',
    },
    durationSeconds: {
      control: 'number',
      description: 'Workout duration in seconds',
    },
    totalVolume: {
      control: 'number',
      description: 'Total workout volume in kg',
    },
    userRating: {
      control: { type: 'range', min: 1, max: 5, step: 1 },
      description: 'User rating from 1-5 stars',
    },
    notes: {
      control: 'text',
      description: 'Workout notes',
    },
    exercises: {
      control: 'object',
      description: 'List of performed exercises with sets',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample exercise data
const sampleExercises: PerformedExercise[] = [
  {
    id: 'exercise-1',
    exerciseName: 'Barbell Back Squat',
    exerciseCategory: 'Strength',
    isSkipped: false,
    notes: 'Felt strong today, good depth on all reps',
    totalSets: 4,
    totalVolume: 720,
    estimated1rm: 120,
    rpeEffort: '8/10',
    sets: [
      { counts: 8, weight: 60, completed: true, rpe: 7, counterType: 'reps' },
      { counts: 6, weight: 80, completed: true, rpe: 8, counterType: 'reps' },
      {
        counts: 5,
        weight: 90,
        completed: true,
        rpe: 9,
        counterType: 'reps',
        notes: 'Last rep was tough',
      },
      { counts: 3, weight: 100, completed: true, rpe: 9, counterType: 'reps' },
    ],
  },
  {
    id: 'exercise-2',
    exerciseName: 'Bench Press',
    exerciseCategory: 'Strength',
    isSkipped: false,
    totalSets: 3,
    totalVolume: 480,
    estimated1rm: 95,
    sets: [
      { counts: 8, weight: 70, completed: true, rpe: 7, counterType: 'reps' },
      { counts: 6, weight: 80, completed: true, rpe: 8, counterType: 'reps' },
      {
        counts: 4,
        weight: 85,
        completed: false,
        rpe: 9,
        counterType: 'reps',
        notes: 'Failed on 4th rep',
      },
    ],
  },
  {
    id: 'exercise-3',
    exerciseName: 'Planks',
    exerciseCategory: 'Core',
    isSkipped: false,
    totalSets: 3,
    sets: [
      { counts: 60, completed: true, counterType: 'time' },
      { counts: 45, completed: true, counterType: 'time' },
      { counts: 30, completed: true, counterType: 'time' },
    ],
  },
  {
    id: 'exercise-4',
    exerciseName: 'Pull-ups',
    exerciseCategory: 'Strength',
    isSkipped: true,
    notes: 'Skipped due to shoulder discomfort',
    totalSets: 0,
    sets: [],
  },
];

// Interactive wrapper for testing the dialog
const DialogWrapper = (args: any) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant='contained' onClick={() => setOpen(true)}>
        Open Workout Detail Dialog
      </Button>
      <WorkoutDetailDialog {...args} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export const CompletedWorkout: Story = {
  render: DialogWrapper,
  args: {
    sessionName: 'Push Day - Chest & Triceps',
    trainingPlanName: 'Push Pull Legs',
    startTime: Date.now() - 7200000, // 2 hours ago
    durationSeconds: 5400, // 90 minutes
    totalVolume: 1200,
    userRating: 4,
    notes: 'Great session! Personal record on squats today.',
    exercises: sampleExercises,
    onClose: action('onClose'),
  },
};

export const ShortWorkout: Story = {
  render: DialogWrapper,
  args: {
    sessionName: 'Quick Morning HIIT',
    trainingPlanName: 'Home Workouts',
    startTime: Date.now() - 1800000, // 30 minutes ago
    durationSeconds: 1200, // 20 minutes
    totalVolume: 0, // No weights used
    userRating: 5,
    notes: 'Perfect quick session before work!',
    exercises: [
      {
        id: 'exercise-1',
        exerciseName: 'Burpees',
        exerciseCategory: 'Cardio',
        isSkipped: false,
        totalSets: 4,
        sets: [
          { counts: 10, completed: true, counterType: 'reps' },
          { counts: 8, completed: true, counterType: 'reps' },
          { counts: 6, completed: true, counterType: 'reps' },
          { counts: 4, completed: true, counterType: 'reps' },
        ],
      },
      {
        id: 'exercise-2',
        exerciseName: 'Mountain Climbers',
        exerciseCategory: 'Cardio',
        isSkipped: false,
        totalSets: 3,
        sets: [
          { counts: 30, completed: true, counterType: 'time' },
          { counts: 25, completed: true, counterType: 'time' },
          { counts: 20, completed: true, counterType: 'time' },
        ],
      },
    ],
    onClose: action('onClose'),
  },
};

export const WorkoutWithSkippedExercises: Story = {
  render: DialogWrapper,
  args: {
    sessionName: 'Upper Body Strength',
    trainingPlanName: 'Strength Training',
    startTime: Date.now() - 3600000, // 1 hour ago
    durationSeconds: 2700, // 45 minutes
    totalVolume: 600,
    userRating: 3,
    notes: 'Had to skip some exercises due to equipment being busy.',
    exercises: [
      sampleExercises[1], // Bench press
      sampleExercises[3], // Skipped pull-ups
      {
        id: 'exercise-5',
        exerciseName: 'Dumbbell Rows',
        exerciseCategory: 'Strength',
        isSkipped: false,
        totalSets: 3,
        totalVolume: 240,
        sets: [
          { counts: 12, weight: 25, completed: true, rpe: 7, counterType: 'reps' },
          { counts: 10, weight: 30, completed: true, rpe: 8, counterType: 'reps' },
          { counts: 8, weight: 35, completed: true, rpe: 9, counterType: 'reps' },
        ],
      },
    ],
    onClose: action('onClose'),
  },
};

export const EmptyWorkout: Story = {
  render: DialogWrapper,
  args: {
    sessionName: 'Planned Leg Day',
    trainingPlanName: 'Lower Body Focus',
    startTime: Date.now() - 600000, // 10 minutes ago
    durationSeconds: 300, // 5 minutes
    notes: 'Started the workout but had to leave early.',
    exercises: [],
    onClose: action('onClose'),
  },
};

export const InProgressWorkout: Story = {
  render: DialogWrapper,
  args: {
    sessionName: 'Full Body Workout',
    trainingPlanName: 'General Fitness',
    startTime: Date.now() - 2700000, // 45 minutes ago
    // No durationSeconds for in-progress workout
    totalVolume: 400,
    exercises: [
      sampleExercises[0], // Completed squats
      {
        id: 'exercise-current',
        exerciseName: 'Deadlifts',
        exerciseCategory: 'Strength',
        isSkipped: false,
        totalSets: 2, // Partially completed
        totalVolume: 300,
        sets: [
          { counts: 5, weight: 100, completed: true, rpe: 8, counterType: 'reps' },
          { counts: 3, weight: 120, completed: true, rpe: 9, counterType: 'reps' },
        ],
      },
    ],
    onClose: action('onClose'),
  },
};
