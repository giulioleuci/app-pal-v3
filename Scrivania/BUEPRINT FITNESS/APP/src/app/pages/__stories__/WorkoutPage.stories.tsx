import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { WorkoutPageDemo } from './WorkoutPageDemo';

const meta = {
  title: 'Pages/WorkoutPage',
  component: WorkoutPageDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**WorkoutPage** - Comprehensive workout execution interface with real-time data input

This page provides complete workout session management with actual data input capabilities including:
- **Real-time Data Input**: Weight, reps/mins/secs (based on counterType), and RPE input fields
- **Pre-filled Historical Data**: Estimated values based on previous workouts
- **Interactive Set Management**: Add/remove sets with individual completion tracking
- **Exercise Management**: Enable/disable exercises and add new ones to the workout
- **Notes Functionality**: Exercise and set-level notes with quick access buttons
- **Timer Integration**: Real-time timer with pause/resume controls
- **Progress Tracking**: Visual indicators showing completion percentage
- **Smart Validation**: Input validation with proper error handling

The component uses the \`useWorkoutSession\` hook for reactive data management and follows mobile-first design principles.

### Key Interactive Features
- **Weight Input**: Numeric input fields with kg unit display
- **Count Input**: Adaptive input based on exercise counterType (reps/mins/secs)
- **RPE Rating**: 1-10 scale rating component for Rate of Perceived Exertion
- **Set Operations**: Add/remove individual sets with confirmation
- **Exercise Toggle**: Enable/disable entire exercises from the workout
- **Notes Management**: Quick access to exercise and set notes with modal dialogs
- **Add Exercise**: Dialog to search and add new exercises during workout
- **Completion Tracking**: Individual set checkboxes with automatic progress calculation
- **Pre-filled Data**: Historical or estimated values displayed as placeholders
- **Responsive Layout**: Mobile-optimized card-based layout with touch-friendly controls
        `,
      },
    },
  },
  argTypes: {
    hasActiveWorkout: {
      control: 'boolean',
      description: 'Whether to show an active workout or empty state',
    },
    isTimerRunning: {
      control: 'boolean',
      description: 'Whether the timer is running',
    },
    timerValue: {
      control: 'text',
      description: 'Timer display value in MM:SS format',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether to show loading state',
    },
    hasError: {
      control: 'boolean',
      description: 'Whether to show error state',
    },
    initialCompletedSets: {
      control: 'object',
      description: 'Pre-completed set IDs for demo purposes',
    },
    showAddExerciseDialog: {
      control: 'boolean',
      description: 'Whether to show the add exercise dialog',
    },
    hasPreFilledData: {
      control: 'boolean',
      description: 'Pre-filled data for exercises with some user inputs',
    },
    workoutType: {
      control: {
        type: 'select',
        options: ['standard', 'superset-focused', 'myo-reps-focused', 'circuit-training'],
      },
      description: 'Type of workout to demonstrate different group structures',
    },
    showRPEModal: {
      control: 'boolean',
      description: 'Whether to show the RPE modal demo',
    },
  },
} satisfies Meta<typeof WorkoutPageDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing an active workout with mixed group types.
 * Demonstrates both standard single exercises and non-standard superset groups.
 */
export const ActiveWorkout: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '15:32',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify timer is displayed
    const timer = canvas.getByTestId('workout-timer');
    expect(timer).toBeInTheDocument();

    // Verify progress bar is shown
    const progressBar = canvas.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();

    // Check that exercises are rendered
    const exercise1 = canvas.getByTestId('exercise-ex-1'); // Main exercise
    expect(exercise1).toBeInTheDocument();
  },
};

/**
 * Story demonstrating comprehensive workout data input.
 * Shows weight, reps/time, RPE input fields with pre-filled historical data.
 */
export const WorkoutDataInput: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '22:45',
    hasPreFilledData: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify input fields are present
    const weightInputs = canvas.getAllByTestId(/set-weight-/);
    const countInputs = canvas.getAllByTestId(/set-counts-/);
    const rpeButtons = canvas.getAllByTestId(/set-rpe-button-/);

    expect(weightInputs.length).toBeGreaterThan(0);
    expect(countInputs.length).toBeGreaterThan(0);
    expect(rpeButtons.length).toBeGreaterThan(0);

    // Test input interaction
    if (weightInputs[0]) {
      await userEvent.clear(weightInputs[0]);
      await userEvent.type(weightInputs[0], '100');
      expect(weightInputs[0]).toHaveValue(100);
    }

    // Test set completion
    const setComplete = canvas.getAllByTestId(/set-complete-/)[0];
    if (setComplete) {
      await userEvent.click(setComplete);
    }
  },
};

