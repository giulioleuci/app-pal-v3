import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: theme.transitions.create(['elevation', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    elevation: 4,
    transform: 'translateY(-2px)',
  },
}));

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
});

export interface ActionCardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Test identifier for the card
   */
  'data-testid'?: string;
}

export interface ActionCardHeaderProps {
  /**
   * Header content
   */
  children: React.ReactNode;
  /**
   * Optional action element for the header
   */
  action?: React.ReactNode;
  /**
   * Test identifier for the header
   */
  'data-testid'?: string;
}

export interface ActionCardContentProps {
  /**
   * Content to display
   */
  children: React.ReactNode;
  /**
   * Test identifier for the content
   */
  'data-testid'?: string;
}

export interface ActionCardActionsProps {
  /**
   * Action elements (buttons, etc.)
   */
  children: React.ReactNode;
  /**
   * Test identifier for the actions
   */
  'data-testid'?: string;
}

/**
 * Header component for ActionCard
 */
const ActionCardHeader = ({ children, action, 'data-testid': testId }: ActionCardHeaderProps) => (
  <CardHeader title={children} action={action} data-testid={testId || 'action-card-header'} />
);

/**
 * Content component for ActionCard
 */
const ActionCardContent = ({ children, 'data-testid': testId }: ActionCardContentProps) => (
  <StyledCardContent data-testid={testId || 'action-card-content'}>{children}</StyledCardContent>
);

/**
 * Actions component for ActionCard
 */
const ActionCardActions = ({ children, 'data-testid': testId }: ActionCardActionsProps) => (
  <CardActions data-testid={testId || 'action-card-actions'}>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{children}</Box>
  </CardActions>
);

/**
 * A compound component that provides a standardized card layout with header, content, and actions.
 * Implements the standard card pattern used throughout the application with hover effects
 * and flexible composition through compound components.
 *
 * @example
 * ```tsx
 * <ActionCard>
 *   <ActionCard.Header action={<IconButton />}>
 *     Card Title
 *   </ActionCard.Header>
 *   <ActionCard.Content>
 *     <Typography>Card content goes here</Typography>
 *   </ActionCard.Content>
 *   <ActionCard.Actions>
 *     <Button>Action 1</Button>
 *     <Button>Action 2</Button>
 *   </ActionCard.Actions>
 * </ActionCard>
 * ```
 */
export const ActionCard = ({
  children,
  className,
  'data-testid': testId = 'action-card',
}: ActionCardProps) => {
  return (
    <StyledCard className={className} data-testid={testId}>
      {children}
    </StyledCard>
  );
};

// Attach compound components
ActionCard.Header = ActionCardHeader;
ActionCard.Content = ActionCardContent;
ActionCard.Actions = ActionCardActions;
