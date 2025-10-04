import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

import { animations } from '@/app/animations';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * The title of the dialog
   */
  title: string;
  /**
   * The message content of the dialog
   */
  message: string;
  /**
   * The variant/type of confirmation (affects button colors and styling)
   * @default 'default'
   */
  variant?: 'default' | 'danger' | 'warning';
  /**
   * Whether the confirm action is loading
   * @default false
   */
  isLoading?: boolean;
  /**
   * Text for the confirm button
   */
  confirmText?: string;
  /**
   * Text for the cancel button
   */
  cancelText?: string;
  /**
   * Callback when the dialog is closed
   */
  onClose: () => void;
  /**
   * Callback when the confirm action is triggered
   */
  onConfirm: () => void;
}

/**
 * A reusable confirmation dialog with animation and loading states.
 * Supports different variants for different types of confirmations.
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  variant = 'default',
  isLoading = false,
  confirmText,
  cancelText,
  onClose,
  onConfirm,
}: ConfirmDialogProps) => {
  const { t } = useAppTranslation();

  const getConfirmButtonProps = () => {
    switch (variant) {
      case 'danger':
        return {
          color: 'error' as const,
          variant: 'contained' as const,
        };
      case 'warning':
        return {
          color: 'warning' as const,
          variant: 'contained' as const,
        };
      default:
        return {
          color: 'primary' as const,
          variant: 'contained' as const,
        };
    }
  };

  const buttonProps = getConfirmButtonProps();

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth='sm'
          fullWidth
          data-testid='confirm-dialog'
          PaperComponent={motion.div}
          PaperProps={{
            ...animations.modalPopIn,
            sx: {
              borderRadius: 2,
              p: 1,
            },
          }}
        >
          <DialogTitle data-testid='confirm-dialog-title'>{title}</DialogTitle>

          <DialogContent>
            <DialogContentText data-testid='confirm-dialog-message'>{message}</DialogContentText>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={onClose}
              disabled={isLoading}
              data-testid='confirm-dialog-cancel'
              sx={{ mr: 1 }}
            >
              {cancelText || t('common.cancel')}
            </Button>

            <Button
              onClick={onConfirm}
              disabled={isLoading}
              data-testid='confirm-dialog-confirm'
              startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
              {...buttonProps}
            >
              {confirmText || t('common.confirm')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