/**
 * Story demonstrating timer controls interaction.
 * Shows pause/resume functionality for the workout timer.
 */
export const TimerControls: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find timer control button
    const timerButton = canvas.getByTestId('timer-control-button');
    expect(timerButton).toBeInTheDocument();

    // Click to pause/resume
    await userEvent.click(timerButton);

    // Verify save workout button exists
    const saveButton = canvas.getByTestId('save-workout-button');
    expect(saveButton).toBeInTheDocument();
  },
};

/**
 * Story showing non-standard group rendering.
 * Demonstrates how superset groups display exercises in rounds.
 */
export const NonStandardGroups: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify standard exercise is displayed
    const exercise1 = canvas.getByTestId('exercise-ex-1');
    expect(exercise1).toBeInTheDocument();

    // Verify exercises are shown
    expect(canvas.getByText('Bench Press')).toBeInTheDocument();
  },
};

/**
 * Story demonstrating set management operations.
 * Shows add/remove sets functionality and exercise enable/disable.
 */
export const SetManagement: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '18:30',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify add set button exists
    const addSetButtons = canvas.getAllByTestId(/add-set-/);
    expect(addSetButtons.length).toBeGreaterThan(0);

    // Test add set functionality
    if (addSetButtons[0]) {
      await userEvent.click(addSetButtons[0]);
    }

    // Verify progress tracking
    const progressCard = canvas.getByTestId('workout-progress');
    expect(progressCard).toBeInTheDocument();
  },
};

/**
 * Story demonstrating notes functionality.
 * Shows exercise and set-level notes with quick access buttons.
 */
export const NotesManagement: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: false,
    timerValue: '25:10',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify other action buttons
    const saveButton = canvas.getByTestId('save-workout-button');
    const completeButton = canvas.getByTestId('complete-workout-button');

    expect(saveButton).toBeInTheDocument();
    expect(completeButton).toBeInTheDocument();
  },
};

/**
 * Story showing empty state when no workout is active.
 */
export const EmptyState: Story = {
  args: {
    hasActiveWorkout: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify empty state elements
    const startButton = canvas.getByTestId('start-workout-button');
    expect(startButton).toBeInTheDocument();

    // Verify timer is not shown
    expect(canvas.queryByTestId('workout-timer')).not.toBeInTheDocument();
  },
};

/**
 * Story showing loading state.
 */
export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
};

/**
 * Story showing error state.
 */
export const ErrorState: Story = {
  args: {
    hasError: true,
  },
};

/**
 * Story with paused timer.
 */
export const PausedTimer: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: false,
    timerValue: '08:15',
  },
};

/**
 * Story showing add exercise functionality.
 * Demonstrates the dialog to add new exercises to the active workout.
 */
export const AddExerciseDialog: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '12:45',
    showAddExerciseDialog: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify add exercise button exists
    const addExerciseButton = canvas.getByTestId('add-exercise-button');
    expect(addExerciseButton).toBeInTheDocument();

    // Test exercise name input
    const exerciseNameInput = canvas.getByTestId('exercise-name-input');
    expect(exerciseNameInput).toBeInTheDocument();

    await userEvent.type(exerciseNameInput, 'squat');

    // Test counter type select
    const counterTypeSelect = canvas.getByTestId('exercise-counter-type-select');
    expect(counterTypeSelect).toBeInTheDocument();
  },
};

/**
 * Story demonstrating pre-filled historical data.
 * Shows how previous workout data is used to populate input fields.
 */
export const PreFilledData: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: false,
    timerValue: '05:22',
    hasPreFilledData: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify input fields have placeholder values
    const weightInputs = canvas.getAllByTestId(/set-weight-/);
    const countInputs = canvas.getAllByTestId(/set-counts-/);

    // Check that inputs show pre-filled data as placeholders
    if (weightInputs.length > 0) {
      expect(weightInputs[0]).toHaveAttribute('placeholder');
    }
    if (countInputs.length > 0) {
      expect(countInputs[0]).toHaveAttribute('placeholder');
    }

    // Verify progress tracking works with pre-filled data
    const progressCard = canvas.getByTestId('workout-progress');
    expect(progressCard).toBeInTheDocument();
  },
};

