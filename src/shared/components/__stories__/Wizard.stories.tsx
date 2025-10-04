import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Wizard } from '../Wizard';

const meta: Meta<typeof Wizard> = {
  title: 'Shared/Components/Wizard',
  component: Wizard,
  tags: ['autodocs'],
  argTypes: {
    activeStep: {
      control: 'number',
      description: 'Current active step (0-indexed)',
    },
    steps: {
      control: 'object',
      description: 'Array of step labels',
    },
    children: {
      control: false,
      description: 'Wizard content composed using Wizard.Step and Wizard.Actions',
    },
    linear: {
      control: 'boolean',
      description: "Whether the stepper should be linear (users can't skip steps)",
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A compound component for creating multi-step wizards with navigation.
Provides a consistent interface for step-by-step user flows with
progress indication and navigation controls.

## Compound Components
- **Wizard.Step**: Individual step content with optional title
- **Wizard.Actions**: Navigation controls for previous/next/finish

## Features
- Visual progress indication with stepper
- Navigation controls with automatic state management
- Loading states and disabled controls
- Customizable button text
- Responsive design
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wizard>;

const WizardWrapper = (args: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      notifications: false,
      marketing: false,
    },
    plan: 'basic',
  });

  const steps = ['Basic Info', 'Preferences', 'Plan Selection', 'Review'];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    console.log('Wizard completed with data:', formData);
    alert('Wizard completed! Check console for data.');
  };

  return (
    <Wizard {...args} activeStep={currentStep} steps={steps}>
      <Wizard.Step title='Basic Information' isActive={currentStep === 0}>
        <TextField
          label='Full Name'
          fullWidth
          margin='normal'
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <TextField
          label='Email Address'
          type='email'
          fullWidth
          margin='normal'
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </Wizard.Step>

      <Wizard.Step title='Your Preferences' isActive={currentStep === 1}>
        <Typography variant='h6' gutterBottom>
          Communication Preferences
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.preferences.notifications}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    notifications: e.target.checked,
                  },
                })
              }
            />
          }
          label='Enable email notifications'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.preferences.marketing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    marketing: e.target.checked,
                  },
                })
              }
            />
          }
          label='Receive marketing communications'
        />
      </Wizard.Step>

      <Wizard.Step title='Choose Your Plan' isActive={currentStep === 2}>
        <FormControl component='fieldset'>
          <FormLabel component='legend'>Select a plan</FormLabel>
          <RadioGroup
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
          >
            <FormControlLabel value='basic' control={<Radio />} label='Basic (Free)' />
            <FormControlLabel value='pro' control={<Radio />} label='Pro ($9.99/month)' />
            <FormControlLabel
              value='enterprise'
              control={<Radio />}
              label='Enterprise ($29.99/month)'
            />
          </RadioGroup>
        </FormControl>
      </Wizard.Step>

      <Wizard.Step title='Review & Confirm' isActive={currentStep === 3}>
        <Typography variant='h6' gutterBottom>
          Please review your information
        </Typography>
        <Typography>
          <strong>Name:</strong> {formData.name || 'Not provided'}
        </Typography>
        <Typography>
          <strong>Email:</strong> {formData.email || 'Not provided'}
        </Typography>
        <Typography>
          <strong>Notifications:</strong>{' '}
          {formData.preferences.notifications ? 'Enabled' : 'Disabled'}
        </Typography>
        <Typography>
          <strong>Marketing:</strong> {formData.preferences.marketing ? 'Enabled' : 'Disabled'}
        </Typography>
        <Typography>
          <strong>Plan:</strong> {formData.plan}
        </Typography>
      </Wizard.Step>

      <Wizard.Actions
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onFinish={handleFinish}
        isNextDisabled={
          (currentStep === 0 && (!formData.name || !formData.email)) ||
          (currentStep === 3 && (!formData.name || !formData.email))
        }
      />
    </Wizard>
  );
};

export const Default: Story = {
  args: {},
  render: (args) => <WizardWrapper {...args} />,
};

export const SimpleSteps: Story = {
  args: {},
  render: function WithState(args) {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ['Step 1', 'Step 2', 'Step 3'];

    return (
      <Wizard {...args} activeStep={currentStep} steps={steps}>
        <Wizard.Step isActive={currentStep === 0}>
          <Typography>This is the first step content.</Typography>
        </Wizard.Step>

        <Wizard.Step isActive={currentStep === 1}>
          <Typography>This is the second step content.</Typography>
        </Wizard.Step>

        <Wizard.Step isActive={currentStep === 2}>
          <Typography>This is the final step content.</Typography>
        </Wizard.Step>

        <Wizard.Actions
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
          onPrevious={() => setCurrentStep(Math.max(currentStep - 1, 0))}
          onFinish={() => alert('Wizard completed!')}
        />
      </Wizard>
    );
  },
};
