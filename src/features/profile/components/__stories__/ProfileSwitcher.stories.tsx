import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { ProfileModel } from '../../domain/ProfileModel';
import { ProfileSwitcher } from '../ProfileSwitcher';

// Mock profiles for stories
const mockProfiles: ProfileModel[] = [
  {
    id: '1',
    name: 'John Doe',
    isNew: () => false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as ProfileModel,
  {
    id: '2',
    name: 'Jane Smith',
    isNew: () => true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  } as ProfileModel,
  {
    id: '3',
    name: 'Mike Johnson',
    isNew: () => false,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01'),
  } as ProfileModel,
];

const meta: Meta<typeof ProfileSwitcher> = {
  title: 'Features/Profile/ProfileSwitcher',
  component: ProfileSwitcher,
  tags: ['autodocs'],
  argTypes: {
    profiles: {
      control: false,
      description: 'List of available profiles',
    },
    activeProfileId: {
      control: 'text',
      description: 'ID of the currently active profile',
    },
    onProfileSelect: {
      action: 'onProfileSelect',
      description: 'Callback when a profile is selected',
    },
    onCreateProfile: {
      action: 'onCreateProfile',
      description: 'Callback when the create profile action is triggered',
    },
    onDeleteProfile: {
      action: 'onDeleteProfile',
      description: 'Callback when the delete profile action is triggered',
    },
    canDelete: {
      control: 'boolean',
      description: 'Whether deletion is allowed',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A profile switcher component that displays the active profile
and provides a dropdown menu to switch between profiles or create new ones.

## Features
- Avatar display with initials
- Dropdown menu with profile list
- Active profile highlighting
- New profile badges
- Profile deletion with confirmation
- Create new profile action
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileSwitcher>;

export const SingleProfile: Story = {
  args: {
    profiles: [mockProfiles[0]],
    activeProfileId: '1',
    onProfileSelect: action('onProfileSelect'),
    onCreateProfile: action('onCreateProfile'),
    canDelete: false,
  },
};

export const MultipleProfiles: Story = {
  args: {
    profiles: mockProfiles,
    activeProfileId: '1',
    onProfileSelect: action('onProfileSelect'),
    onCreateProfile: action('onCreateProfile'),
    onDeleteProfile: action('onDeleteProfile'),
    canDelete: true,
  },
};

export const WithNewProfile: Story = {
  args: {
    profiles: mockProfiles,
    activeProfileId: '2',
    onProfileSelect: action('onProfileSelect'),
    onCreateProfile: action('onCreateProfile'),
    onDeleteProfile: action('onDeleteProfile'),
    canDelete: true,
  },
};

export const NoActiveProfile: Story = {
  args: {
    profiles: mockProfiles,
    activeProfileId: null,
    onProfileSelect: action('onProfileSelect'),
    onCreateProfile: action('onCreateProfile'),
    canDelete: false,
  },
};
