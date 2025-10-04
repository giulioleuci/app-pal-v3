import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MaxLogPageDemo } from './MaxLogPageDemo';

// Mock query client for storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof MaxLogPageDemo> = {
  title: 'Pages/MaxLogPage',
  component: MaxLogPageDemo,
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
The MaxLogPage component provides comprehensive personal record tracking with high-performance virtualized rendering.

## Enhanced Features
- **Max Log Cards**: Each max log displayed in dedicated cards showing weight, reps, and estimated 1RM
- **Personal Record Tracking**: Calculates and displays 1-Rep Max estimates using proven formulas (Brzycki, Baechle)
- **Direct 1RM Detection**: Visual indicators for actual 1RM attempts (1 rep lifts)
- **Virtualized Rendering**: Uses VirtualizedCardList for efficient handling of large max log databases
- **CRUD Operations**: Full create, read, update, delete functionality via useMaxLogTracking hook
- **Page-Level Error Handling**: Displays ErrorDisplay component for query failures
- **Global Feedback**: Integrates with snackbar notifications for user actions
- **Contextual Onboarding**: Shows EmptyState component with actionable guidance
- **Advanced Search**: Multi-field search across exercise names and notes
- **Mobile-First Design**: Card-based layout optimized for mobile devices
- **Accessibility**: Comprehensive data-testid attributes and semantic markup

## Max Log Card Features
- **Comprehensive Metrics**: Shows lift weight, repetitions, and calculated estimated 1RM
- **Exercise Information**: Displays exercise name with fallback for unknown exercises
- **Date Formatting**: Localized date display with consistent formatting
- **Performance Context**: Indicates whether lift was direct 1RM or calculated estimate
- **Action Integration**: Menu-driven access to view details, edit, and delete operations
- **Visual Hierarchy**: Clear typography and color coding for primary metrics

## 1-Rep Max Calculations
- **Multiple Formulas**: Uses Brzycki and Baechle formulas for accurate estimates
- **Direct 1RM Recognition**: Special handling and display for single-rep attempts
- **Performance Comparison**: Contextual information about lift performance
- **Progress Tracking**: Historical data visualization for strength progression

## Data Sources
- Uses \`useMaxLogTracking\` hook for max log operations and personal record calculations
- Integrates with \`useActiveProfileId\` for profile-specific data
- Follows the Data-First Design Protocol (DFDP)
- Enhanced with exercise name resolution for display purposes

## Max Log Metadata
- **Exercise Context**: Exercise name display with fallback handling
- **Performance Metrics**: Weight lifted, repetitions performed, estimated 1RM
- **Temporal Information**: Date recorded with consistent formatting
- **User Notes**: Optional contextual information about the lift
- **Calculation Method**: Clear indication of direct vs. calculated values

## Architectural Compliance
- **Page-Level Error Handling Protocol**: Renders ErrorDisplay on query failure
- **Global Feedback Protocol**: Provides user feedback via snackbar notifications
- **Action Consistency Mandate**: FAB and card actions follow established patterns
- **Contextual Onboarding Protocol**: EmptyState guides first-time users
- **Dumb Components**: Uses MaxLogCard components with props-based data flow

## User Actions
- **Record Max Lift**: Primary action via floating action button
- **View Details**: Access comprehensive max log information
- **Edit Max Log**: Direct access to max log editing from each card
- **Search & Filter**: Multi-field search across max log database
- **Delete Max Logs**: Confirmation-based deletion with feedback
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    maxLogs: {
      control: false,
      description: 'Array of max log items',
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
type Story = StoryObj<typeof MaxLogPageDemo>;

/**
 * Default state of the MaxLogPage showing max log records with personal record tracking.
 */
export const Default: Story = {
  args: {
    maxLogs: [
      {
        id: 'max-log-1',
        profileId: 'profile-1',
        exerciseId: 'exercise-bench-press',
        exerciseName: 'Bench Press',
        weightEnteredByUser: 100,
        date: new Date('2024-01-15T10:30:00'),
        reps: 5,
        estimated1RM: 112.5,
        notes: 'Felt strong today, good form throughout.',
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-15T10:30:00'),
      },
      {
        id: 'max-log-2',
        profileId: 'profile-1',
        exerciseId: 'exercise-squat',
        exerciseName: 'Back Squat',
        weightEnteredByUser: 140,
        date: new Date('2024-01-20T14:15:00'),
        reps: 1,
        estimated1RM: 140,
        notes: 'New personal record! Perfect depth.',
        createdAt: new Date('2024-01-20T14:15:00'),
        updatedAt: new Date('2024-01-20T14:15:00'),
      },
      {
        id: 'max-log-3',
        profileId: 'profile-1',
        exerciseId: 'exercise-deadlift',
        exerciseName: 'Conventional Deadlift',
        weightEnteredByUser: 80,
        date: new Date('2024-01-10T16:45:00'),
        reps: 12,
        estimated1RM: 115.2,
        notes: 'Volume day - focused on technique and endurance.',
        createdAt: new Date('2024-01-10T16:45:00'),
        updatedAt: new Date('2024-01-10T16:45:00'),
      },
      {
        id: 'max-log-4',
        profileId: 'profile-1',
        exerciseId: 'exercise-overhead-press',
        exerciseName: 'Overhead Press',
        weightEnteredByUser: 60,
        date: new Date('2024-01-12T09:20:00'),
        reps: 8,
        estimated1RM: 74.4,
        createdAt: new Date('2024-01-12T09:20:00'),
        updatedAt: new Date('2024-01-12T09:20:00'),
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
          'Default MaxLogPage showcasing max log records with comprehensive personal record tracking. Each card displays lift metrics, estimated 1RM calculations, and provides access to detailed actions. Includes both direct 1RM attempts and calculated estimates from multiple-rep sets.',
      },
    },
  },
};

/**
 * Loading state of the MaxLogPage showing skeleton placeholders.
 */
export const Loading: Story = {
  args: {
    maxLogs: [],
    isLoading: true,
    isError: false,
    isEmpty: false,
  },
};

/**
 * Empty state of the MaxLogPage when no max logs exist.
 */
export const Empty: Story = {
  args: {
    maxLogs: [],
    isLoading: false,
    isError: false,
    isEmpty: true,
  },
};

/**
 * Error state of the MaxLogPage demonstrating error handling.
 */
export const ErrorState: Story = {
  args: {
    maxLogs: [],
    isLoading: false,
    isError: true,
    error: new Error('Failed to load max logs. Please check your connection.'),
    isEmpty: false,
  },
};
