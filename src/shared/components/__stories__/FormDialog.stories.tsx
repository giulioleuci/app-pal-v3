import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { FormDialog } from '../FormDialog';

const meta: Meta<typeof FormDialog> = {
  title: 'Shared/Components/FormDialog',
  component: FormDialog,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback fired when the dialog should be closed',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    children: {
      control: false,
      description: 'Form content',
    },
    onSubmit: {
      action: 'onSubmit',
      description: 'Callback fired when the form is submitted',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the form is in a loading state',
    },
    isSubmitDisabled: {
      control: 'boolean',
      description: 'Whether the submit button should be disabled',
    },
    submitText: {
      control: 'text',
      description: 'Text for the submit button',
    },
    cancelText: {
      control: 'text',
      description: 'Text for the cancel button',
    },
    maxWidth: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Maximum width of the dialog',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the dialog should take full width',
    },
    showCancel: {
      control: 'boolean',
      description: 'Whether to show the cancel button',
    },
    showSubmit: {
      control: 'boolean',
      description: 'Whether to show the submit button',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A generic dialog component for displaying forms in a modal overlay.
Provides consistent styling, accessibility, and behavior for form dialogs
throughout the application.

## Features
- Consistent modal behavior and styling
- Accessible markup with proper ARIA labels
- Loading states and disabled controls
- Customizable action buttons
- Form submission handling
- Close button in header
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormDialog>;

const FormDialogWrapper = (args: any) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setIsLoading(false);
  };

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button variant='contained' onClick={handleOpen}>
        Open Dialog
      </Button>
      <FormDialog
        {...args}
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
};

export const Default: Story = {
  args: {
    title: 'Create New Item',
    submitText: 'Create',
  },
  render: (args) => (
    <FormDialogWrapper {...args}>
      <TextField label='Name' fullWidth required margin='normal' />
      <TextField label='Description' fullWidth multiline rows={4} margin='normal' />
    </FormDialogWrapper>
  ),
};

export const WithCheckbox: Story = {
  args: {
    title: 'User Preferences',
    submitText: 'Save Preferences',
  },
  render: (args) => (
    <FormDialogWrapper {...args}>
      <TextField label='Display Name' fullWidth margin='normal' />
      <FormControlLabel control={<Checkbox defaultChecked />} label='Enable notifications' />
      <FormControlLabel control={<Checkbox />} label='Share data with partners' />
      <FormControlLabel control={<Checkbox defaultChecked />} label='Receive marketing emails' />
    </FormDialogWrapper>
  ),
};

export const Large: Story = {
  args: {
    title: 'Detailed Configuration',
    maxWidth: 'lg',
    submitText: 'Save Configuration',
  },
  render: (args) => (
    <FormDialogWrapper {...args}>
      <TextField label='Configuration Name' fullWidth margin='normal' />
      <TextField
        label='API Endpoint'
        fullWidth
        margin='normal'
        placeholder='https://api.example.com'
      />
      <TextField label='API Key' type='password' fullWidth margin='normal' />
      <TextField
        label='Description'
        fullWidth
        multiline
        rows={6}
        margin='normal'
        placeholder='Describe the purpose of this configuration...'
      />
      <FormControlLabel control={<Checkbox />} label='Enable SSL verification' />
      <FormControlLabel control={<Checkbox defaultChecked />} label='Auto-retry on failure' />
    </FormDialogWrapper>
  ),
};

export const NoCancel: Story = {
  args: {
    title: 'Required Action',
    submitText: 'Continue',
    showCancel: false,
  },
  render: (args) => (
    <FormDialogWrapper {...args}>
      <TextField
        label='Verification Code'
        fullWidth
        required
        margin='normal'
        placeholder='Enter the 6-digit code'
      />
    </FormDialogWrapper>
  ),
};
