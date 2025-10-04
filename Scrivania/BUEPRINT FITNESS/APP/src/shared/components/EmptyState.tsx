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

export type EmptyStateContext =
  | 'workouts'
  | 'exercises'
  | 'trainingPlans'
  | 'workoutSessions'
  | 'progress'
  | 'profile'
  | 'notifications'
  | 'search'
  | 'generic';

export interface EmptyStateProps {
  /**
   * The context for which to show the empty state
   */
  context: EmptyStateContext;
  /**
   * Optional custom title to override the default context-based title
   */
  title?: string;
  /**
   * Optional custom message to override the default context-based message
   */
  message?: string;
  /**
   * Optional custom icon to override the default context-based icon
   */
  icon?: string;
  /**
   * Optional action to display to the user
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined' | 'text';
  };
  /**
   * Whether to display as a full-page state or inline
   * @default 'inline'
   */
  variant?: 'fullPage' | 'inline';
}

/**
 * A contextual empty state component that acts as mini-onboarding for features.
 * Guides users toward their first action based on the specific context.
 */
export const EmptyState = ({
  context,
  title,
  message,
  icon,
  action,
  variant = 'inline',
}: EmptyStateProps) => {
  const { t } = useAppTranslation();

  const getContextualContent = () => {
    switch (context) {
      case 'workouts':
        return {
          icon: 'workout',
          title: t('emptyState.workouts.title'),
          message: t('emptyState.workouts.message'),
        };

      case 'exercises':
        return {
          icon: 'workout',
          title: t('emptyState.exercises.title'),
          message: t('emptyState.exercises.message'),
        };

      case 'trainingPlans':
        return {
          icon: 'calendar',
          title: t('emptyState.trainingPlans.title'),
          message: t('emptyState.trainingPlans.message'),
        };

      case 'workoutSessions':
        return {
          icon: 'timer',
          title: t('emptyState.workoutSessions.title'),
          message: t('emptyState.workoutSessions.message'),
        };

      case 'progress':
        return {
          icon: 'trending-up',
          title: t('emptyState.progress.title'),
          message: t('emptyState.progress.message'),
        };

      case 'profile':
        return {
          icon: 'person',
          title: t('emptyState.profile.title'),
          message: t('emptyState.profile.message'),
        };

      case 'notifications':
        return {
          icon: 'info',
          title: t('emptyState.notifications.title'),
          message: t('emptyState.notifications.message'),
        };

      case 'search':
        return {
          icon: 'search',
          title: t('emptyState.search.title'),
          message: t('emptyState.search.message'),
        };

      default:
        return {
          icon: 'info',
          title: t('emptyState.generic.title'),
          message: t('emptyState.generic.message'),
        };
    }
  };

  const contextualContent = getContextualContent();
  const displayTitle = title || contextualContent.title;
  const displayMessage = message || contextualContent.message;
  const displayIcon = icon || contextualContent.icon;

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
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <Icon
            name={displayIcon}
            sx={{
              fontSize: 32,
              color: 'primary.main',
            }}
          />
        </Box>

        <Stack spacing={1} alignItems='center'>
          <Typography
            variant={variant === 'fullPage' ? 'h4' : 'h6'}
            component='h2'
            fontWeight='medium'
            data-testid='empty-state-title'
          >
            {displayTitle}
          </Typography>

          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ maxWidth: 400 }}
            data-testid='empty-state-message'
          >
            {displayMessage}
          </Typography>
        </Stack>

        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'contained'}
            size='large'
            data-testid='empty-state-action'
            sx={{ mt: 2 }}
          >
            {action.label}
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
        data-testid='empty-state-component'
      >
        {content}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
      }}
      data-testid='empty-state-component'
    >
      {content}
    </Paper>
  );
};
