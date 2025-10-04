import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { EmptyState } from './EmptyState';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  height: '100%',
}));

const StyledSearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
  flexShrink: 0,
}));

const StyledVirtualContainer = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
});

const StyledVirtualList = styled(Box)({
  position: 'relative',
  width: '100%',
});

const StyledVirtualItem = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  padding: theme.spacing(1),
  boxSizing: 'border-box',
}));

export interface VirtualizedCardListProps<T> {
  /**
   * Array of items to display
   */
  items: T[];
  /**
   * Function to render each item as a card with required style prop for virtualization
   */
  renderCard: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /**
   * Function to extract searchable text from an item
   */
  getSearchableText?: (item: T) => string;
  /**
   * Function to extract unique key from an item
   */
  getItemKey: (item: T, index: number) => string;
  /**
   * Estimated height of each item in pixels for virtualization
   */
  estimateSize: number;
  /**
   * Height of the virtualized container (default: 600px)
   */
  height?: number;
  /**
   * Placeholder text for search input
   */
  searchPlaceholder?: string;
  /**
   * Empty state configuration
   */
  emptyState?: {
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Test identifier for the component
   */
  'data-testid'?: string;
}

/**
 * A high-performance virtualized list component for displaying large datasets efficiently.
 * Uses @tanstack/react-virtual for optimized rendering of only visible items, making it
 * suitable for lists with thousands of items while maintaining smooth scrolling performance.
 *
 * Features:
 * - Virtual scrolling for optimal performance with large datasets
 * - Client-side search with debounced input
 * - URL state management for search terms
 * - Mobile-first, responsive design
 * - Empty state handling
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <VirtualizedCardList
 *   items={largeDataset}
 *   renderCard={(item, index, style) => (
 *     <div style={style}>
 *       <ExerciseCard key={item.id} exercise={item} />
 *     </div>
 *   )}
 *   getSearchableText={(item) => `${item.name} ${item.description}`}
 *   getItemKey={(item) => item.id}
 *   estimateSize={200}
 *   height={800}
 *   searchPlaceholder="Search exercises..."
 *   emptyState={{
 *     title: "No exercises found",
 *     description: "Try adjusting your search or create a new exercise."
 *   }}
 * />
 * ```
 */
export function VirtualizedCardList<T>({
  items,
  renderCard,
  getSearchableText,
  getItemKey,
  estimateSize,
  height = 600,
  searchPlaceholder = 'Search...',
  emptyState,
  isLoading = false,
  'data-testid': testId = 'virtualized-card-list',
}: VirtualizedCardListProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const parentRef = useRef<HTMLDivElement>(null);

  // Extract search state from URL parameters
  const searchTerm = searchParams.get('search') || '';

  // Debounce search term for performance
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    // Ensure items is an array to prevent undefined/null errors
    const safeItems = items || [];

    if (!debouncedSearchTerm || !getSearchableText) {
      return safeItems;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return safeItems.filter((item) => getSearchableText(item).toLowerCase().includes(searchLower));
  }, [items, debouncedSearchTerm, getSearchableText]);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  // Update search term in URL
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (newSearchTerm) {
        newParams.set('search', newSearchTerm);
      } else {
        newParams.delete('search');
      }
      return newParams;
    });
  };

  // Show empty state if no items match the search
  if (!isLoading && filteredItems.length === 0) {
    if (debouncedSearchTerm && emptyState) {
      return (
        <StyledContainer data-testid={`${testId}-empty-search`}>
          <StyledSearchBox>
            {getSearchableText && (
              <TextField
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                variant='outlined'
                fullWidth
                data-testid={`${testId}-search-input`}
                inputProps={{
                  'data-testid': `${testId}-search-input-field`,
                }}
              />
            )}
          </StyledSearchBox>
          <EmptyState
            title={`No results for "${debouncedSearchTerm}"`}
            description='Try adjusting your search terms or browse all items.'
            data-testid={`${testId}-search-empty-state`}
          />
        </StyledContainer>
      );
    } else if (emptyState) {
      return (
        <StyledContainer data-testid={`${testId}-empty`}>
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
            data-testid={`${testId}-empty-state`}
          />
        </StyledContainer>
      );
    }
  }

  return (
    <StyledContainer data-testid={testId}>
      {/* Search Controls */}
      <StyledSearchBox>
        {getSearchableText && (
          <TextField
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            variant='outlined'
            fullWidth
            data-testid={`${testId}-search-input`}
            inputProps={{
              'data-testid': `${testId}-search-input-field`,
            }}
          />
        )}

        {/* Results Summary */}
        {filteredItems.length > 0 && (
          <Typography
            variant='body2'
            color='text.secondary'
            data-testid={`${testId}-results-summary`}
          >
            {debouncedSearchTerm
              ? `${filteredItems.length} result${filteredItems.length === 1 ? '' : 's'} found`
              : `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`}
          </Typography>
        )}
      </StyledSearchBox>

      {/* Virtualized List */}
      {filteredItems.length > 0 && (
        <StyledVirtualContainer
          ref={parentRef}
          sx={{ height: `${height}px` }}
          data-testid={`${testId}-virtual-container`}
        >
          <StyledVirtualList
            sx={{
              height: `${virtualizer.getTotalSize()}px`,
            }}
            data-testid={`${testId}-virtual-list`}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = filteredItems[virtualItem.index];
              const style: React.CSSProperties = {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              };

              return (
                <StyledVirtualItem
                  key={getItemKey(item, virtualItem.index)}
                  style={style}
                  data-testid={`${testId}-virtual-item-${virtualItem.index}`}
                >
                  {renderCard(item, virtualItem.index, style)}
                </StyledVirtualItem>
              );
            })}
          </StyledVirtualList>
        </StyledVirtualContainer>
      )}
    </StyledContainer>
  );
}
