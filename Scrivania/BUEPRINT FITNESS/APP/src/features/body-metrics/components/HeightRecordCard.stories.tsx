import type { Meta, StoryObj } from '@storybook/react';

import { HeightRecordCard } from './HeightRecordCard';

const meta: Meta<typeof HeightRecordCard> = {
  title: 'Features/Body Metrics/HeightRecordCard',
  component: HeightRecordCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the height record',
    },
    height: {
      control: { type: 'number', min: 100, max: 250, step: 0.1 },
      description: 'Height in centimeters',
    },
    date: {
      control: 'date',
      description: 'Date when the height was recorded',
    },
    notes: {
      control: 'text',
      description: 'Optional notes about the height measurement',
    },
    onViewDetails: {
      action: 'view-details',
      description: 'Callback when user wants to view detailed information',
    },
    onEdit: {
      action: 'edit',
      description: 'Callback when user wants to edit the height record',
    },
    onDelete: {
      action: 'delete',
      description: 'Callback when user wants to delete the height record',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeightRecordCard>;

export const Default: Story = {
  args: {
    id: 'height-record-1',
    height: 175.0,
    date: new Date('2024-01-15T09:00:00'),
    notes: 'Annual measurement at doctor visit.',
    'data-testid': 'height-record-card-default',
  },
};

export const WithoutNotes: Story = {
  args: {
    id: 'height-record-2',
    height: 180.5,
    date: new Date('2024-01-20T08:30:00'),
    'data-testid': 'height-record-card-without-notes',
  },
};

export const TallHeight: Story = {
  args: {
    id: 'height-record-3',
    height: 195.2,
    date: new Date('2024-01-10T10:15:00'),
    notes: 'Basketball player height measurement.',
    'data-testid': 'height-record-card-tall',
  },
};

export const ShortHeight: Story = {
  args: {
    id: 'height-record-4',
    height: 150.8,
    date: new Date('2024-01-18T14:30:00'),
    notes: 'Regular check-up measurement.',
    'data-testid': 'height-record-card-short',
  },
};

export const LongNotes: Story = {
  args: {
    id: 'height-record-5',
    height: 172.5,
    date: new Date('2024-01-22T11:45:00'),
    notes:
      'Measured at the gym using their height measurement station. The measurement was taken multiple times to ensure accuracy. Seems like I might have grown a bit or the previous measurements were not as accurate.',
    'data-testid': 'height-record-card-long-notes',
  },
};

export const RecentRecord: Story = {
  args: {
    id: 'height-record-6',
    height: 168.3,
    date: new Date(), // Today's date
    notes: 'Latest measurement.',
    'data-testid': 'height-record-card-recent',
  },
};

export const PreciseHeight: Story = {
  args: {
    id: 'height-record-7',
    height: 177.8,
    date: new Date('2024-01-25T16:20:00'),
    notes: 'Very precise measurement using medical equipment.',
    'data-testid': 'height-record-card-precise',
  },
};

export const MinimalData: Story = {
  args: {
    id: 'height-record-8',
    height: 170.0,
    date: new Date('2024-01-12T12:00:00'),
    'data-testid': 'height-record-card-minimal',
  },
};
