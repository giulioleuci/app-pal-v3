import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ProfileModel } from '../../domain/ProfileModel';
import { DeleteProfileDialog } from '../DeleteProfileDialog';

// Mock profile for stories
const mockProfile: ProfileModel = {
  id: '1',
  name: 'John Doe',
  isNew: () => false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
} as ProfileModel;

const meta: Meta<typeof DeleteProfileDialog> = {
  title: 'Features/Profile/DeleteProfileDialog',
  component: DeleteProfileDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    profile: {
      control: false,
      description: 'The profile to be deleted',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when the dialog should be closed',
    },
    onDelete: {
      action: 'onDelete',
      description: 'Callback when the profile should be deleted',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Whether the deletion is in progress',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A confirmation dialog for deleting profiles.
Requires the user to type the profile name to confirm deletion.

## Features
- Confirmation dialog with warning
- Profile name validation for safety
- Loading states with disabled controls
- Animated entry with framer-motion
- Deletion confirmation handling
- Accessibility compliant markup
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DeleteProfileDialog>;

const DeleteProfileDialogWrapper = (args: any) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsDeleting(false);
  };

  const handleDelete = (profileId: string) => {
    setIsDeleting(true);
    action('onDelete')(profileId);
    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button variant='contained' color='error' onClick={handleOpen}>
        Delete Profile
      </Button>
      <DeleteProfileDialog
        {...args}
        open={open}
        onClose={handleClose}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export const Default: Story = {
  args: {
    open: false,
    profile: mockProfile,
    onClose: action('onClose'),
    onDelete: action('onDelete'),
    isDeleting: false,
  },
  render: (args) => <DeleteProfileDialogWrapper {...args} />,
};

export const Open: Story = {
  args: {
    open: true,
    profile: mockProfile,
    onClose: action('onClose'),
    onDelete: action('onDelete'),
    isDeleting: false,
  },
};

export const Deleting: Story = {
  args: {
    open: true,
    profile: mockProfile,
    onClose: action('onClose'),
    onDelete: action('onDelete'),
    isDeleting: true,
  },
};

export const LongProfileName: Story = {
  args: {
    open: true,
    profile: {
      ...mockProfile,
      name: 'Very Long Profile Name That Tests Layout',
    } as ProfileModel,
    onClose: action('onClose'),
    onDelete: action('onDelete'),
    isDeleting: false,
  },
};
