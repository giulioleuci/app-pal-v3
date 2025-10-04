import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useAppTranslation } from '@/shared/locales/useAppTranslation';

const StyledWizardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(2),
}));

const StyledStepContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const StyledActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export interface WizardProps {
  /**
   * Current active step (0-indexed)
   */
  activeStep: number;
  /**
   * Array of step labels
   */
  steps: string[];
  /**
   * Wizard content
   */
  children: React.ReactNode;
  /**
   * Test identifier for the wizard
   */
  'data-testid'?: string;
  /**
   * Whether the stepper should be linear (users can't skip steps)
   */
  linear?: boolean;
}

export interface WizardStepProps {
  /**
   * Step title
   */
  title?: string;
  /**
   * Step content
   */
  children: React.ReactNode;
  /**
   * Test identifier for the step
   */
  'data-testid'?: string;
  /**
   * Whether this step is currently active
   */
  isActive?: boolean;
}

export interface WizardActionsProps {
  /**
   * Current step index
   */
  currentStep: number;
  /**
   * Total number of steps
   */
  totalSteps: number;
  /**
   * Callback for going to the next step
   */
  onNext?: () => void;
  /**
   * Callback for going to the previous step
   */
  onPrevious?: () => void;
  /**
   * Callback for finishing the wizard
   */
  onFinish?: () => void;
  /**
   * Whether the next/finish button should be disabled
   */
  isNextDisabled?: boolean;
  /**
   * Whether the previous button should be disabled
   */
  isPreviousDisabled?: boolean;
  /**
   * Whether the wizard is in a loading state
   */
  isLoading?: boolean;
  /**
   * Custom text for the next button
   */
  nextText?: string;
  /**
   * Custom text for the previous button
   */
  previousText?: string;
  /**
   * Custom text for the finish button
   */
  finishText?: string;
  /**
   * Additional actions to show
   */
  additionalActions?: React.ReactNode;
  /**
   * Test identifier for the actions
   */
  'data-testid'?: string;
}

/**
 * Step component for the Wizard
 */
const WizardStep = ({
  title,
  children,
  'data-testid': testId,
  isActive = true,
}: WizardStepProps) => {
  if (!isActive) return null;

  return (
    <StyledStepContent data-testid={testId || 'wizard-step'}>
      {title && (
        <Typography variant='h6' gutterBottom data-testid='wizard-step-title'>
          {title}
        </Typography>
      )}
      {children}
    </StyledStepContent>
  );
};

/**
 * Actions component for the Wizard
 */
const WizardActions = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
  nextText,
  previousText,
  finishText,
  additionalActions,
  'data-testid': testId,
}: WizardActionsProps) => {
  const { t } = useAppTranslation();

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onFinish?.();
    } else {
      onNext?.();
    }
  };

  const finalNextText = nextText || t('common.next');
  const finalPreviousText = previousText || t('common.previous');
  const finalFinishText = finishText || t('common.finish');

  return (
    <StyledActions data-testid={testId || 'wizard-actions'}>
      <Box sx={{ display: 'flex', gap: 1 }}>{additionalActions}</Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          onClick={onPrevious}
          disabled={isFirstStep || isPreviousDisabled || isLoading}
          data-testid='wizard-previous-button'
        >
          {finalPreviousText}
        </Button>
        <Button
          variant='contained'
          onClick={handleNext}
          disabled={isNextDisabled || isLoading}
          data-testid='wizard-next-button'
        >
          {isLastStep ? finalFinishText : finalNextText}
        </Button>
      </Box>
    </StyledActions>
  );
};

/**
 * A compound component for creating multi-step wizards with navigation.
 * Provides a consistent interface for step-by-step user flows with
 * progress indication and navigation controls.
 *
 * @example
 * ```tsx
 * <Wizard activeStep={currentStep} steps={['Basic Info', 'Preferences', 'Review']}>
 *   <Wizard.Step title="Basic Information" isActive={currentStep === 0}>
 *     <TextField label="Name" />
 *   </Wizard.Step>
 *   <Wizard.Step title="Preferences" isActive={currentStep === 1}>
 *     <FormControlLabel control={<Checkbox />} label="Enable notifications" />
 *   </Wizard.Step>
 *   <Wizard.Step title="Review" isActive={currentStep === 2}>
 *     <Typography>Please review your information...</Typography>
 *   </Wizard.Step>
 *   <Wizard.Actions
 *     currentStep={currentStep}
 *     totalSteps={3}
 *     onNext={handleNext}
 *     onPrevious={handlePrevious}
 *     onFinish={handleFinish}
 *   />
 * </Wizard>
 * ```
 */
export const Wizard = ({
  activeStep,
  steps,
  children,
  linear: _linear = true,
  'data-testid': testId = 'wizard',
}: WizardProps) => {
  return (
    <StyledWizardContainer data-testid={testId}>
      <Stepper activeStep={activeStep} data-testid='wizard-stepper'>
        {steps.map((label, index) => (
          <Step key={label} data-testid={`wizard-step-indicator-${index}`}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {children}
    </StyledWizardContainer>
  );
};

// Attach compound components
Wizard.Step = WizardStep;
Wizard.Actions = WizardActions;
