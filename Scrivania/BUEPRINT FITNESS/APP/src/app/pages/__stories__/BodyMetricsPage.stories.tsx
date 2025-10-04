import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { BodyMetricsPageDemo } from './BodyMetricsPageDemo';

// Mock query client for storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof BodyMetricsPageDemo> = {
  title: 'Pages/BodyMetricsPage',
  component: BodyMetricsPageDemo,
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
The BodyMetricsPage component provides comprehensive body measurement tracking with tabbed interface and virtualized rendering.

## Enhanced Features
- **Tabbed Interface**: Separate tabs for weight and height measurements with URL state management
- **Weight Tracking**: Dedicated weight record cards with kg/lbs conversion and trend indicators
- **Height Tracking**: Specialized height record cards with cm/feet-inches conversion
- **Trend Analysis**: Visual indicators for weight trends (increasing, decreasing, stable)
- **Virtualized Rendering**: Uses VirtualizedCardList for efficient handling of large measurement databases
- **CRUD Operations**: Full create, read, update, delete functionality via useBodyMetricsTracking hook
- **Page-Level Error Handling**: Displays ErrorDisplay component for query failures
- **Global Feedback**: Integrates with snackbar notifications for user actions
- **Contextual Onboarding**: Shows EmptyState component with actionable guidance per tab
- **URL State Management**: Active tab synchronized with URL search parameters
- **Mobile-First Design**: Card-based layout optimized for mobile devices
- **Accessibility**: Comprehensive data-testid attributes and semantic markup

## Weight Record Features
- **Dual Unit Display**: Shows weight in both kilograms and pounds with automatic conversion
- **Trend Indicators**: Visual arrows and colors showing weight progression (up/down/stable)
- **Progress Context**: Clear indication of measurement trends over time
- **Date Formatting**: Consistent localized date display
- **Notes Support**: Optional contextual information about measurements

## Height Record Features
- **Multi-Unit Display**: Shows height in centimeters with feet/inches conversion
- **Measurement Precision**: Accurate conversion between metric and imperial units
- **Growth Tracking**: Historical height measurements for comprehensive tracking
- **Professional Display**: Clean card layout with height-specific iconography

