import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  display: 'flex',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiButton-root': {
    border: 'none',
    borderRadius: 0,
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightMedium,
    '&:not(:last-child)': {
      borderRight: `1px solid ${theme.palette.divider}`,
    },
    '&.MuiButton-contained': {
      boxShadow: 'none',
      '&:hover': {
        boxShadow: 'none',
      },
    },
  },
}));

const StyledContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export interface SegmentedControlProps<T = string> {
  /**
   * Currently selected value
   */
  value: T;
  /**
   * Callback fired when selection changes
   */
  onChange: (value: T) => void;
  /**
   * Whether the control is disabled
   */
  disabled?: boolean;
  /**
   * Size of the control
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Whether the control should take full width
   */
  fullWidth?: boolean;
  /**
   * Control options
   */
  children: React.ReactNode;
  /**
   * Test identifier for the control
   */
  'data-testid'?: string;
  /**
   * Aria label for accessibility
   */
  'aria-label'?: string;
}

export interface SegmentedControlOptionProps<T = string> {
  /**
   * Value of this option
   */
  value: T;
  /**
   * Label to display
   */
  children: React.ReactNode;
  /**
   * Whether this option is disabled
   */
  disabled?: boolean;
  /**
   * Icon to display (optional)
   */
  icon?: React.ReactNode;
  /**
   * Test identifier for the option
   */
  'data-testid'?: string;
  /**
   * Whether this option is selected (internal use)
   */
  isSelected?: boolean;
  /**
   * Callback for selection (internal use)
   */
  onSelect?: (value: T) => void;
}

/**
 * Option component for SegmentedControl
 */
const SegmentedControlOption = <T,>({
  value,
  children,
  disabled = false,
  icon,
  'data-testid': testId,
  isSelected = false,
  onSelect,
}: SegmentedControlOptionProps<T>) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect?.(value);
    }
  };

  return (
    <Button
      variant={isSelected ? 'contained' : 'outlined'}
      color={isSelected ? 'primary' : 'inherit'}
      disabled={disabled}
      onClick={handleClick}
      startIcon={icon}
      data-testid={testId || `segmented-control-option-${String(value)}`}
    >
      {children}
    </Button>
  );
};

/**
 * A compound component for creating segmented controls (toggle button groups)
 * with consistent styling and behavior. Useful for filters, view modes, and
 * other exclusive selection scenarios.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   value={selectedView}
 *   onChange={setSelectedView}
 *   aria-label="View mode selection"
 * >
 *   <SegmentedControl.Option value="grid" icon={<GridIcon />}>
 *     Grid
 *   </SegmentedControl.Option>
 *   <SegmentedControl.Option value="list" icon={<ListIcon />}>
 *     List
 *   </SegmentedControl.Option>
 *   <SegmentedControl.Option value="card" icon={<CardIcon />}>
 *     Card
 *   </SegmentedControl.Option>
 * </SegmentedControl>
 * ```
 */
export const SegmentedControl = <T,>({
  value,
  onChange,
  disabled = false,
  size = 'medium',
  fullWidth = false,
  children,
  'data-testid': testId = 'segmented-control',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) => {
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === SegmentedControlOption) {
      const optionValue = child.props.value;
      return React.cloneElement(child as React.ReactElement<SegmentedControlOptionProps<T>>, {
        isSelected: value === optionValue,
        onSelect: onChange,
      });
    }
    return child;
  });

  return (
    <StyledContainer data-testid={testId}>
      <StyledButtonGroup
        variant='outlined'
        size={size}
        disabled={disabled}
        fullWidth={fullWidth}
        aria-label={ariaLabel}
        data-testid='segmented-control-group'
      >
        {enhancedChildren}
      </StyledButtonGroup>
    </StyledContainer>
  );
};

// Attach compound components
SegmentedControl.Option = SegmentedControlOption;
