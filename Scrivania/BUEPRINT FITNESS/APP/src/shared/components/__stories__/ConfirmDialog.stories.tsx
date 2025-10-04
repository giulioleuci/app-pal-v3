import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ConfirmDialog } from '../ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Shared/Components/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'The title of the dialog',
    },
    message: {
      control: 'text',
      description: 'The message content of the dialog',
    },
    variant: {
      control: 'select',
      options: ['default', 'danger', 'warning'],
      description: 'The variant/type of confirmation',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the confirm action is loading',
    },
    confirmText: {
      control: 'text',
      description: 'Text for the confirm button',
    },
    cancelText: {
      control: 'text',
      description: 'Text for the cancel button',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when the dialog is closed',
    },
    onConfirm: {
      action: 'onConfirm',
      description: 'Callback when the confirm action is triggered',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

// Interactive wrapper for Storybook
const InteractiveWrapper = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setLoading(false);
  };

  const handleConfirm = () => {
    setLoading(true);
    // Simulate async action
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button variant='contained' onClick={handleOpen}>
        Open Dialog
      </Button>
      {children({
        ...props,
        open,
        isLoading: loading,
        onClose: handleClose,
        onConfirm: handleConfirm,
      })}
    </>
  );
};

export const Default: Story = {
  render: (args) => (
    <InteractiveWrapper {...args}>
      {(props: any) => <ConfirmDialog {...props} />}
    </InteractiveWrapper>
  ),
  args: {
    title: 'Confirm Action',
    message: 'Are you sure you want to perform this action? This cannot be undone.',
    variant: 'default',
  },
};

export const DangerVariant: Story = {
  render: (args) => (
    <InteractiveWrapper {...args}>
      {(props: any) => <ConfirmDialog {...props} />}
    </InteractiveWrapper>
  ),
  args: {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    variant: 'danger',
    confirmText: 'Delete',
  },
};

export const WarningVariant: Story = {
  render: (args) => (
    <InteractiveWrapper {...args}>
      {(props: any) => <ConfirmDialog {...props} />}
    </InteractiveWrapper>
  ),
  args: {
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Are you sure you want to leave without saving?',
    variant: 'warning',
    confirmText: 'Leave Anyway',
    cancelText: 'Stay',
  },
};

export const CustomText: Story = {
  render: (args) => (
    <InteractiveWrapper {...args}>
      {(props: any) => <ConfirmDialog {...props} />}
    </InteractiveWrapper>
  ),
  args: {
    title: 'Start Workout',
    message: 'Ready to begin your workout session?',
    confirmText: 'Start Now',
    cancelText: 'Not Yet',
  },
};

export const AlwaysOpen: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    message: 'This dialog is always open for demonstration purposes.',
    onClose: () => {},
    onConfirm: () => {},
  },
};
