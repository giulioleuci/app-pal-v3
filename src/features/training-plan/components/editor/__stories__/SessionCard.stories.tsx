import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import type { Session } from '../PlanStructureList';
import { SessionCard } from '../SessionCard';

// Mock session data
const mockSession: Session = {
  id: '1',
  name: 'Upper Body Strength',
  notes: 'Focus on compound movements with heavy weights. Emphasize progressive overload.',
  execution_count: 3,
  is_deload: false,
  day_of_week: 'Monday',
};

const mockDeloadSession: Session = {
  id: '2',
  name: 'Recovery Session',
  notes: 'Light movement and mobility work for active recovery',
  execution_count: 1,
  is_deload: true,
  day_of_week: 'Friday',
};

const mockSessionWithoutNotes: Session = {
  id: '3',
  name: 'Lower Body Power',
  execution_count: 2,
  is_deload: false,
  day_of_week: 'Wednesday',
};

const meta = {
  title: 'Training Plan/Editor/SessionCard',
  component: SessionCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A card component that displays a workout session with controls for reordering, editing, and deleting. Uses the ActionCard component to provide consistent styling and behavior.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    session: {
      description: 'The session data to display',
      control: { type: 'object' },
    },
    isFirst: {
      description: 'Whether this is the first session in the list',
      control: { type: 'boolean' },
    },
    isLast: {
      description: 'Whether this is the last session in the list',
      control: { type: 'boolean' },
    },
    onReorder: {
      description: 'Callback fired when the session should be reordered',
      action: 'reorder',
    },
    onEdit: {
      description: 'Callback fired when the session should be edited',
      action: 'edit',
    },
    onDelete: {
      description: 'Callback fired when the session should be deleted',
      action: 'delete',
    },
  },
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    session: mockSession,
    isFirst: false,
    isLast: false,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};

export const FirstSession: Story = {
  args: {
    session: mockSession,
    isFirst: true,
    isLast: false,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};

export const LastSession: Story = {
  args: {
    session: mockSession,
    isFirst: false,
    isLast: true,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};

export const OnlySession: Story = {
  args: {
    session: mockSession,
    isFirst: true,
    isLast: true,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};

export const DeloadSession: Story = {
  args: {
    session: mockDeloadSession,
    isFirst: false,
    isLast: false,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};

export const WithoutNotes: Story = {
  args: {
    session: mockSessionWithoutNotes,
    isFirst: false,
    isLast: false,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};

export const WithoutDayOfWeek: Story = {
  args: {
    session: {
      ...mockSession,
      day_of_week: undefined,
    },
    isFirst: false,
    isLast: false,
    onReorder: action('reorder'),
    onEdit: action('edit'),
    onDelete: action('delete'),
  },
};
