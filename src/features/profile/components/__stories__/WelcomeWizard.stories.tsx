import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { WelcomeWizard } from '../WelcomeWizard';

const meta: Meta<typeof WelcomeWizard> = {
  title: 'Features/Profile/WelcomeWizard',
  component: WelcomeWizard,
  tags: ['autodocs'],
  argTypes: {
    onComplete: {
      action: 'onComplete',
      description: 'Callback when the form is completed',
    },
    isCreating: {
      control: 'boolean',
      description: 'Whether the profile creation is in progress',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A welcome wizard component for new user onboarding.
Allows users to enter their name to create their first profile.

## Features
- Full-screen welcome experience
- Form validation with i18n support
- Loading states with disabled controls
- Animated entry with framer-motion
- Accessibility compliant markup
        `,
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof WelcomeWizard>;

export const Default: Story = {
  args: {
    onComplete: action('onComplete'),
    isCreating: false,
  },
};

export const Creating: Story = {
  args: {
    onComplete: action('onComplete'),
    isCreating: true,
  },
};
