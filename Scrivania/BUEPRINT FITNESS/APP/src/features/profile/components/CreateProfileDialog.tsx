import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { animations } from '@/app/animations';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

interface CreateProfileFormData {
  name: string;
}

export interface CreateProfileDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when the dialog should be closed
   */
  onClose: () => void;
  /**
   * Callback when a new profile should be created
   */
  onCreate: (name: string) => void;
  /**
   * Whether the creation is in progress
   */
  isCreating: boolean;
}

/**
 * A dialog component for creating new profiles.
 * Provides a form to enter profile name with validation.
 */
export const CreateProfileDialog = ({
  open,
  onClose,
  onCreate,
  isCreating,
}: CreateProfileDialogProps) => {
  const { t } = useAppTranslation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  const nameValidation = useMemo(
    () => ({
      required: t('profile.validation.nameRequired'),
      minLength: {
        value: 2,
        message: t('profile.validation.nameMinLength'),
      },
      maxLength: {
        value: 50,
        message: t('profile.validation.nameMaxLength'),
      },
    }),
    [t]
  );

  const handleClose = () => {
    if (!isCreating) {
      reset();
      onClose();
    }
  };

  const onSubmit = (data: CreateProfileFormData) => {
    onCreate(data.name.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      data-testid='create-profile-dialog'
      PaperComponent={motion.div}
      PaperProps={{
        ...animations.modalPopIn,
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle data-testid='create-profile-dialog-title'>
        {t('profile.create.title')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextFieldElement
            name='name'
            control={control}
            label={t('profile.fields.name')}
            fullWidth
            autoFocus
            disabled={isCreating}
            data-testid='create-profile-dialog-name-input'
            validation={nameValidation}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isCreating}
          data-testid='create-profile-dialog-cancel'
        >
          {t('common.cancel')}
        </Button>

        <Button
          onClick={handleSubmit(onSubmit)}
          variant='contained'
          disabled={isCreating || !isValid}
          data-testid='create-profile-dialog-create'
          startIcon={isCreating ? <CircularProgress size={16} /> : undefined}
        >
          {isCreating ? t('profile.create.creating') : t('profile.create.action')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
