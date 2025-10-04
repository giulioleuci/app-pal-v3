import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormDialog } from '@/shared/components/FormDialog';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

// Validation schema for creating a training plan
const createTrainingPlanSchema = z.object({
  name: z.string().min(1, 'trainingPlan.validation.nameRequired'),
  description: z.string().optional(),
});

type CreateTrainingPlanFormData = z.infer<typeof createTrainingPlanSchema>;

export interface CreateTrainingPlanDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback fired when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Callback fired when a training plan should be created
   */
  onCreatePlan: (data: CreateTrainingPlanFormData) => void | Promise<void>;
  /**
   * Whether the form is in a loading state
   */
  isLoading?: boolean;
  /**
   * Test identifier for the dialog
   */
  'data-testid'?: string;
}

/**
 * A modal dialog for creating a new training plan. Uses react-hook-form with Zod validation
 * and the FormDialog component for consistent styling and behavior.
 *
 * @example
 * ```tsx
 * <CreateTrainingPlanDialog
 *   open={isDialogOpen}
 *   onClose={handleCloseDialog}
 *   onCreatePlan={handleCreatePlan}
 *   isLoading={isCreating}
 * />
 * ```
 */
export const CreateTrainingPlanDialog = ({
  open,
  onClose,
  onCreatePlan,
  isLoading = false,
  'data-testid': testId = 'create-training-plan-dialog',
}: CreateTrainingPlanDialogProps) => {
  const { t } = useAppTranslation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateTrainingPlanFormData>({
    resolver: zodResolver(createTrainingPlanSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: CreateTrainingPlanFormData) => {
    try {
      await onCreatePlan(data);
      reset();
      onClose();
    } catch (_error) {
      // Error handling will be managed by the parent component
      console.error('Failed to create training plan:', error);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title={t('trainingPlan.editor.createPlan')}
      onSubmit={handleSubmit(handleFormSubmit)}
      isLoading={isLoading}
      isSubmitDisabled={!isValid}
      submitText={t('common.create')}
      data-testid={testId}
      maxWidth='sm'
    >
      <Controller
        name='name'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t('trainingPlan.editor.planName')}
            error={!!errors.name}
            helperText={errors.name?.message ? t(errors.name.message as any) : ''}
            fullWidth
            required
            data-testid='create-training-plan-name-field'
            disabled={isLoading}
          />
        )}
      />

      <Controller
        name='description'
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t('trainingPlan.editor.planDescription')}
            error={!!errors.description}
            helperText={errors.description?.message ? t(errors.description.message as any) : ''}
            fullWidth
            multiline
            rows={3}
            data-testid='create-training-plan-description-field'
            disabled={isLoading}
          />
        )}
      />
    </FormDialog>
  );
};
