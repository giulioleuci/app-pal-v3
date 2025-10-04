import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';

import { ActionCard } from '../ActionCard';

const meta: Meta<typeof ActionCard> = {
  title: 'Shared/Components/ActionCard',
  component: ActionCard,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description:
        'Card content composed using ActionCard.Header, ActionCard.Content, and ActionCard.Actions',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
    'data-testid': {
      control: 'text',
      description: 'Test identifier for the card',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A compound component that provides a standardized card layout with header, content, and actions.
Implements the standard card pattern used throughout the application with hover effects
and flexible composition through compound components.

## Compound Components
- **ActionCard.Header**: Card header with optional action element
- **ActionCard.Content**: Main content area that grows to fill available space
- **ActionCard.Actions**: Footer area for action buttons

## Features
- Hover effects with elevation and transform
- Consistent styling across the application
- Flexible composition through compound components
- Accessible markup and semantic structure
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActionCard>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <ActionCard {...args}>
      <ActionCard.Header>Card Title</ActionCard.Header>
      <ActionCard.Content>
        <Typography>
          This is the main content of the card. It can contain any React elements and will
          automatically expand to fill the available space.
        </Typography>
      </ActionCard.Content>
      <ActionCard.Actions>
        <Button variant='outlined'>Cancel</Button>
        <Button variant='contained'>Save</Button>
      </ActionCard.Actions>
    </ActionCard>
  ),
};

export const WithHeaderAction: Story = {
  args: {},
  render: (args) => (
    <ActionCard {...args}>
      <ActionCard.Header
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
      >
        Card with Header Action
      </ActionCard.Header>
      <ActionCard.Content>
        <Typography>
          This card demonstrates how to include an action element in the header, such as a menu
          button or other controls.
        </Typography>
      </ActionCard.Content>
      <ActionCard.Actions>
        <Button startIcon={<EditIcon />}>Edit</Button>
      </ActionCard.Actions>
    </ActionCard>
  ),
};

export const ContentOnly: Story = {
  args: {},
  render: (args) => (
    <ActionCard {...args}>
      <ActionCard.Content>
        <Typography variant='h6' gutterBottom>
          Content Only Card
        </Typography>
        <Typography>
          This card only has content, no header or actions. This is useful for simple display cards
          or when you want maximum content space.
        </Typography>
      </ActionCard.Content>
    </ActionCard>
  ),
};

export const HeaderAndContent: Story = {
  args: {},
  render: (args) => (
    <ActionCard {...args}>
      <ActionCard.Header>Information Card</ActionCard.Header>
      <ActionCard.Content>
        <Typography>
          This card has a header and content but no actions. Perfect for displaying information that
          doesn't require user interaction.
        </Typography>
      </ActionCard.Content>
    </ActionCard>
  ),
};

export const MultipleActions: Story = {
  args: {},
  render: (args) => (
    <ActionCard {...args}>
      <ActionCard.Header>Task Card</ActionCard.Header>
      <ActionCard.Content>
        <Typography>
          This card demonstrates multiple actions in the footer area. Actions automatically wrap and
          maintain consistent spacing.
        </Typography>
      </ActionCard.Content>
      <ActionCard.Actions>
        <Button>Archive</Button>
        <Button>Duplicate</Button>
        <Button variant='outlined'>Cancel</Button>
        <Button variant='contained' color='error'>
          Delete
        </Button>
      </ActionCard.Actions>
    </ActionCard>
  ),
};
