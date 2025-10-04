import type { Meta, StoryObj } from '@storybook/react';

import { TrainingCycleModel, TrainingPlanModel } from '@/features/training-plan/domain';

import { TrainingPlanCard } from '../TrainingPlanCard';

// Mock data
const mockPlan = TrainingPlanModel.hydrate(
  {
    id: 'plan-1',
    profileId: 'profile-1',
    name: 'Upper/Lower Split',
    description:
      'A 4-day upper/lower body split designed for intermediate lifters focusing on strength and hypertrophy.',
    sessionIds: ['session-1', 'session-2', 'session-3', 'session-4'],
    isArchived: false,
    currentSessionIndex: 0,
    notes: 'Focus on progressive overload',
    cycleId: 'cycle-1',
    order: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  [] // Empty sessions for simplicity
);

const mockArchivedPlan = TrainingPlanModel.hydrate(
  {
    id: 'plan-2',
    profileId: 'profile-1',
    name: 'Push/Pull/Legs',
    description: 'Classic PPL routine for muscle building.',
    sessionIds: ['session-5', 'session-6', 'session-7'],
    isArchived: true,
    currentSessionIndex: 0,
    cycleId: null,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
  },
  []
);

const mockCycle = TrainingCycleModel.hydrate({
  id: 'cycle-1',
  profileId: 'profile-1',
  name: 'Winter Bulk 2024',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
  goal: 'hypertrophy',
  notes: 'Focus on gaining lean mass',
  createdAt: new Date('2023-12-20'),
  updatedAt: new Date('2024-01-01'),
});

const meta: Meta<typeof TrainingPlanCard> = {
  title: 'Features/TrainingPlan/TrainingPlanCard',
  component: TrainingPlanCard,
  tags: ['autodocs'],
  argTypes: {
    plan: {
      control: false,
      description: 'The training plan to display',
    },
    cycle: {
      control: false,
      description: 'The associated training cycle (if any)',
    },
    onStart: {
      control: false,
      description: 'Callback when user wants to start the plan',
    },
    onEdit: {
      control: false,
      description: 'Callback when user wants to edit the plan',
    },
    onArchive: {
      control: false,
      description: 'Callback when user wants to archive the plan',
    },
    onDelete: {
      control: false,
      description: 'Callback when user wants to delete the plan',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the plan is currently being processed',
    },
    'data-testid': {
      control: 'text',
      description: 'Test identifier for the card',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A training plan card component that displays plan information and actions.
Built using the ActionCard pattern for consistency with other app cards.
Displays plan metadata, associated cycle information, and provides
action buttons for starting, editing, archiving, and deleting plans.

## Features
- Displays plan name, description, and session count
- Shows associated training cycle information with status indicators
- Action buttons for all CRUD operations
- Loading state with skeleton
- Archived state indication
- Responsive design following mobile-first principles

## Action Consistency
All action buttons follow the Action Consistency Mandate:
- Start: Primary action (play arrow icon)
- Edit: Secondary action (edit icon)
- Archive: Warning action (archive icon)
- Delete: Destructive action (delete icon, error color)

## Data Formatting
Follows the Data Formatting Mandate for displaying dates, session counts, and cycle information.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrainingPlanCard>;

export const Default: Story = {
  args: {
    plan: mockPlan,
    cycle: mockCycle,
    onStart: (plan) => console.log('Starting plan:', plan.name),
    onEdit: (plan) => console.log('Editing plan:', plan.name),
    onArchive: (plan) => console.log('Archiving plan:', plan.name),
    onDelete: (plan) => console.log('Deleting plan:', plan.name),
  },
};

export const WithoutCycle: Story = {
  args: {
    plan: mockPlan,
    // No cycle provided
    onStart: (plan) => console.log('Starting plan:', plan.name),
    onEdit: (plan) => console.log('Editing plan:', plan.name),
    onArchive: (plan) => console.log('Archiving plan:', plan.name),
    onDelete: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story: 'A training plan card without an associated training cycle.',
      },
    },
  },
};

export const ArchivedPlan: Story = {
  args: {
    plan: mockArchivedPlan,
    onEdit: (plan) => console.log('Editing plan:', plan.name),
    onArchive: (plan) => console.log('Unarchiving plan:', plan.name),
    onDelete: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story:
          'An archived training plan. Note that the start action is not available for archived plans.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    plan: mockPlan,
    cycle: mockCycle,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state showing skeleton placeholders that prevent layout shift.',
      },
    },
  },
};

export const LongDescription: Story = {
  args: {
    plan: TrainingPlanModel.hydrate(
      {
        ...mockPlan.toPlainObject(),
        name: 'Advanced Powerlifting Periodization Program',
        description:
          'This is a comprehensive 16-week powerlifting program designed for advanced athletes preparing for competition. The program focuses on peaking strength in the squat, bench press, and deadlift through carefully planned periodization cycles including accumulation, intensification, and realization phases. Each phase builds upon the previous one to maximize strength gains while managing fatigue and recovery.',
      },
      []
    ),
    cycle: mockCycle,
    onStart: (plan) => console.log('Starting plan:', plan.name),
    onEdit: (plan) => console.log('Editing plan:', plan.name),
    onArchive: (plan) => console.log('Archiving plan:', plan.name),
    onDelete: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story: 'A plan with a longer name and description to test text wrapping and layout.',
      },
    },
  },
};

export const NoActions: Story = {
  args: {
    plan: mockPlan,
    cycle: mockCycle,
    // No callbacks provided, so buttons will be disabled
  },
  parameters: {
    docs: {
      description: {
        story: 'A plan card with no action callbacks provided, resulting in disabled buttons.',
      },
    },
  },
};

export const ActiveCycle: Story = {
  args: {
    plan: mockPlan,
    cycle: TrainingCycleModel.hydrate({
      ...mockCycle.toPlainObject(),
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }),
    onStart: (plan) => console.log('Starting plan:', plan.name),
    onEdit: (plan) => console.log('Editing plan:', plan.name),
    onArchive: (plan) => console.log('Archiving plan:', plan.name),
    onDelete: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story: 'A plan with an active training cycle (currently in progress).',
      },
    },
  },
};

export const InactiveCycle: Story = {
  args: {
    plan: mockPlan,
    cycle: TrainingCycleModel.hydrate({
      ...mockCycle.toPlainObject(),
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days from now
    }),
    onStart: (plan) => console.log('Starting plan:', plan.name),
    onEdit: (plan) => console.log('Editing plan:', plan.name),
    onArchive: (plan) => console.log('Archiving plan:', plan.name),
    onDelete: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story: 'A plan with an inactive training cycle (scheduled for the future).',
      },
    },
  },
};
