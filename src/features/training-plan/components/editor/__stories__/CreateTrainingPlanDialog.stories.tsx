import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { CreateTrainingPlanDialog } from '../CreateTrainingPlanDialog';

const meta = {
  title: 'Training Plan/Editor/CreateTrainingPlanDialog',
  component: CreateTrainingPlanDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal dialog for creating a new training plan. Uses react-hook-form with Zod validation and the FormDialog component for consistent styling and behavior.',
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
    onCreatePlan: {
      description: 'Callback fired when a training plan should be created',
      action: 'createPlan',
    },
    isLoading: {
      description: 'Whether the form is in a loading state',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof CreateTrainingPlanDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onClose: action('close'),
    onCreatePlan: action('createPlan'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    open: true,
    onClose: action('close'),
    onCreatePlan: action('createPlan'),
    isLoading: true,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: action('close'),
    onCreatePlan: action('createPlan'),
    isLoading: false,
  },
};
