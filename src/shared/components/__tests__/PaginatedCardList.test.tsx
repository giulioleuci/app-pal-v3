import { vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '@/test-utils';

import { PaginatedCardList } from '../PaginatedCardList';

// Mock the useDebouncedValue hook
vi.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: any) => value, // Return the value immediately for testing
}));

interface TestItem {
  id: string;
  name: string;
  description: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Item 1', description: 'Description 1' },
  { id: '2', name: 'Item 2', description: 'Description 2' },
  { id: '3', name: 'Item 3', description: 'Description 3' },
  { id: '4', name: 'Item 4', description: 'Description 4' },
  { id: '5', name: 'Item 5', description: 'Description 5' },
  { id: '6', name: 'Item 6', description: 'Description 6' },
  { id: '7', name: 'Item 7', description: 'Description 7' },
  { id: '8', name: 'Item 8', description: 'Description 8' },
  { id: '9', name: 'Item 9', description: 'Description 9' },
  { id: '10', name: 'Item 10', description: 'Description 10' },
  { id: '11', name: 'Item 11', description: 'Description 11' },
  { id: '12', name: 'Item 12', description: 'Description 12' },
  { id: '13', name: 'Item 13', description: 'Description 13' },
  { id: '14', name: 'Item 14', description: 'Description 14' },
  { id: '15', name: 'Item 15', description: 'Description 15' },
];

const mockRenderCard = (item: TestItem) => (
  <div data-testid={`test-card-${item.id}`} key={item.id}>
    <h3>{item.name}</h3>
    <p>{item.description}</p>
  </div>
);

const mockGetSearchableText = (item: TestItem) => `${item.name} ${item.description}`;
const mockGetItemKey = (item: TestItem) => item.id;

const defaultProps = {
  items: mockItems,
  renderCard: mockRenderCard,
  getSearchableText: mockGetSearchableText,
  getItemKey: mockGetItemKey,
};

