import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

const StyledList = styled(List)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: 0,
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const StyledSecondaryActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export interface InteractiveListProps {
  /**
   * List items
   */
  children: React.ReactNode;
  /**
   * Whether the list should be dense
   */
  dense?: boolean;
  /**
   * Test identifier for the list
   */
  'data-testid'?: string;
}

export interface InteractiveListItemProps {
  /**
   * Unique identifier for the item
   */
  id: string;
  /**
   * Primary text to display
   */
  primary: string;
  /**
   * Secondary text to display (optional)
   */
  secondary?: string;
  /**
   * Avatar to display (optional)
   */
  avatar?: React.ReactNode;
  /**
   * Whether the item is selected
   */
  selected?: boolean;
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  /**
   * Callback fired when the item is clicked
   */
  onClick?: () => void;
  /**
   * Secondary actions for the item
   */
  children?: React.ReactNode;
  /**
   * Test identifier for the item
   */
  'data-testid'?: string;
}

export interface InteractiveListSecondaryActionsProps {
  /**
   * Action buttons/icons
   */
  children: React.ReactNode;
  /**
   * Test identifier for the secondary actions
   */
  'data-testid'?: string;
}

/**
 * Secondary actions component for list items
 */
const InteractiveListSecondaryActions = ({
  children,
  'data-testid': testId,
}: InteractiveListSecondaryActionsProps) => (
  <ListItemSecondaryAction>
    <StyledSecondaryActions data-testid={testId || 'interactive-list-secondary-actions'}>
      {children}
    </StyledSecondaryActions>
  </ListItemSecondaryAction>
);

/**
 * List item component
 */
const InteractiveListItem = ({
  id,
  primary,
  secondary,
  avatar,
  selected = false,
  disabled = false,
  onClick,
  children,
  'data-testid': testId,
}: InteractiveListItemProps) => {
  const handleClick = () => {
    if (!disabled) {
      onClick?.();
    }
  };

  return (
    <StyledListItem data-testid={testId || `interactive-list-item-${id}`}>
      <StyledListItemButton
        selected={selected}
        disabled={disabled}
        onClick={handleClick}
        data-testid={`interactive-list-item-button-${id}`}
      >
        {avatar && (
          <ListItemAvatar>
            {React.isValidElement(avatar) ? (
              avatar
            ) : (
              <Avatar data-testid={`interactive-list-item-avatar-${id}`}>{avatar}</Avatar>
            )}
          </ListItemAvatar>
        )}

        <ListItemText
          primary={
            <Typography variant='body1' component='div'>
              {primary}
            </Typography>
          }
          secondary={
            secondary ? (
              <Typography variant='body2' color='text.secondary'>
                {secondary}
              </Typography>
            ) : undefined
          }
          data-testid={`interactive-list-item-text-${id}`}
        />
      </StyledListItemButton>

      {children}
    </StyledListItem>
  );
};

/**
 * A compound component for creating interactive lists with consistent styling
 * and behavior. Supports avatars, secondary text, selection states, and
 * secondary actions.
 *
 * @example
 * ```tsx
 * <InteractiveList>
 *   <InteractiveList.Item
 *     id="item1"
 *     primary="John Doe"
 *     secondary="Software Engineer"
 *     avatar="JD"
 *     selected={selectedId === 'item1'}
 *     onClick={() => setSelectedId('item1')}
 *   >
 *     <InteractiveList.SecondaryActions>
 *       <IconButton>
 *         <EditIcon />
 *       </IconButton>
 *       <IconButton>
 *         <DeleteIcon />
 *       </IconButton>
 *     </InteractiveList.SecondaryActions>
 *   </InteractiveList.Item>
 *
 *   <InteractiveList.Item
 *     id="item2"
 *     primary="Jane Smith"
 *     secondary="Product Manager"
 *     avatar={<Avatar src="/jane.jpg" />}
 *     onClick={() => setSelectedId('item2')}
 *   />
 * </InteractiveList>
 * ```
 */
export const InteractiveList = ({
  children,
  dense = false,
  'data-testid': testId = 'interactive-list',
}: InteractiveListProps) => {
  return (
    <StyledList dense={dense} data-testid={testId}>
      {children}
    </StyledList>
  );
};

// Attach compound components
InteractiveList.Item = InteractiveListItem;
InteractiveList.SecondaryActions = InteractiveListSecondaryActions;
