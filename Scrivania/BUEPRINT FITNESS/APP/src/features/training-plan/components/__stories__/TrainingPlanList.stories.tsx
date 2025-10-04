import type { Meta, StoryObj } from '@storybook/react';

import { TrainingCycleModel, TrainingPlanModel } from '@/features/training-plan/domain';

import { TrainingPlanList } from '../TrainingPlanList';

// Mock data generators
const generateMockPlans = (count: number): TrainingPlanModel[] => {
  const plans = [];
  const planTypes = [
    {
      name: 'Push/Pull/Legs',
      description: 'Classic PPL routine for muscle building with focus on compound movements.',
    },
    {
      name: 'Upper/Lower Split',
      description: 'Efficient 4-day split alternating between upper and lower body training.',
    },
    {
      name: 'Full Body Beginner',
      description: 'Perfect starting program for new lifters focusing on form and consistency.',
    },
    {
      name: 'Powerlifting Prep',
      description: 'Competition preparation program emphasizing squat, bench, and deadlift.',
    },
    {
      name: 'Athletic Performance',
      description: 'Sport-specific training for athletes focusing on power and explosiveness.',
    },
    {
      name: 'Bodyweight Only',
      description: 'Equipment-free routine using only bodyweight exercises.',
    },
  ];

  for (let i = 0; i < count; i++) {
    const planType = planTypes[i % planTypes.length];
    plans.push(
      TrainingPlanModel.hydrate(
        {
          id: `plan-${i + 1}`,
          profileId: 'profile-1',
          name: `${planType.name} ${i + 1}`,
          description: planType.description,
          sessionIds: Array.from({ length: 3 + (i % 4) }, (_, j) => `session-${i}-${j}`),
          isArchived: i % 7 === 0, // Every 7th plan is archived
          currentSessionIndex: 0,
          notes: i % 3 === 0 ? 'Modified for home gym setup' : undefined,
          cycleId: i % 3 === 0 ? `cycle-${Math.floor(i / 3) + 1}` : null,
          order: i % 3 === 0 ? (i % 3) + 1 : undefined,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
        },
        []
      )
    );
  }

  return plans;
};

