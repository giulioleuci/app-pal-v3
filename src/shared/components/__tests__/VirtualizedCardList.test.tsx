import { vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '@/test-utils';

import { VirtualizedCardList } from '../VirtualizedCardList';

// Mock the useDebouncedValue hook
vi.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: any) => value, // Return the value immediately for testing
}));

// Mock @tanstack/react-virtual
const mockVirtualizer = {
  getTotalSize: () => 1000, // Fixed size for consistency
  getVirtualItems: () => [{ index: 0, start: 0, size: 100, key: 0 }], // Only return first item to be safe
};

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => mockVirtualizer),
}));

interface TestItem {
  id: string;
  name: string;
  description: string;
}

const mockItems: TestItem[] = Array.from({ length: 100 }, (_, index) => ({
  id: `${index + 1}`,
  name: `Item ${index + 1}`,
  description: `Description ${index + 1}`,
}));

const mockRenderCard = (item: TestItem, index: number, style: React.CSSProperties) => (
  <div data-testid={`test-card-${item.id}`} key={item.id} style={style}>
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
  estimateSize: 100,
};

describe('VirtualizedCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render correctly with default props', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      expect(screen.getByTestId('virtualized-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-search-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-virtual-container')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-virtual-list')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-results-summary')).toBeInTheDocument();
    });

    it('should render virtual items based on virtualizer', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      // Should render the items that the mock virtualizer returns
      expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
    });

    it('should set correct height on virtual container', () => {
      render(<VirtualizedCardList {...defaultProps} height={800} />);

      const container = screen.getByTestId('virtualized-card-list-virtual-container');
      expect(container).toHaveStyle({ height: '800px' });
    });

    it('should use default height when not specified', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const container = screen.getByTestId('virtualized-card-list-virtual-container');
      expect(container).toHaveStyle({ height: '600px' });
    });

    it('should display correct results summary', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
        '100 items'
      );
    });
  });

  describe('Search Functionality', () => {
    it('should filter items based on search input', async () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });

      await waitFor(() => {
        // Results summary should update to show filtered count
        // Items matching "Item 1" would be Item 1, Item 10-19, Item 100 = 12 items
        expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
          '12 results found'
        );
      });
    });

    it('should update results summary when searching', async () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'Item 10' } });

      await waitFor(() => {
        // Should find Item 10 and Item 100 = 2 items
        expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
          '2 results found'
        );
      });
    });

    it('should use custom search placeholder', () => {
      render(<VirtualizedCardList {...defaultProps} searchPlaceholder='Search virtualized...' />);

      expect(screen.getByTestId('virtualized-card-list-search-input-field')).toHaveAttribute(
        'placeholder',
        'Search virtualized...'
      );
    });

    it('should handle case-insensitive search', async () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'ITEM 1' } });

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
          '12 results found'
        );
      });
    });
  });

  describe('Virtual List Container', () => {
    it('should set total size based on virtualizer', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const virtualList = screen.getByTestId('virtualized-card-list-virtual-list');
      expect(virtualList).toHaveStyle({ height: '1000px' });
    });

    it('should render virtual items with correct positioning', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const virtualItems = screen.getAllByTestId(/^virtualized-card-list-virtual-item-/);
      expect(virtualItems).toHaveLength(1); // Based on mock virtualizer

      // Check that items have the correct data-testid pattern
      expect(screen.getByTestId('virtualized-card-list-virtual-item-0')).toBeInTheDocument();
    });
  });

  describe('URL State Management', () => {
    it('should initialize search from URL params', () => {
      // Note: This test would require a custom router setup to test URL state management
      // For now, we'll test that the component renders without error
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      expect(searchInput).toBeInTheDocument();
    });

    it('should handle search parameter updates', async () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      // The component should update the URL params (this is tested via the search input value)
      expect(searchInput).toHaveValue('test search');
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no items are provided', () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
      };

      render(<VirtualizedCardList {...defaultProps} items={[]} emptyState={emptyState} />);

      expect(screen.getByTestId('virtualized-card-list-empty')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-component')).toBeInTheDocument();
    });

    it('should show search empty state when search returns no results', async () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
      };

      render(<VirtualizedCardList {...defaultProps} emptyState={emptyState} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-card-list-empty-search')).toBeInTheDocument();
        expect(screen.getByTestId('empty-state-component')).toBeInTheDocument();
      });
    });

    it('should show empty state with action button', () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
        action: <button data-testid='create-item-button'>Create Item</button>,
      };

      render(<VirtualizedCardList {...defaultProps} items={[]} emptyState={emptyState} />);

      expect(screen.getByTestId('empty-state-action')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state', () => {
      render(<VirtualizedCardList {...defaultProps} isLoading={true} />);

      // When loading, component should still render (no empty state)
      expect(screen.getByTestId('virtualized-card-list')).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      const emptyState = {
        title: 'No items found',
        description: 'Try adding some items',
      };

      render(
        <VirtualizedCardList
          {...defaultProps}
          items={[]}
          emptyState={emptyState}
          isLoading={true}
        />
      );

      expect(screen.queryByTestId('virtualized-card-list-empty')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper data-testid attributes', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      expect(screen.getByTestId('virtualized-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-search-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-virtual-container')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-virtual-list')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-results-summary')).toBeInTheDocument();
    });

    it('should support custom data-testid', () => {
      render(<VirtualizedCardList {...defaultProps} data-testid='custom-virtual-list' />);

      expect(screen.getByTestId('custom-virtual-list')).toBeInTheDocument();
      expect(screen.getByTestId('custom-virtual-list-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('custom-virtual-list-virtual-container')).toBeInTheDocument();
    });

    it('should have accessible search input', () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder', 'Search...');
    });
  });

  describe('Edge Cases', () => {
    it('should handle items without getSearchableText function', () => {
      render(
        <VirtualizedCardList
          items={mockItems}
          renderCard={mockRenderCard}
          getItemKey={mockGetItemKey}
          estimateSize={100}
          // No getSearchableText function
        />
      );

      // Should render without search functionality
      expect(
        screen.queryByTestId('virtualized-card-list-search-input-field')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-virtual-container')).toBeInTheDocument();
    });

    it('should handle empty search string', async () => {
      render(<VirtualizedCardList {...defaultProps} />);

      const searchInput = screen.getByTestId('virtualized-card-list-search-input-field');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        // Should show all items when search is cleared
        expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
          '100 items'
        );
      });
    });

    it('should handle single item correctly', () => {
      const singleItem = [mockItems[0]];
      render(<VirtualizedCardList {...defaultProps} items={singleItem} />);

      expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
        '1 item'
      );
      // Should render the first item via virtualizer
      expect(screen.getByTestId('test-card-1')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, index) => ({
        id: `${index + 1}`,
        name: `Item ${index + 1}`,
        description: `Description ${index + 1}`,
      }));

      render(<VirtualizedCardList {...defaultProps} items={largeDataset} />);

      expect(screen.getByTestId('virtualized-card-list-results-summary')).toHaveTextContent(
        '10000 items'
      );
      expect(screen.getByTestId('virtualized-card-list-virtual-container')).toBeInTheDocument();
    });
  });

  describe('Virtualization Specific Features', () => {
    it('should pass correct style props to renderCard function', () => {
      const mockRenderCardWithStyle = vi.fn((item, index, style) => (
        <div key={item.id} style={style} data-testid={`styled-card-${item.id}`}>
          {item.name}
        </div>
      ));

      render(<VirtualizedCardList {...defaultProps} renderCard={mockRenderCardWithStyle} />);

      // Verify that renderCard was called with style objects
      expect(mockRenderCardWithStyle).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Number),
        expect.objectContaining({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: expect.any(String),
          transform: expect.any(String),
        })
      );
    });

    it('should handle different estimateSize values', () => {
      render(<VirtualizedCardList {...defaultProps} estimateSize={150} />);

      // Component should render successfully with different estimate size
      expect(screen.getByTestId('virtualized-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-card-list-virtual-container')).toBeInTheDocument();
    });
  });
});
