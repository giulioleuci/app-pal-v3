import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { CreateProfileDialog } from '../CreateProfileDialog';

const meta: Meta<typeof CreateProfileDialog> = {
  title: 'Features/Profile/CreateProfileDialog',
  component: CreateProfileDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when the dialog should be closed',
    },
    onCreate: {
      action: 'onCreate',
      description: 'Callback when a new profile should be created',
    },
    isCreating: {
      control: 'boolean',
      description: 'Whether the creation is in progress',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A dialog component for creating new profiles.
Provides a form to enter profile name with validation.

## Features
- Modal dialog with form
- Profile name validation
- Loading states with disabled controls
- Animated entry with framer-motion
- Form submission handling
- Accessibility compliant markup
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CreateProfileDialog>;

const CreateProfileDialogWrapper = (args: any) => {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsCreating(false);
  };

  const handleCreate = (name: string) => {
    setIsCreating(true);
    action('onCreate')(name);
    // Simulate API call
    setTimeout(() => {
      setIsCreating(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button variant='contained' onClick={handleOpen}>
        Create Profile
      </Button>
      <CreateProfileDialog
        {...args}
        open={open}
        onClose={handleClose}
        onCreate={handleCreate}
        isCreating={isCreating}
      />
    </>
  );
};

export const Default: Story = {
  args: {
    open: false,
    onClose: action('onClose'),
    onCreate: action('onCreate'),
    isCreating: false,
  },
  render: (args) => <CreateProfileDialogWrapper {...args} />,
};

export const Open: Story = {
  args: {
    open: true,
    onClose: action('onClose'),
    onCreate: action('onCreate'),
    isCreating: false,
  },
};

export const Creating: Story = {
  args: {
    open: true,
    onClose: action('onClose'),
    onCreate: action('onCreate'),
    isCreating: true,
  },
};
