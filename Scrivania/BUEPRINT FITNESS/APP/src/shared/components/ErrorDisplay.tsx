import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import React from 'react';

import { animations } from '@/app/animations';
import { Icon } from '@/shared/components/Icon';
import { useAppTranslation } from '@/shared/locales/useAppTranslation';

export interface ErrorDisplayProps {
  /**
   * The error message to display
   */
  message?: string;
  /**
   * Optional error title
   */
  title?: string;
  /**
   * The error object (for development environments)
   */
  error?: Error;
  /**
   * Whether to show a retry button
   * @default true
   */
  showRetry?: boolean;
  /**
   * Callback for retry action
   */
  onRetry?: () => void;
  /**
   * The variant of the error display
   * @default 'inline'
   */
  variant?: 'inline' | 'fullPage' | 'alert';
  /**
   * Whether to show technical details in development
   * @default false
   */
  showDetails?: boolean;
  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * A standardized error display component with optional retry functionality.
 * Handles different error presentation formats and provides consistent user experience.
 */
export const ErrorDisplay = ({
  message,
  title,
  error,
  showRetry = true,
  onRetry,
  variant = 'inline',
  showDetails = false,
  'data-testid': testId = 'error-display-component',
}: ErrorDisplayProps) => {
  const { t } = useAppTranslation();

  const defaultTitle = title || t('error.defaultTitle');
  const defaultMessage = message || error?.message || t('error.defaultMessage');

  // Show technical details only in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldShowDetails = showDetails && isDevelopment && error;

  if (variant === 'alert') {
    return (
      <Alert
        severity='error'
        data-testid='error-display-alert'
        action={
          showRetry && onRetry ? (
            <Button
              color='inherit'
              size='small'
              onClick={onRetry}
              data-testid='error-display-retry'
            >
              {t('common.retry')}
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>{defaultTitle}</AlertTitle>
        {defaultMessage}
        {shouldShowDetails && (
          <Box sx={{ mt: 1, fontSize: '0.875rem', opacity: 0.8 }}>
            <Typography variant='caption' component='div'>
              {error?.stack}
            </Typography>
          </Box>
        )}
      </Alert>
    );
  }

  const content = (
    <motion.div initial='hidden' animate='visible' variants={animations.fadeInUp}>
      <Stack
        alignItems='center'
        spacing={3}
        sx={{
          textAlign: 'center',
          py: variant === 'fullPage' ? 8 : 4,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <Icon
            name='error'
            sx={{
              fontSize: 32,
              color: 'error.main',
            }}
          />
        </Box>

        <Stack spacing={1} alignItems='center'>
          <Typography
            variant={variant === 'fullPage' ? 'h4' : 'h6'}
            component='h2'
            fontWeight='medium'
            data-testid='error-display-title'
          >
            {defaultTitle}
          </Typography>

          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ maxWidth: 500 }}
            data-testid='error-display-message'
          >
            {defaultMessage}
          </Typography>

          {shouldShowDetails && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                maxWidth: 600,
                overflow: 'auto',
              }}
            >
              <Typography
                variant='caption'
                component='pre'
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error?.stack}
              </Typography>
            </Box>
          )}
        </Stack>

        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant='contained'
            size='large'
            data-testid='error-display-retry'
            startIcon={<Icon name='refresh' />}
            sx={{ mt: 2 }}
          >
            {t('common.retry')}
          </Button>
        )}
      </Stack>
    </motion.div>
  );

  if (variant === 'fullPage') {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        data-testid={testId}
      >
        {content}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'error.light',
        border: 1,
        borderColor: 'error.main',
        borderRadius: 2,
      }}
      data-testid={testId}
    >
      {content}
    </Paper>
  );
};
