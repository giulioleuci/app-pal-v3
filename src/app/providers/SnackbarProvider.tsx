import { Alert, type AlertColor, Snackbar } from '@mui/material';
import React, { createContext, useCallback, useContext, useState } from 'react';

/**
 * Snackbar message configuration
 */
interface SnackbarMessage {
  message: string;
  severity?: AlertColor;
  duration?: number;
}

/**
 * Snackbar context value
 */
interface SnackbarContextValue {
  /** Shows a success message */
  showSuccess: (message: string, duration?: number) => void;

  /** Shows an error message */
  showError: (message: string, duration?: number) => void;

  /** Shows a warning message */
  showWarning: (message: string, duration?: number) => void;

  /** Shows an info message */
  showInfo: (message: string, duration?: number) => void;

  /** Shows a custom message with specified severity */
  showMessage: (config: SnackbarMessage) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/**
 * Props for the SnackbarProvider component
 */
interface SnackbarProviderProps {
  children: React.ReactNode;
}

/**
 * React provider that manages a global snackbar notification system.
 *
 * This provider creates a context for showing toast notifications throughout
 * the application. It provides helper methods for different severity levels
 * and handles automatic dismissal.
 */
export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [duration, setDuration] = useState(6000);

  const showMessage = useCallback((config: SnackbarMessage) => {
    setMessage(config.message);
    setSeverity(config.severity || 'info');
    setDuration(config.duration !== undefined ? config.duration : 6000);
    setOpen(true);
  }, []);

  const showSuccess = useCallback(
    (message: string, duration = 4000) => {
      showMessage({ message, severity: 'success', duration });
    },
    [showMessage]
  );

  const showError = useCallback(
    (message: string, duration = 6000) => {
      showMessage({ message, severity: 'error', duration });
    },
    [showMessage]
  );

  const showWarning = useCallback(
    (message: string, duration = 5000) => {
      showMessage({ message, severity: 'warning', duration });
    },
    [showMessage]
  );

  const showInfo = useCallback(
    (message: string, duration = 4000) => {
      showMessage({ message, severity: 'info', duration });
    },
    [showMessage]
  );

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  }, []);

  const value: SnackbarContextValue = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showMessage,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleClose} severity={severity} variant='filled' sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

/**
 * Hook to access the snackbar context.
 *
 * @throws {Error} If used outside of SnackbarProvider
 * @returns The snackbar context value with methods to show notifications
 */
export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }

  return context;
}
