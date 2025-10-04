import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { HistoryPageDemo } from './HistoryPageDemo';

// Mock query client for storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof HistoryPageDemo> = {
  title: 'Pages/HistoryPage',
  component: HistoryPageDemo,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div style={{ height: '100vh', overflow: 'auto' }}>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
The HistoryPage component provides a comprehensive view of workout history with enhanced dedicated workout cards and action buttons.

## Enhanced Features
- **Dedicated Workout Cards**: Each workout displayed in its own professional card with comprehensive information
- **Action Buttons**: Each workout card has dedicated buttons for "View Exercises" and "Edit Workout"
- **Workout Detail Dialog**: Modal showing complete exercise and set data for each workout
- **Infinite Scrolling**: Efficiently loads workout history data in pages
- **Virtualized Rendering**: Uses VirtualizedCardList for optimal performance with large datasets
- **Page-Level Error Handling**: Displays ErrorDisplay component for query failures
- **Global Feedback**: Integrates with snackbar notifications for user actions
- **Contextual Onboarding**: Shows EmptyState component with actionable guidance
- **Search & Filter**: Built-in search functionality across workout fields
- **Mobile-First Design**: Card-based layout optimized for mobile devices
- **Accessibility**: Comprehensive data-testid attributes and semantic markup

## Workout Card Features
- **Comprehensive Information**: Shows workout name, plan, date, time, duration, volume, rating, and notes
- **Professional Layout**: Clean card design with hover effects and structured information display
- **Action Integration**: Direct access to workout details and editing functionality
- **Performance Metrics**: Visual display of workout statistics and user ratings

## Data Sources
- Uses \`useInfiniteWorkoutHistory\` hook for paginated workout data
- Integrates with \`useActiveProfileId\` for profile-specific data
- Follows the Data-First Design Protocol (DFDP)
- Enhanced with WorkoutDetailDialog for comprehensive exercise viewing

## Architectural Compliance
- **Page-Level Error Handling Protocol**: Renders ErrorDisplay on query failure
- **Global Feedback Protocol**: Provides user feedback via snackbar notifications
- **Action Consistency Mandate**: FAB and card actions follow established patterns
- **Contextual Onboarding Protocol**: EmptyState guides first-time users
- **Dumb Components**: Uses dedicated WorkoutCard components with props-based data flow

## User Actions
- **Start New Workout**: Primary action via floating action button
- **View Exercise Details**: Dedicated button on each card showing complete workout breakdown
- **Edit Workout**: Direct access to workout editing from each card
- **Search History**: Filter workouts by name, plan, or notes
        `,
      },
    },
    layout: 'fullscreen',
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
  },
  argTypes: {
    workouts: {
      control: false,
      description: 'Array of workout history items',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    isError: {
      control: 'boolean',
      description: 'Error state',
    },
    isEmpty: {
      control: 'boolean',
      description: 'Empty state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HistoryPageDemo>;

/**
 * Default state of the HistoryPage showing enhanced workout cards with action buttons.
 */
export const Default: Story = {
  args: {
    workouts: [
      {
        id: '1',
        trainingPlanName: 'Push Pull Legs',
        sessionName: 'Push Day - Chest & Triceps',
        startTime: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        endTime: Date.now() - 1000 * 60 * 60 * 23,
        durationSeconds: 3600, // 1 hour
        totalVolume: 2500,
        userRating: 4,
        notes: 'Great session! Hit personal record on bench press.',
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24,
      },
      {
        id: '2',
        trainingPlanName: 'Push Pull Legs',
        sessionName: 'Pull Day - Back & Biceps',
        startTime: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
        endTime: Date.now() - 1000 * 60 * 60 * 47,
        durationSeconds: 3300, // 55 minutes
        totalVolume: 2200,
        userRating: 5,
        notes: 'Felt very strong today, excellent form throughout.',
        createdAt: Date.now() - 1000 * 60 * 60 * 48,
        updatedAt: Date.now() - 1000 * 60 * 60 * 48,
      },
      {
        id: '3',
        trainingPlanName: 'Push Pull Legs',
        sessionName: 'Leg Day - Quads & Glutes',
        startTime: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
        endTime: Date.now() - 1000 * 60 * 60 * 71,
        durationSeconds: 4200, // 70 minutes
        totalVolume: 3200,
        userRating: 3,
        notes: 'Challenging session, legs felt tired but pushed through.',
        createdAt: Date.now() - 1000 * 60 * 60 * 72,
        updatedAt: Date.now() - 1000 * 60 * 60 * 72,
      },
    ],
    isLoading: false,
    isError: false,
    isEmpty: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default HistoryPage showcasing enhanced workout cards with dedicated action buttons for viewing exercise details and editing workouts. Each card displays comprehensive workout information including ratings, notes, and performance metrics.',
      },
    },
  },
};

/**
 * Loading state of the HistoryPage showing skeleton placeholders.
 */
export const Loading: Story = {
  args: {
    workouts: [],
    isLoading: true,
    isError: false,
    isEmpty: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'HistoryPage in loading state with skeleton placeholders.',
      },
    },
  },
};

/**
 * Empty state of the HistoryPage when no workout history exists.
 */
export const Empty: Story = {
  args: {
    workouts: [],
    isLoading: false,
    isError: false,
    isEmpty: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'HistoryPage empty state when no workout history exists, showing contextual onboarding.',
      },
    },
  },
};

/**
 * Error state of the HistoryPage demonstrating error handling.
 */
export const ErrorState: Story = {
  args: {
    workouts: [],
    isLoading: false,
    isError: true,
    error: new Error('Failed to load workout history. Please check your connection and try again.'),
    isEmpty: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'HistoryPage error state showing ErrorDisplay component with retry option.',
      },
    },
  },
};

/**
 * HistoryPage with large dataset demonstrating virtualization performance.
 */
export const LargeDataset: Story = {
  args: {
    workouts: Array.from({ length: 50 }, (_, index) => ({
      id: `workout-${index + 1}`,
      trainingPlanName: `Training Plan ${Math.floor(index / 5) + 1}`,
      sessionName: `Session ${(index % 5) + 1}`,
      startTime: Date.now() - 1000 * 60 * 60 * 24 * index,
      endTime: Date.now() - 1000 * 60 * 60 * 24 * index + 1000 * 60 * 60,
      durationSeconds: 3000 + Math.random() * 1800, // 50-80 minutes
      totalVolume: 2000 + Math.random() * 1500, // 2000-3500kg
      userRating: Math.floor(Math.random() * 5) + 1,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * index,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * index,
    })),
    isLoading: false,
    isError: false,
    isEmpty: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'HistoryPage with large workout history dataset demonstrating virtualization performance.',
      },
    },
  },
};

/**
 * Mobile view of the HistoryPage optimized for small screens.
 */
export const Mobile: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    docs: {
      description: {
        story: 'HistoryPage optimized for mobile devices with card-based layout.',
      },
    },
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};
