import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ExercisesPageDemo } from './ExercisesPageDemo';

// Mock query client for storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof ExercisesPageDemo> = {
  title: 'Pages/ExercisesPage',
  component: ExercisesPageDemo,
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
The ExercisesPage component provides a comprehensive exercise library with enhanced dedicated exercise cards and revolutionary muscle activation visualization.

## Enhanced Features
- **Dedicated Exercise Cards**: Each exercise displayed in its own professional card with comprehensive information
- **Action Buttons**: Each exercise card has dedicated buttons for "View Details" and "Edit Data"
- **Muscle Activation Dialog**: Revolutionary modal with 0-100% sliders showing muscle activation levels for each muscle group
- **Virtualized Rendering**: Uses VirtualizedCardList for efficient handling of large exercise databases
- **CRUD Operations**: Full create, read, update, delete functionality via useExerciseCRUD hook
- **Page-Level Error Handling**: Displays ErrorDisplay component for query failures
- **Global Feedback**: Integrates with snackbar notifications for user actions
- **Contextual Onboarding**: Shows EmptyState component with actionable guidance
- **Advanced Search**: Multi-field search across exercise properties
- **Rich Metadata Display**: Visual representation of equipment, muscle groups, difficulty
- **Mobile-First Design**: Card-based layout optimized for mobile devices
- **Accessibility**: Comprehensive data-testid attributes and semantic markup

## Exercise Card Features
- **Comprehensive Information**: Shows exercise name, description, category, difficulty, and equipment
- **Professional Layout**: Clean card design with color-coded difficulty levels and organized chip displays
- **Muscle Group Visualization**: Primary muscle groups highlighted with color-coded activation chips
- **Action Integration**: Direct access to detailed muscle activation viewing and exercise editing

## Revolutionary Muscle Activation Visualization
- **0-100% Sliders**: Visual sliders showing precise muscle activation percentages for each muscle group
- **Color-Coded Levels**: High (80%+), Moderate (60-79%), Low (30-59%), Minimal (<30%) activation levels
- **Comprehensive Database**: Complete exercise information including technical specifications and substitutions
- **Professional Presentation**: Organized sections with equipment, notes, and metadata display

## Data Sources
- Uses \`useExerciseCRUD\` hook for exercise operations
- Integrates with \`useActiveProfileId\` for profile-specific data
- Follows the Data-First Design Protocol (DFDP)
- Enhanced with ExerciseDetailDialog for comprehensive muscle activation viewing

## Exercise Metadata
- **Equipment**: Visual chips showing required equipment with organized display
- **Muscle Activation**: Detailed activation percentages with visual sliders
- **Difficulty Levels**: Color-coded difficulty indicators (beginner=green, intermediate=orange, advanced=red)
- **Movement Patterns**: Exercise categorization and joint types
- **Substitutions**: Alternative exercise suggestions with comprehensive lists

## Architectural Compliance
- **Page-Level Error Handling Protocol**: Renders ErrorDisplay on query failure
- **Global Feedback Protocol**: Provides user feedback via snackbar notifications
- **Action Consistency Mandate**: FAB and card actions follow established patterns
- **Contextual Onboarding Protocol**: EmptyState guides first-time users
- **Dumb Components**: Uses dedicated ExerciseCard components with props-based data flow

## User Actions
- **Create Exercise**: Primary action via floating action button
- **View Muscle Activation Details**: Dedicated button showing comprehensive database information with visual sliders
- **Edit Exercise Data**: Direct access to exercise editing from each card
- **Search & Filter**: Multi-field search across exercise database
- **Delete Exercises**: Confirmation-based deletion with feedback
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    exercises: {
      control: false,
      description: 'Array of exercise items',
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
type Story = StoryObj<typeof ExercisesPageDemo>;

/**
 * Default state of the ExercisesPage showing enhanced exercise cards with muscle activation details.
 */
export const Default: Story = {
  args: {
    exercises: [
      {
        id: '1',
        name: 'Barbell Back Squat',
        description:
          'A fundamental compound movement targeting the quadriceps, glutes, and core while building overall lower body strength.',
        category: 'strength',
        movementType: 'compound',
        movementPattern: 'squat',
        difficulty: 'intermediate',
        equipment: ['barbell', 'squat rack', 'weight plates'],
        muscleActivation: {
          quadriceps: 0.92,
          glutes: 0.85,
          core: 0.78,
          hamstrings: 0.65,
          calves: 0.45,
          'lower back': 0.58,
        },
        counterType: 'reps',
        jointType: 'multi',
        notes:
          'Focus on maintaining proper depth and knee tracking. Keep chest up throughout the movement.',
        substitutions: ['front squat', 'goblet squat', 'leg press', 'Bulgarian split squats'],
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        updatedAt: Date.now() - 1000 * 60 * 60 * 12,
      },
      {
        id: '2',
        name: 'Bench Press',
        description:
          'Classic upper body compound exercise primarily targeting the chest, shoulders, and triceps.',
        category: 'strength',
        movementType: 'compound',
        movementPattern: 'push',
        difficulty: 'intermediate',
        equipment: ['barbell', 'bench', 'weight plates'],
        muscleActivation: {
          chest: 0.88,
          triceps: 0.75,
          'anterior deltoid': 0.68,
          core: 0.45,
        },
        counterType: 'reps',
        jointType: 'multi',
        notes: 'Maintain tight shoulder blade retraction and controlled descent.',
        substitutions: ['dumbbell press', 'push-ups', 'incline press'],
        createdAt: Date.now() - 1000 * 60 * 60 * 48,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24,
      },
      {
        id: '3',
        name: 'Bicep Curls',
        description: 'Isolation exercise specifically targeting the biceps brachii muscle.',
        category: 'strength',
        movementType: 'isolation',
        difficulty: 'beginner',
        equipment: ['dumbbells'],
        muscleActivation: {
          biceps: 0.95,
          forearms: 0.42,
          'anterior deltoid': 0.28,
        },
        counterType: 'reps',
        jointType: 'single',
        notes: 'Keep elbows stationary and avoid swinging.',
        substitutions: ['hammer curls', 'cable curls', 'resistance band curls'],
        createdAt: Date.now() - 1000 * 60 * 60 * 72,
        updatedAt: Date.now() - 1000 * 60 * 60 * 36,
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
          'Default ExercisesPage showcasing enhanced exercise cards with dedicated action buttons for viewing detailed muscle activation (0-100% sliders) and editing exercise data. Each card displays comprehensive exercise information with color-coded difficulty levels and organized equipment/muscle group displays.',
      },
    },
  },
};

/**
 * Loading state of the ExercisesPage showing skeleton placeholders.
 */
export const Loading: Story = {
  args: {
    exercises: [],
    isLoading: true,
    isError: false,
    isEmpty: false,
  },
};

/**
 * Empty state of the ExercisesPage when no exercises exist.
 */
export const Empty: Story = {
  args: {
    exercises: [],
    isLoading: false,
    isError: false,
    isEmpty: true,
  },
};

/**
 * Error state of the ExercisesPage demonstrating error handling.
 */
export const ErrorState: Story = {
  args: {
    exercises: [],
    isLoading: false,
    isError: true,
    error: new Error('Failed to load exercise library.'),
    isEmpty: false,
  },
};