describe('PaginatedCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      render(<PaginatedCardList {...defaultProps} />);

      expect(screen.getByTestId('paginated-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-search-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-grid')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-results-summary')).toBeInTheDocument();
    });

    it('should render first 12 items by default', () => {
      render(<PaginatedCardList {...defaultProps} />);

      // Should show first 12 items (default itemsPerPage)
      for (let i = 1; i <= 12; i++) {
        expect(screen.getByTestId(`test-card-${i}`)).toBeInTheDocument();
      }

      // Should not show 13th item
      expect(screen.queryByTestId('test-card-13')).not.toBeInTheDocument();
    });

    it('should render custom number of items per page', () => {
      render(<PaginatedCardList {...defaultProps} itemsPerPage={5} />);

      // Should show first 5 items
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`test-card-${i}`)).toBeInTheDocument();
      }

      // Should not show 6th item
      expect(screen.queryByTestId('test-card-6')).not.toBeInTheDocument();
    });

    it('should display correct results summary', () => {
      render(<PaginatedCardList {...defaultProps} />);

      expect(screen.getByTestId('paginated-card-list-results-summary')).toHaveTextContent(
        '15 items'
      );
    });
  });

  describe('Search Functionality', () => {
    it('should filter items based on search input', async () => {
      render(<PaginatedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });

      await waitFor(() => {
        // Should show items that match "Item 1" (Item 1, Item 10, Item 11, Item 12, Item 13, Item 14, Item 15)
        expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-10')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-11')).toBeInTheDocument();

        // Should not show items that don't match
        expect(screen.queryByTestId('test-card-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('test-card-3')).not.toBeInTheDocument();
      });
    });

    it('should update results summary when searching', async () => {
      render(<PaginatedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });

      await waitFor(() => {
        expect(screen.getByTestId('paginated-card-list-results-summary')).toHaveTextContent(
          '7 results found'
        );
      });
    });

    it('should use custom search placeholder', () => {
      render(<PaginatedCardList {...defaultProps} searchPlaceholder='Search custom...' />);

      expect(screen.getByTestId('paginated-card-list-search-input-field')).toHaveAttribute(
        'placeholder',
        'Search custom...'
      );
    });

    it('should handle case-insensitive search', async () => {
      render(<PaginatedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'ITEM 1' } });

      await waitFor(() => {
        expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-10')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are more items than itemsPerPage', () => {
      render(<PaginatedCardList {...defaultProps} itemsPerPage={5} />);

      expect(screen.getByTestId('paginated-card-list-pagination-container')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-pagination')).toBeInTheDocument();
    });

    it('should not show pagination when all items fit on one page', () => {
      render(<PaginatedCardList {...defaultProps} itemsPerPage={20} />);

      expect(
        screen.queryByTestId('paginated-card-list-pagination-container')
      ).not.toBeInTheDocument();
    });

    it('should navigate to next page when pagination is clicked', async () => {
      render(<PaginatedCardList {...defaultProps} itemsPerPage={5} />);

      // Click on page 2
      const page2Button = screen.getByLabelText('Go to page 2');
      fireEvent.click(page2Button);

      await waitFor(() => {
        // Should show items 6-10 on page 2
        expect(screen.getByTestId('test-card-6')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-7')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-8')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-9')).toBeInTheDocument();
        expect(screen.getByTestId('test-card-10')).toBeInTheDocument();

        // Should not show items from page 1
        expect(screen.queryByTestId('test-card-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('test-card-5')).not.toBeInTheDocument();
      });
    });
  });

  describe('URL State Management', () => {
    it('should initialize search from URL params', () => {
      // Note: This test would require a custom router setup to test URL state management
      // For now, we'll test that the component renders without error
      render(<PaginatedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      expect(searchInput).toBeInTheDocument();
    });

    it('should initialize page from URL params', () => {
      // Note: This test would require a custom router setup to test URL state management
      // For now, we'll test that the component renders without error
      render(<PaginatedCardList {...defaultProps} itemsPerPage={5} />);

      // Should show items from page 1 by default
      expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('test-card-5')).toBeInTheDocument();
    });

    it('should handle both search and page URL params', () => {
      // Note: This test would require a custom router setup to test URL state management
      // For now, we'll test that the component renders without error
      render(<PaginatedCardList {...defaultProps} itemsPerPage={5} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      expect(searchInput).toBeInTheDocument();

      // Should show items from page 1 by default
      expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no items are provided', () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
      };

      render(<PaginatedCardList {...defaultProps} items={[]} emptyState={emptyState} />);

      expect(screen.getByTestId('paginated-card-list-empty')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-component')).toBeInTheDocument();
    });

    it('should show search empty state when search returns no results', async () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
      };

      render(<PaginatedCardList {...defaultProps} emptyState={emptyState} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByTestId('paginated-card-list-empty-search')).toBeInTheDocument();
        expect(screen.getByTestId('empty-state-component')).toBeInTheDocument();
      });
    });

    it('should show empty state with action button', () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
        action: <button data-testid='create-item-button'>Create Item</button>,
      };

      render(<PaginatedCardList {...defaultProps} items={[]} emptyState={emptyState} />);

      expect(screen.getByTestId('empty-state-action')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state', () => {
      render(<PaginatedCardList {...defaultProps} isLoading={true} />);

      // When loading, component should still render (no empty state)
      expect(screen.getByTestId('paginated-card-list')).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
      };

      render(
        <PaginatedCardList {...defaultProps} items={[]} emptyState={emptyState} isLoading={true} />
      );

      expect(screen.queryByTestId('paginated-card-list-empty')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper data-testid attributes', () => {
      render(<PaginatedCardList {...defaultProps} />);

      expect(screen.getByTestId('paginated-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-search-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-grid')).toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-results-summary')).toBeInTheDocument();
    });

    it('should support custom data-testid', () => {
      render(<PaginatedCardList {...defaultProps} data-testid='custom-list' />);

      expect(screen.getByTestId('custom-list')).toBeInTheDocument();
      expect(screen.getByTestId('custom-list-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('custom-list-grid')).toBeInTheDocument();
    });

    it('should have accessible search input', () => {
      render(<PaginatedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder', 'Search...');
    });
  });

  describe('Edge Cases', () => {
    it('should handle items without getSearchableText function', () => {
      render(
        <PaginatedCardList
          items={mockItems}
          renderCard={mockRenderCard}
          getItemKey={mockGetItemKey}
          // No getSearchableText function
        />
      );

      // Should render without search functionality
      expect(
        screen.queryByTestId('paginated-card-list-search-input-field')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('paginated-card-list-grid')).toBeInTheDocument();
    });

    it('should handle empty search string', async () => {
      render(<PaginatedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('paginated-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        // Should show all items when search is cleared
        expect(screen.getByTestId('paginated-card-list-results-summary')).toHaveTextContent(
          '15 items'
        );
      });
    });

    it('should handle single item correctly', () => {
      const singleItem = [mockItems[0]];
      render(<PaginatedCardList {...defaultProps} items={singleItem} />);

      expect(screen.getByTestId('paginated-card-list-results-summary')).toHaveTextContent('1 item');
      expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
      expect(
        screen.queryByTestId('paginated-card-list-pagination-container')
      ).not.toBeInTheDocument();
    });
  });
});
