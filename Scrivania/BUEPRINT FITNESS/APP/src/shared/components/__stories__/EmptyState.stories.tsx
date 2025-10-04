import type { Meta, StoryObj } from '@storybook/react';

import { EmptyState } from '../EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    context: {
      control: 'select',
      options: [
        'workouts',
        'exercises',
        'trainingPlans',
        'workoutSessions',
        'progress',
        'profile',
        'notifications',
        'search',
        'generic',
      ],
      description: 'The context for which to show the empty state',
    },
    title: {
      control: 'text',
      description: 'Optional custom title to override the default context-based title',
    },
    message: {
      control: 'text',
      description: 'Optional custom message to override the default context-based message',
    },
    icon: {
      control: 'text',
      description: 'Optional custom icon to override the default context-based icon',
    },
    variant: {
      control: 'select',
      options: ['fullPage', 'inline'],
      description: 'Whether to display as a full-page state or inline',
    },
    action: {
      control: 'object',
      description: 'Optional action to display to the user',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const WorkoutsContext: Story = {
  args: {
    context: 'workouts',
    action: {
      label: 'Create First Workout',
      onClick: () => alert('Create workout clicked!'),
    },
  },
};

export const ExercisesContext: Story = {
  args: {
    context: 'exercises',
    action: {
      label: 'Add Exercise',
      onClick: () => alert('Add exercise clicked!'),
    },
  },
};

export const TrainingPlansContext: Story = {
  args: {
    context: 'trainingPlans',
    action: {
      label: 'Create Training Plan',
      onClick: () => alert('Create plan clicked!'),
      variant: 'contained',
    },
  },
};

export const WorkoutSessionsContext: Story = {
  args: {
    context: 'workoutSessions',
    action: {
      label: 'Start Your First Workout',
      onClick: () => alert('Start workout clicked!'),
    },
  },
};

export const ProgressContext: Story = {
  args: {
    context: 'progress',
    action: {
      label: 'Complete a Workout',
      onClick: () => alert('Complete workout clicked!'),
    },
  },
};

export const SearchContext: Story = {
  args: {
    context: 'search',
  },
};

export const NotificationsContext: Story = {
  args: {
    context: 'notifications',
  },
};

export const CustomContent: Story = {
  args: {
    context: 'generic',
    title: 'Custom Empty State',
    message: 'This is a custom empty state with personalized content.',
    icon: 'Star',
    action: {
      label: 'Take Action',
      onClick: () => alert('Custom action clicked!'),
      variant: 'outlined',
    },
  },
};

export const FullPageVariant: Story = {
  args: {
    context: 'workouts',
    variant: 'fullPage',
    action: {
      label: 'Get Started',
      onClick: () => alert('Get started clicked!'),
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const WithoutAction: Story = {
  args: {
    context: 'profile',
  },
};

export const OutlinedAction: Story = {
  args: {
    context: 'exercises',
    action: {
      label: 'Browse Exercises',
      onClick: () => alert('Browse clicked!'),
      variant: 'outlined',
    },
  },
};

export const TextAction: Story = {
  args: {
    context: 'notifications',
    action: {
      label: 'Settings',
      onClick: () => alert('Settings clicked!'),
      variant: 'text',
    },
  },
};
