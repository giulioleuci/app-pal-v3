import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';

import { PaginatedCardList } from '../PaginatedCardList';

// Mock data for stories
interface MockItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

const generateMockItems = (count: number): MockItem[] => {
  const categories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Sports'];
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    name: `Exercise ${index + 1}`,
    description: `This is a detailed description for exercise ${index + 1}. It includes information about form, benefits, and variations.`,
    category: categories[index % categories.length],
  }));
};

const mockItems = generateMockItems(50);

const MockCard = ({ item }: { item: MockItem }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant='h6' component='h3' gutterBottom>
        {item.name}
      </Typography>
      <Typography variant='body2' color='text.secondary' paragraph>
        {item.description}
      </Typography>
      <Typography variant='caption' color='primary'>
        {item.category}
      </Typography>
    </CardContent>
  </Card>
);

const meta: Meta<typeof PaginatedCardList> = {
  title: 'Shared/Components/PaginatedCardList',
  component: PaginatedCardList,
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: false,
      description: 'Array of items to display',
    },
    renderCard: {
      control: false,
      description: 'Function to render each item as a card',
    },
    getSearchableText: {
      control: false,
      description: 'Function to extract searchable text from an item',
    },
    getItemKey: {
      control: false,
      description: 'Function to extract unique key from an item',
    },
    itemsPerPage: {
      control: { type: 'number', min: 1, max: 50 },
      description: 'Number of items per page',
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
A reusable component for displaying paginated lists with search functionality.
Implements URL state management for search terms and pagination state, ensuring
that the component state is synchronized with the browser's URL parameters.

## Features
- Client-side search with debounced input
- Pagination with URL state persistence
- Mobile-first, responsive card layout
- Empty state handling
- Accessible keyboard navigation

## URL State Management
The component automatically manages the following URL parameters:
- \`search\`: Current search term
- \`page\`: Current page number (only when > 1)

## Performance
- Uses debounced search input (300ms delay) for optimal performance
- Responsive grid layout adapts to screen size
- Efficient filtering with useMemo

## Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Focus management
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaginatedCardList>;

export const Default: Story = {
  args: {
    items: mockItems,
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getSearchableText: (item: MockItem) => `${item.name} ${item.description} ${item.category}`,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 12,
    searchPlaceholder: 'Search exercises...',
  },
};

export const WithSearch: Story = {
  args: {
    items: mockItems,
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getSearchableText: (item: MockItem) => `${item.name} ${item.description} ${item.category}`,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 12,
    searchPlaceholder: 'Search by name, description, or category...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with searchable content. Try searching for "strength", "cardio", or specific exercise names.',
      },
    },
  },
};

export const SmallItemsPerPage: Story = {
  args: {
    items: mockItems,
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getSearchableText: (item: MockItem) => `${item.name} ${item.description}`,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 6,
    searchPlaceholder: 'Search exercises...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with fewer items per page (6) to demonstrate pagination with multiple pages.',
      },
    },
  },
};

export const WithEmptyState: Story = {
  args: {
    items: [],
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getSearchableText: (item: MockItem) => `${item.name} ${item.description}`,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 12,
    searchPlaceholder: 'Search exercises...',
    emptyState: {
      title: 'No exercises found',
      description:
        'Get started by creating your first exercise or try adjusting your search terms.',
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
        story: 'Example showing the empty state when no items are available.',
      },
    },
  },
};

export const NoSearch: Story = {
  args: {
    items: mockItems.slice(0, 15),
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 8,
    // No getSearchableText provided, so search is disabled
  },
  parameters: {
    docs: {
      description: {
        story: 'Example without search functionality (getSearchableText not provided).',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    items: [],
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getSearchableText: (item: MockItem) => `${item.name} ${item.description}`,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 12,
    searchPlaceholder: 'Search exercises...',
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state - useful when data is being fetched.',
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    items: generateMockItems(200),
    renderCard: (item: MockItem) => <MockCard item={item} />,
    getSearchableText: (item: MockItem) => `${item.name} ${item.description} ${item.category}`,
    getItemKey: (item: MockItem) => item.id,
    itemsPerPage: 16,
    searchPlaceholder: 'Search through 200 exercises...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with a larger dataset (200 items) to demonstrate performance with many pages.',
      },
    },
  },
};
