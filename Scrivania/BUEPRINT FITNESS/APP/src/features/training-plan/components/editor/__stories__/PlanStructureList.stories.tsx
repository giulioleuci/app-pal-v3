import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import type { Session } from '../PlanStructureList';
import { PlanStructureList } from '../PlanStructureList';

// Mock session data
const mockSessions: Session[] = [
  {
    id: '1',
    name: 'Upper Body Strength',
    notes: 'Focus on compound movements with heavy weights',
    execution_count: 3,
    is_deload: false,
    day_of_week: 'Monday',
  },
  {
    id: '2',
    name: 'Lower Body Power',
    notes: 'Explosive movements and plyometrics',
    execution_count: 2,
    is_deload: false,
    day_of_week: 'Wednesday',
  },
  {
    id: '3',
    name: 'Recovery Session',
    notes: 'Light movement and mobility work',
    execution_count: 1,
    is_deload: true,
    day_of_week: 'Friday',
  },
  {
    id: '4',
    name: 'Full Body Conditioning',
    execution_count: 4,
    is_deload: false,
    day_of_week: 'Saturday',
  },
];

const meta = {
  title: 'Training Plan/Editor/PlanStructureList',
  component: PlanStructureList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A vertical list component that displays workout sessions in a training plan. Each session is rendered as a SessionCard with controls for reordering, editing, and deleting.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sessions: {
      description: 'Array of workout sessions to display',
      control: { type: 'object' },
    },
    onReorderSession: {
      description: 'Callback fired when a session should be reordered',
      action: 'reorderSession',
    },
    onEditSession: {
      description: 'Callback fired when a session should be edited',
      action: 'editSession',
    },
    onDeleteSession: {
      description: 'Callback fired when a session should be deleted',
      action: 'deleteSession',
    },
    onAddSession: {
      description: 'Callback fired when a new session should be added',
      action: 'addSession',
    },
    isLoading: {
      description: 'Whether the list is in a loading state',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof PlanStructureList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sessions: mockSessions,
    onReorderSession: action('reorderSession'),
    onEditSession: action('editSession'),
    onDeleteSession: action('deleteSession'),
    onAddSession: action('addSession'),
    isLoading: false,
  },
};

export const Empty: Story = {
  args: {
    sessions: [],
    onReorderSession: action('reorderSession'),
    onEditSession: action('editSession'),
    onDeleteSession: action('deleteSession'),
    onAddSession: action('addSession'),
    isLoading: false,
  },
};

export const SingleSession: Story = {
  args: {
    sessions: [mockSessions[0]],
    onReorderSession: action('reorderSession'),
    onEditSession: action('editSession'),
    onDeleteSession: action('deleteSession'),
    onAddSession: action('addSession'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    sessions: mockSessions,
    onReorderSession: action('reorderSession'),
    onEditSession: action('editSession'),
    onDeleteSession: action('deleteSession'),
    onAddSession: action('addSession'),
    isLoading: true,
  },
};

export const WithDeloadSessions: Story = {
  args: {
    sessions: [
      mockSessions[0],
      mockSessions[2], // This is the deload session
      mockSessions[1],
    ],
    onReorderSession: action('reorderSession'),
    onEditSession: action('editSession'),
    onDeleteSession: action('deleteSession'),
    onAddSession: action('addSession'),
    isLoading: false,
  },
};
