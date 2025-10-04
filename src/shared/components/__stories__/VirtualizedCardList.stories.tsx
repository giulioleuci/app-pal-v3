import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';

import { VirtualizedCardList } from '../VirtualizedCardList';

// Mock data for stories
interface MockItem {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const generateMockItems = (count: number): MockItem[] => {
  const categories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Sports', 'Rehabilitation'];
  const difficulties: MockItem['difficulty'][] = ['Beginner', 'Intermediate', 'Advanced'];

  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    name: `Exercise ${index + 1}`,
    description: `This is a detailed description for exercise ${index + 1}. It includes comprehensive information about proper form, target muscles, benefits, common mistakes to avoid, and suggested variations for different fitness levels.`,
    category: categories[index % categories.length],
    difficulty: difficulties[index % difficulties.length],
  }));
};

const MockCard = ({ item, style }: { item: MockItem; style: React.CSSProperties }) => (
  <div style={{ ...style, padding: '8px' }}>
    <Card sx={{ height: 'calc(100% - 16px)', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant='h6' component='h3' gutterBottom>
          {item.name}
        </Typography>
        <Typography variant='body2' color='text.secondary' paragraph>
          {item.description}
        </Typography>
        <Typography variant='caption' color='primary' sx={{ mr: 2 }}>
          {item.category}
        </Typography>
        <Typography variant='caption' color='secondary'>
          {item.difficulty}
        </Typography>
      </CardContent>
    </Card>
  </div>
);

const meta: Meta<typeof VirtualizedCardList> = {
  title: 'Shared/Components/VirtualizedCardList',
  component: VirtualizedCardList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '800px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    items: {
      control: false,
      description: 'Array of items to display',
    },
    renderCard: {
      control: false,
      description:
        'Function to render each item as a card with required style prop for virtualization',
    },
    getSearchableText: {
      control: false,
      description: 'Function to extract searchable text from an item',
    },
    getItemKey: {
      control: false,
      description: 'Function to extract unique key from an item',
    },
    estimateSize: {
      control: { type: 'number', min: 50, max: 500 },
      description: 'Estimated height of each item in pixels for virtualization',
    },
    height: {
      control: { type: 'number', min: 200, max: 1000 },
      description: 'Height of the virtualized container',
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text for search input',
    },
    emptyState: {
      control: false,
      description: 'Empty state configuration',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
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
A high-performance virtualized list component for displaying large datasets efficiently.
Uses @tanstack/react-virtual for optimized rendering of only visible items, making it
suitable for lists with thousands of items while maintaining smooth scrolling performance.

## Features
- Virtual scrolling for optimal performance with large datasets
- Client-side search with debounced input
- URL state management for search terms
- Mobile-first, responsive design
- Empty state handling
- Accessible keyboard navigation

## Performance Benefits
- Only renders visible items in the viewport
- Smooth scrolling even with thousands of items
- Minimal memory footprint
- Optimized for mobile devices

## When to Use
- Lists with 100+ items
- Data-heavy applications
- Mobile-first applications requiring smooth performance
- When pagination is not desirable

## URL State Management
The component automatically manages the following URL parameters:
- \`search\`: Current search term

Note: Unlike PaginatedCardList, this component doesn't need page management
since all filtered items are virtually rendered.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualizedCardList>;

export const Default: Story = {
  args: {
    items: generateMockItems(1000),
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <MockCard item={item} style={style} />
    ),
    getSearchableText: (item: MockItem) =>
      `${item.name} ${item.description} ${item.category} ${item.difficulty}`,
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 200,
    height: 600,
    searchPlaceholder: 'Search through 1000 exercises...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default virtualized list with 1000 items. Notice the smooth scrolling performance.',
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    items: generateMockItems(5000),
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <MockCard item={item} style={style} />
    ),
    getSearchableText: (item: MockItem) =>
      `${item.name} ${item.description} ${item.category} ${item.difficulty}`,
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 200,
    height: 700,
    searchPlaceholder: 'Search through 5000 exercises...',
  },
  parameters: {
    docs: {
      description: {
        story:
          "Large dataset with 5000 items demonstrating the component's ability to handle massive lists efficiently.",
      },
    },
  },
};

export const CompactItems: Story = {
  args: {
    items: generateMockItems(2000),
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <div style={{ ...style, padding: '4px' }}>
        <Card sx={{ height: 'calc(100% - 8px)', p: 2 }}>
          <Typography variant='h6' gutterBottom>
            {item.name}
          </Typography>
          <Typography variant='body2' color='text.secondary' noWrap>
            {item.description}
          </Typography>
          <Typography variant='caption' color='primary'>
            {item.category} • {item.difficulty}
          </Typography>
        </Card>
      </div>
    ),
    getSearchableText: (item: MockItem) => `${item.name} ${item.description} ${item.category}`,
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 120,
    height: 600,
    searchPlaceholder: 'Search compact exercises...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact item layout with smaller estimated size (120px) for denser lists.',
      },
    },
  },
};

export const WithSearch: Story = {
  args: {
    items: generateMockItems(1500),
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <MockCard item={item} style={style} />
    ),
    getSearchableText: (item: MockItem) =>
      `${item.name} ${item.description} ${item.category} ${item.difficulty}`,
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 200,
    height: 600,
    searchPlaceholder: 'Try searching for "strength", "cardio", "beginner", etc...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates search functionality. Try searching for categories like "strength" or "cardio", or difficulty levels like "beginner".',
      },
    },
  },
};

export const TallContainer: Story = {
  args: {
    items: generateMockItems(3000),
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <MockCard item={item} style={style} />
    ),
    getSearchableText: (item: MockItem) => `${item.name} ${item.description} ${item.category}`,
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 200,
    height: 800,
    searchPlaceholder: 'Search exercises...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Taller container (800px) with 3000 items to demonstrate full-height usage.',
      },
    },
  },
};

export const WithEmptyState: Story = {
  args: {
    items: [],
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <MockCard item={item} style={style} />
    ),
    getSearchableText: (item: MockItem) => `${item.name} ${item.description}`,
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 200,
    height: 600,
    searchPlaceholder: 'Search exercises...',
    emptyState: {
      title: 'No exercises found',
      description:
        'Get started by creating your first exercise or import from our exercise library.',
      action: (
        <Button variant='contained' startIcon={<AddIcon />}>
          Create Exercise
        </Button>
      ),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no items are available.',
      },
    },
  },
};

export const NoSearch: Story = {
  args: {
    items: generateMockItems(800),
    renderCard: (item: MockItem, _index: number, style: React.CSSProperties) => (
      <MockCard item={item} style={style} />
    ),
    getItemKey: (item: MockItem) => item.id,
    estimateSize: 200,
    height: 600,
    // No getSearchableText provided, so search is disabled
  },
  parameters: {
    docs: {
      description: {
        story: 'Virtualized list without search functionality (getSearchableText not provided).',
      },
    },
  },
};
