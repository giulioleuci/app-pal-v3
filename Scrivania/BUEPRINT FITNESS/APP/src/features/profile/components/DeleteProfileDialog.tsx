import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { animations } from '@/app/animations';
import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

interface DeleteProfileFormData {
  confirmationName: string;
}

export interface DeleteProfileDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * The profile to be deleted
   */
  profile: ProfileModel | null;
  /**
   * Callback when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Callback when the profile should be deleted
   */
  onDelete: (profileId: string) => void;
  /**
   * Whether the deletion is in progress
   */
  isDeleting: boolean;
}

/**
 * A confirmation dialog for deleting profiles.
 * Requires the user to type the profile name to confirm deletion.
 */
export const DeleteProfileDialog = ({
  open,
  profile,
  onClose,
  onDelete,
  isDeleting,
}: DeleteProfileDialogProps) => {
  const { t } = useAppTranslation();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isValid },
  } = useForm<DeleteProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      confirmationName: '',
    },
  });

  const confirmationName = watch('confirmationName');
  const isConfirmationValid = profile ? confirmationName.trim() === profile.name : false;

  const confirmationValidation = useMemo(
    () => ({
      required: t('profile.validation.confirmationRequired'),
      validate: (value: string) =>
        value.trim() === profile?.name || t('profile.validation.confirmationMismatch'),
    }),
    [t, profile?.name]
  );

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleClose = () => {
    if (!isDeleting) {
      reset();
      onClose();
    }
  };

  const onSubmit = () => {
    if (profile && isConfirmationValid) {
      onDelete(profile.id);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      data-testid='delete-profile-dialog'
      PaperComponent={motion.div}
      PaperProps={{
        ...animations.modalPopIn,
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle data-testid='delete-profile-dialog-title'>
        {t('profile.delete.title')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Alert severity='warning' data-testid='delete-profile-dialog-warning'>
            {t('profile.delete.warning')}
          </Alert>

          <Typography variant='body1' data-testid='delete-profile-dialog-message'>
            {t('profile.delete.message', { profileName: profile.name })}
          </Typography>

          <Typography variant='body2' color='text.secondary'>
            {t('profile.delete.instruction', { profileName: profile.name })}
          </Typography>

          <TextFieldElement
            name='confirmationName'
            control={control}
            label={t('profile.delete.confirmationLabel')}
            placeholder={profile.name}
            fullWidth
            autoFocus
            disabled={isDeleting}
            data-testid='delete-profile-dialog-confirmation-input'
            validation={confirmationValidation}
          />

          {confirmationName && !isConfirmationValid && (
            <Typography
              variant='caption'
              color='error'
              data-testid='delete-profile-dialog-mismatch'
            >
              {t('profile.validation.confirmationMismatch')}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          data-testid='delete-profile-dialog-cancel'
        >
          {t('common.cancel')}
        </Button>

        <Button
          onClick={handleSubmit(onSubmit)}
          variant='contained'
          color='error'
          disabled={isDeleting || !isConfirmationValid}
          data-testid='delete-profile-dialog-delete'
          startIcon={isDeleting ? <CircularProgress size={16} /> : undefined}
        >
          {isDeleting ? t('profile.delete.deleting') : t('profile.delete.action')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