const generateMockCycles = (count: number): TrainingCycleModel[] => {
  const cycles = [];
  const goals = ['strength', 'hypertrophy', 'endurance', 'weight_loss', 'general'] as const;
  const cycleNames = [
    'Winter Bulk 2024',
    'Summer Cut Phase',
    'Strength Building Block',
    'Endurance Base Building',
    'Competition Prep',
  ];

  for (let i = 0; i < count; i++) {
    const startDate = new Date(Date.now() - (count - i) * 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    cycles.push(
      TrainingCycleModel.hydrate({
        id: `cycle-${i + 1}`,
        profileId: 'profile-1',
        name: cycleNames[i % cycleNames.length],
        startDate,
        endDate,
        goal: goals[i % goals.length],
        notes: `Cycle ${i + 1} focusing on ${goals[i % goals.length]}`,
        createdAt: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(startDate.getTime() - 6 * 24 * 60 * 60 * 1000),
      })
    );
  }

  return cycles;
};

const mockPlans = generateMockPlans(20);
const mockCycles = generateMockCycles(5);

const meta: Meta<typeof TrainingPlanList> = {
  title: 'Features/TrainingPlan/TrainingPlanList',
  component: TrainingPlanList,
  tags: ['autodocs'],
  argTypes: {
    plans: {
      control: false,
      description: 'Array of training plans to display',
    },
    cycles: {
      control: false,
      description: 'Array of training cycles for associating with plans',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the data is currently loading',
    },
    isError: {
      control: 'boolean',
      description: 'Whether there was an error loading the data',
    },
    error: {
      control: false,
      description: 'The error that occurred (if any)',
    },
    onCreatePlan: {
      control: false,
      description: 'Callback when user wants to create a new plan',
    },
    onStartPlan: {
      control: false,
      description: 'Callback when user wants to start a plan',
    },
    onEditPlan: {
      control: false,
      description: 'Callback when user wants to edit a plan',
    },
    onArchivePlan: {
      control: false,
      description: 'Callback when user wants to archive a plan',
    },
    onDeletePlan: {
      control: false,
      description: 'Callback when user wants to delete a plan',
    },
    'data-testid': {
      control: 'text',
      description: 'Test identifier for the component',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A "dumb" component for displaying a list of training plans.
Uses the PaginatedCardList component for consistent pagination and search functionality.
Handles loading states with skeletons and empty states with contextual onboarding.

## Features
- Skeleton loading state that prevents layout shift
- Animated transitions between states using framer-motion
- Search functionality for plan names and descriptions
- Empty state with onboarding guidance
- Responsive card grid layout
- Integration with training cycles for enriched plan information

## Performance
- Uses PaginatedCardList for efficient rendering of large datasets
- Optimized cycle lookup with Map for O(1) access
- Debounced search input for smooth user experience

## State Management
All state is managed by the parent "smart" component and passed down as props,
following the Props Down, Events Up pattern.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrainingPlanList>;

export const Default: Story = {
  args: {
    plans: mockPlans,
    cycles: mockCycles,
    onCreatePlan: () => console.log('Create new plan'),
    onStartPlan: (plan) => console.log('Starting plan:', plan.name),
    onEditPlan: (plan) => console.log('Editing plan:', plan.name),
    onArchivePlan: (plan) => console.log('Archiving plan:', plan.name),
    onDeletePlan: (plan) => console.log('Deleting plan:', plan.name),
  },
};

export const Loading: Story = {
  args: {
    plans: [],
    cycles: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with skeleton cards that prevent layout shift.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    plans: [],
    cycles: [],
    isLoading: false,
    onCreatePlan: () => console.log('Create first plan'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with contextual onboarding to guide users to create their first plan.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    plans: [],
    cycles: [],
    isLoading: false,
    isError: true,
    error: new Error('Failed to load training plans. Please check your connection and try again.'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state showing a user-friendly error message with retry option.',
      },
    },
  },
};

export const WithoutCycles: Story = {
  args: {
    plans: mockPlans.slice(0, 10),
    cycles: [], // No cycles provided
    onCreatePlan: () => console.log('Create new plan'),
    onStartPlan: (plan) => console.log('Starting plan:', plan.name),
    onEditPlan: (plan) => console.log('Editing plan:', plan.name),
    onArchivePlan: (plan) => console.log('Archiving plan:', plan.name),
    onDeletePlan: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Training plans without associated cycles. The cards will not show cycle information.',
      },
    },
  },
};

export const OnlyArchivedPlans: Story = {
  args: {
    plans: generateMockPlans(8).map((plan) => plan.cloneAsArchived()),
    cycles: mockCycles,
    onCreatePlan: () => console.log('Create new plan'),
    onEditPlan: (plan) => console.log('Editing plan:', plan.name),
    onArchivePlan: (plan) => console.log('Unarchiving plan:', plan.name),
    onDeletePlan: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A list showing only archived plans. Note that start actions are not available for archived plans.',
      },
    },
  },
};

export const SinglePlan: Story = {
  args: {
    plans: [mockPlans[0]],
    cycles: [mockCycles[0]],
    onCreatePlan: () => console.log('Create new plan'),
    onStartPlan: (plan) => console.log('Starting plan:', plan.name),
    onEditPlan: (plan) => console.log('Editing plan:', plan.name),
    onArchivePlan: (plan) => console.log('Archiving plan:', plan.name),
    onDeletePlan: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A list with only one training plan, showing how the component handles minimal data.',
      },
    },
  },
};

export const ManyPlans: Story = {
  args: {
    plans: generateMockPlans(50),
    cycles: generateMockCycles(10),
    onCreatePlan: () => console.log('Create new plan'),
    onStartPlan: (plan) => console.log('Starting plan:', plan.name),
    onEditPlan: (plan) => console.log('Editing plan:', plan.name),
    onArchivePlan: (plan) => console.log('Archiving plan:', plan.name),
    onDeletePlan: (plan) => console.log('Deleting plan:', plan.name),
  },
  parameters: {
    docs: {
      description: {
        story: 'A large dataset with 50 plans to demonstrate pagination and search functionality.',
      },
    },
  },
};

export const NoActions: Story = {
  args: {
    plans: mockPlans.slice(0, 6),
    cycles: mockCycles,
    // No action callbacks provided
  },
  parameters: {
    docs: {
      description: {
        story: 'Training plans with no action callbacks, resulting in disabled action buttons.',
      },
    },
  },
};
