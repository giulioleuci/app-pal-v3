import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import React from 'react';

import { useAppTranslation } from '@/shared/locales/useAppTranslation';

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(1, 2, 2),
  gap: theme.spacing(1),
}));

export interface FormDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback fired when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Form content
   */
  children: React.ReactNode;
  /**
   * Callback fired when the form is submitted
   */
  onSubmit?: () => void;
  /**
   * Whether the form is in a loading state
   */
  isLoading?: boolean;
  /**
   * Whether the submit button should be disabled
   */
  isSubmitDisabled?: boolean;
  /**
   * Text for the submit button
   */
  submitText?: string;
  /**
   * Text for the cancel button
   */
  cancelText?: string;
  /**
   * Maximum width of the dialog
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether the dialog should take full width
   */
  fullWidth?: boolean;
  /**
   * Test identifier for the dialog
   */
  'data-testid'?: string;
  /**
   * Whether to show the cancel button
   */
  showCancel?: boolean;
  /**
   * Whether to show the submit button
   */
  showSubmit?: boolean;
  /**
   * Additional actions to show in the dialog actions area
   */
  additionalActions?: React.ReactNode;
}

/**
 * A generic dialog component for displaying forms in a modal overlay.
 * Provides consistent styling, accessibility, and behavior for form dialogs
 * throughout the application.
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Create New Item"
 *   onSubmit={handleSubmit}
 *   isLoading={isSubmitting}
 *   submitText="Create"
 * >
 *   <TextField label="Name" {...register('name')} />
 *   <TextField label="Description" {...register('description')} />
 * </FormDialog>
 * ```
 */
export const FormDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  isLoading = false,
  isSubmitDisabled = false,
  submitText,
  cancelText,
  maxWidth = 'sm',
  fullWidth = true,
  'data-testid': testId = 'form-dialog',
  showCancel = true,
  showSubmit = true,
  additionalActions,
}: FormDialogProps) => {
  const { t } = useAppTranslation();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  const finalSubmitText = submitText || t('common.save');
  const finalCancelText = cancelText || t('common.cancel');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      data-testid={testId}
      aria-labelledby='form-dialog-title'
    >
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle id='form-dialog-title'>
          {title}
          <IconButton
            aria-label={t('common.close')}
            onClick={onClose}
            size='small'
            data-testid='form-dialog-close-button'
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <StyledDialogContent data-testid='form-dialog-content'>{children}</StyledDialogContent>

        <StyledDialogActions data-testid='form-dialog-actions'>
          {additionalActions}
          {showCancel && (
            <Button onClick={onClose} disabled={isLoading} data-testid='form-dialog-cancel-button'>
              {finalCancelText}
            </Button>
          )}
          {showSubmit && (
            <Button
              type='submit'
              variant='contained'
              disabled={isLoading || isSubmitDisabled}
              data-testid='form-dialog-submit-button'
            >
              {finalSubmitText}
            </Button>
          )}
        </StyledDialogActions>
      </form>
    </Dialog>
  );
};
