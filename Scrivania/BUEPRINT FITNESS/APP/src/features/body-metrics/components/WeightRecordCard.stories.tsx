import type { Meta, StoryObj } from '@storybook/react';

import { WeightRecordCard } from './WeightRecordCard';

const meta: Meta<typeof WeightRecordCard> = {
  title: 'Features/Body Metrics/WeightRecordCard',
  component: WeightRecordCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the weight record',
    },
    weight: {
      control: { type: 'number', min: 30, max: 200, step: 0.1 },
      description: 'Weight in kilograms',
    },
    date: {
      control: 'date',
      description: 'Date when the weight was recorded',
    },
    notes: {
      control: 'text',
      description: 'Optional notes about the weight measurement',
    },
    trend: {
      control: { type: 'select' },
      options: ['increasing', 'decreasing', 'stable', undefined],
      description: 'Weight trend indicator',
    },
    onViewDetails: {
      action: 'view-details',
      description: 'Callback when user wants to view detailed information',
    },
    onEdit: {
      action: 'edit',
      description: 'Callback when user wants to edit the weight record',
    },
    onDelete: {
      action: 'delete',
      description: 'Callback when user wants to delete the weight record',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WeightRecordCard>;

export const Default: Story = {
  args: {
    id: 'weight-record-1',
    weight: 75.5,
    date: new Date('2024-01-15T07:30:00'),
    notes: 'Morning weigh-in, after workout.',
    trend: 'stable',
    'data-testid': 'weight-record-card-default',
  },
};

export const IncreasingTrend: Story = {
  args: {
    id: 'weight-record-2',
    weight: 78.2,
    date: new Date('2024-01-20T07:15:00'),
    notes: 'Gaining weight as planned during bulk phase.',
    trend: 'increasing',
    'data-testid': 'weight-record-card-increasing',
  },
};

export const DecreasingTrend: Story = {
  args: {
    id: 'weight-record-3',
    weight: 72.8,
    date: new Date('2024-01-25T07:45:00'),
    notes: 'Cut is going well, feeling leaner.',
    trend: 'decreasing',
    'data-testid': 'weight-record-card-decreasing',
  },
};

export const WithoutNotes: Story = {
  args: {
    id: 'weight-record-4',
    weight: 76.0,
    date: new Date('2024-01-18T08:00:00'),
    trend: 'stable',
    'data-testid': 'weight-record-card-without-notes',
  },
};

export const WithoutTrend: Story = {
  args: {
    id: 'weight-record-5',
    weight: 74.3,
    date: new Date('2024-01-22T07:20:00'),
    notes: 'First weigh-in of the week.',
    'data-testid': 'weight-record-card-without-trend',
  },
};

export const HighWeight: Story = {
  args: {
    id: 'weight-record-6',
    weight: 95.7,
    date: new Date('2024-01-16T06:45:00'),
    notes: 'Powerlifter bulk phase - gaining strength and size.',
    trend: 'increasing',
    'data-testid': 'weight-record-card-high-weight',
  },
};

export const LowWeight: Story = {
  args: {
    id: 'weight-record-7',
    weight: 52.3,
    date: new Date('2024-01-19T07:30:00'),
    notes: 'Cutting for competition, maintaining muscle mass.',
    trend: 'decreasing',
    'data-testid': 'weight-record-card-low-weight',
  },
};

export const LongNotes: Story = {
  args: {
    id: 'weight-record-8',
    weight: 79.4,
    date: new Date('2024-01-21T07:10:00'),
    notes:
      'Weighed in after a big cheat meal yesterday. Expected to be higher but seems like my metabolism is adapting well to the increased calorie intake. Will continue monitoring for the next few days to see if this is a trend or just daily variation.',
    trend: 'increasing',
    'data-testid': 'weight-record-card-long-notes',
  },
};

export const RecentRecord: Story = {
  args: {
    id: 'weight-record-9',
    weight: 77.1,
    date: new Date(), // Today's date
    notes: 'Latest measurement.',
    trend: 'stable',
    'data-testid': 'weight-record-card-recent',
  },
};

export const MinimalData: Story = {
  args: {
    id: 'weight-record-10',
    weight: 70.0,
    date: new Date('2024-01-10T07:00:00'),
    'data-testid': 'weight-record-card-minimal',
  },
};