## Data Sources
- Uses \`useBodyMetricsTracking\` hook for comprehensive body metrics operations
- Integrates with \`useActiveProfileId\` for profile-specific data
- Follows the Data-First Design Protocol (DFDP)
- Enhanced with trend analysis and progress calculations

## Body Metrics Analysis
- **Weight Trends**: Automated trend detection (increasing, decreasing, stable)
- **Unit Conversions**: Seamless switching between metric and imperial units
- **Historical Tracking**: Long-term measurement progression visualization
- **BMI Calculations**: Body mass index calculations when both weight and height available
- **Progress Insights**: Contextual information about measurement changes

## Architectural Compliance
- **Page-Level Error Handling Protocol**: Renders ErrorDisplay on query failure per tab
- **Global Feedback Protocol**: Provides user feedback via snackbar notifications
- **URL State Management Mandate**: Active tab state synchronized with URL parameters
- **Action Consistency Mandate**: FAB and card actions follow established patterns
- **Contextual Onboarding Protocol**: EmptyState guides first-time users per measurement type
- **Dumb Components**: Uses WeightRecordCard and HeightRecordCard components with props-based data flow

## User Actions
- **Switch Measurement Types**: Tab-based navigation between weight and height records
- **Record Measurements**: Primary action via floating action button (context-aware)
- **View Details**: Access comprehensive measurement information
- **Edit Records**: Direct access to measurement editing from each card
- **Search & Filter**: Tab-specific search across measurement database
- **Delete Records**: Confirmation-based deletion with feedback
- **Trend Analysis**: Visual progression indicators and trend information
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    weightHistory: {
      control: false,
      description: 'Array of weight record items',
    },
    heightHistory: {
      control: false,
      description: 'Array of height record items',
    },
    isLoadingWeights: {
      control: 'boolean',
      description: 'Weight loading state',
    },
    isLoadingHeights: {
      control: 'boolean',
      description: 'Height loading state',
    },
    isEmpty: {
      control: 'boolean',
      description: 'Empty state',
    },
    activeTab: {
      control: { type: 'select' },
      options: ['weight', 'height'],
      description: 'Active tab',
    },
    weightTrend: {
      control: { type: 'select' },
      options: ['increasing', 'decreasing', 'stable'],
      description: 'Weight trend indicator',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BodyMetricsPageDemo>;

/**
 * Default state of the BodyMetricsPage showing weight records with trend analysis.
 */
export const Default: Story = {
  args: {
    weightHistory: [
      {
        id: 'weight-1',
        profileId: 'profile-1',
        date: new Date('2024-01-15T07:30:00'),
        weight: 75.5,
        notes: 'Morning weigh-in, after workout.',
        createdAt: new Date('2024-01-15T07:30:00'),
        updatedAt: new Date('2024-01-15T07:30:00'),
      },
      {
        id: 'weight-2',
        profileId: 'profile-1',
        date: new Date('2024-01-20T07:15:00'),
        weight: 78.2,
        notes: 'Gaining weight as planned during bulk phase.',
        createdAt: new Date('2024-01-20T07:15:00'),
        updatedAt: new Date('2024-01-20T07:15:00'),
      },
      {
        id: 'weight-3',
        profileId: 'profile-1',
        date: new Date('2024-01-25T07:45:00'),
        weight: 72.8,
        notes: 'Cut is going well, feeling leaner.',
        createdAt: new Date('2024-01-25T07:45:00'),
        updatedAt: new Date('2024-01-25T07:45:00'),
      },
    ],
    heightHistory: [],
    isLoadingWeights: false,
    isLoadingHeights: false,
    isEmpty: false,
    activeTab: 'weight',
    weightTrend: 'increasing',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default BodyMetricsPage showcasing weight record tracking with trend analysis. Each card displays weight in both kg and lbs with visual trend indicators. Includes comprehensive measurement history with contextual notes.',
      },
    },
  },
};

/**
 * Height tab view of the BodyMetricsPage showing height records.
 */
export const HeightTab: Story = {
  args: {
    weightHistory: [],
    heightHistory: [
      {
        id: 'height-1',
        profileId: 'profile-1',
        date: new Date('2024-01-01T09:00:00'),
        height: 175,
        notes: 'Annual measurement at doctor visit.',
        createdAt: new Date('2024-01-01T09:00:00'),
        updatedAt: new Date('2024-01-01T09:00:00'),
      },
      {
        id: 'height-2',
        profileId: 'profile-1',
        date: new Date('2024-06-15T10:30:00'),
        height: 175.5,
        notes: 'Slight increase, might be measurement error.',
        createdAt: new Date('2024-06-15T10:30:00'),
        updatedAt: new Date('2024-06-15T10:30:00'),
      },
      {
        id: 'height-3',
        profileId: 'profile-1',
        date: new Date('2024-12-01T08:45:00'),
        height: 175.2,
        createdAt: new Date('2024-12-01T08:45:00'),
        updatedAt: new Date('2024-12-01T08:45:00'),
      },
    ],
    isLoadingWeights: false,
    isLoadingHeights: false,
    isEmpty: false,
    activeTab: 'height',
  },
  parameters: {
    docs: {
      description: {
        story:
          'BodyMetricsPage showing height tab with height record tracking. Each card displays height in both centimeters and feet/inches with accurate conversions. Ideal for long-term growth or posture tracking.',
      },
    },
  },
};

/**
 * Loading state of the weight tab showing skeleton placeholders.
 */
export const LoadingWeights: Story = {
  args: {
    weightHistory: [],
    heightHistory: [],
    isLoadingWeights: true,
    isLoadingHeights: false,
    isEmpty: false,
    activeTab: 'weight',
  },
};

/**
 * Loading state of the height tab showing skeleton placeholders.
 */
export const LoadingHeights: Story = {
  args: {
    weightHistory: [],
    heightHistory: [],
    isLoadingWeights: false,
    isLoadingHeights: true,
    isEmpty: false,
    activeTab: 'height',
  },
};

/**
 * Empty state of the weight tab when no weight records exist.
 */
export const EmptyWeights: Story = {
  args: {
    weightHistory: [],
    heightHistory: [],
    isLoadingWeights: false,
    isLoadingHeights: false,
    isEmpty: true,
    activeTab: 'weight',
  },
};

/**
 * Empty state of the height tab when no height records exist.
 */
export const EmptyHeights: Story = {
  args: {
    weightHistory: [],
    heightHistory: [],
    isLoadingWeights: false,
    isLoadingHeights: false,
    isEmpty: true,
    activeTab: 'height',
  },
};

/**
 * Error state of the weight tab demonstrating error handling.
 */
export const WeightErrorState: Story = {
  args: {
    weightHistory: [],
    heightHistory: [],
    isLoadingWeights: false,
    isLoadingHeights: false,
    weightError: new Error('Failed to load weight records. Please check your connection.'),
    isEmpty: false,
    activeTab: 'weight',
  },
};

/**
 * Error state of the height tab demonstrating error handling.
 */
export const HeightErrorState: Story = {
  args: {
    weightHistory: [],
    heightHistory: [],
    isLoadingWeights: false,
    isLoadingHeights: false,
    heightError: new Error('Failed to load height records. Please check your connection.'),
    isEmpty: false,
    activeTab: 'height',
  },
};