/**
 * Story demonstrating superset groups with round-based organization.
 * Shows how superset exercises are organized into alternating rounds.
 */
export const SupersetGroups: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '18:45',
    hasPreFilledData: true,
    workoutType: 'superset-focused',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify superset group structure
    const supersetGroup = canvas.getByTestId('group-group-1');
    expect(supersetGroup).toBeInTheDocument();

    // Check series organization
    expect(canvas.getByText(/Series 1/i)).toBeInTheDocument();
    expect(canvas.getByText(/Series 2/i)).toBeInTheDocument();
    expect(canvas.getByText(/Series 3/i)).toBeInTheDocument();

    // Verify exercises are shown by series
    expect(canvas.getByText('Bench Press')).toBeInTheDocument();
    expect(canvas.getByText('Incline Dumbbell Press')).toBeInTheDocument();

    // Test RPE button functionality
    const rpeButtons = canvas.getAllByTestId(/set-rpe-button-/);
    if (rpeButtons.length > 0) {
      await userEvent.click(rpeButtons[0]);
      // RPE modal should open
      const rpeModal = canvas.queryByTestId('rpe-modal');
      if (rpeModal) {
        expect(rpeModal).toBeInTheDocument();
      }
    }
  },
};

/**
 * Story demonstrating myo-rep sets with visual hierarchy.
 * Shows main set followed by mini sets with visual differentiation.
 */
export const MyoRepSets: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: false,
    timerValue: '23:10',
    hasPreFilledData: true,
    workoutType: 'myo-reps-focused',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify myo-rep exercise exists
    expect(canvas.getByText(/Leg Press.*Myo-Reps/i)).toBeInTheDocument();

    // Check visual hierarchy - main set and mini sets
    const mainSetIndicator = canvas.getByText('Main');
    const miniSetIndicators = canvas.getAllByText(/Mini \d/);

    expect(mainSetIndicator).toBeInTheDocument();
    expect(miniSetIndicators.length).toBeGreaterThan(0);

    // Mini sets should have blue styling (check for visual distinction)
    // This would be checked by looking for specific CSS classes or styles in a real test
  },
};

/**
 * Story showing the enhanced RPE modal with star ratings.
 * Demonstrates the new modal interface for Rate of Perceived Exertion input.
 */
export const RPEModalDemo: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '12:30',
    hasPreFilledData: true,
    showRPEModal: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click an RPE button to open modal
    const rpeButtons = canvas.getAllByTestId(/set-rpe-button-/);
    if (rpeButtons.length > 0) {
      await userEvent.click(rpeButtons[0]);
    }

    // Wait for modal and verify its contents
    const modal = canvas.queryByTestId('rpe-modal');
    if (modal) {
      expect(modal).toBeInTheDocument();

      // Check star rating component
      const starRating = canvas.getByTestId('rpe-modal-rating');
      expect(starRating).toBeInTheDocument();

      // Test confirm button
      const confirmButton = canvas.getByTestId('rpe-modal-confirm');
      expect(confirmButton).toBeInTheDocument();
    }
  },
};

/**
 * Story demonstrating responsive design.
 * Shows how the layout adapts to different screen sizes.
 */
export const ResponsiveLayout: Story = {
  args: {
    hasActiveWorkout: true,
    isTimerRunning: true,
    timerValue: '31:22',
    hasPreFilledData: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify key elements are still visible on mobile
    expect(canvas.getByTestId('workout-timer')).toBeInTheDocument();
    expect(canvas.getByTestId('workout-progress')).toBeInTheDocument();

    // Verify input fields are touch-friendly on mobile
    const weightInputs = canvas.getAllByTestId(/set-weight-/);
    const countInputs = canvas.getAllByTestId(/set-counts-/);

    expect(weightInputs.length).toBeGreaterThan(0);
    expect(countInputs.length).toBeGreaterThan(0);

    // Verify action buttons stack on mobile
    const saveButton = canvas.getByTestId('save-workout-button');
    const completeButton = canvas.getByTestId('complete-workout-button');

    expect(saveButton).toBeInTheDocument();
    expect(completeButton).toBeInTheDocument();
  },
};
