import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { EmptyState } from './EmptyState';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const StyledSearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  width: '100%',
  gap: theme.spacing(2),
}));

const StyledPaginationBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: theme.spacing(2),
}));

export interface PaginatedCardListProps<T> {
  /**
   * Array of items to display
   */
  items: T[];
  /**
   * Function to render each item as a card
   */
  renderCard: (item: T, index: number) => React.ReactNode;
  /**
   * Function to extract searchable text from an item
   */
  getSearchableText?: (item: T) => string;
  /**
   * Function to extract unique key from an item
   */
  getItemKey: (item: T, index: number) => string;
  /**
   * Number of items per page
   */
  itemsPerPage?: number;
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
 * A reusable component for displaying paginated lists with search functionality.
 * Implements URL state management for search terms and pagination state, ensuring
 * that the component state is synchronized with the browser's URL parameters.
 *
 * Features:
 * - Client-side search with debounced input
 * - Pagination with URL state persistence
 * - Mobile-first, responsive card layout
 * - Empty state handling
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <PaginatedCardList
 *   items={exercises}
 *   renderCard={(exercise) => (
 *     <ExerciseCard key={exercise.id} exercise={exercise} />
 *   )}
 *   getSearchableText={(exercise) => `${exercise.name} ${exercise.description}`}
 *   getItemKey={(exercise) => exercise.id}
 *   searchPlaceholder="Search exercises..."
 *   emptyState={{
 *     title: "No exercises found",
 *     description: "Try adjusting your search or create a new exercise.",
 *     action: <Button>Create Exercise</Button>
 *   }}
 * />
 * ```
 */
export function PaginatedCardList<T>({
  items,
  renderCard,
  getSearchableText,
  getItemKey,
  itemsPerPage = 12,
  searchPlaceholder = 'Search...',
  emptyState,
  isLoading = false,
  'data-testid': testId = 'paginated-card-list',
}: PaginatedCardListProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract state from URL parameters
  const searchTerm = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Debounce search term for performance
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm || !getSearchableText) {
      return items;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return items.filter((item) => getSearchableText(item).toLowerCase().includes(searchLower));
  }, [items, debouncedSearchTerm, getSearchableText]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = filteredItems.slice(startIndex, endIndex);

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
      // Reset to first page when searching
      newParams.delete('page');
      return newParams;
    });
  };

  // Update page in URL
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (page > 1) {
        newParams.set('page', page.toString());
      } else {
        newParams.delete('page');
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

      {/* Card Grid */}
      {currentPageItems.length > 0 && (
        <StyledGrid container spacing={2} data-testid={`${testId}-grid`}>
          {currentPageItems.map((item, index) => (
            <Grid
              key={getItemKey(item, startIndex + index)}
              data-testid={`${testId}-grid-item-${startIndex + index}`}
              sx={{
                width: { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' },
                padding: 1,
              }}
            >
              {renderCard(item, startIndex + index)}
            </Grid>
          ))}
        </StyledGrid>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <StyledPaginationBox data-testid={`${testId}-pagination-container`}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color='primary'
            size='large'
            showFirstButton
            showLastButton
            data-testid={`${testId}-pagination`}
          />
        </StyledPaginationBox>
      )}
    </StyledContainer>
  );
}
