import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';

export interface PageHeaderProps {
  /**
   * The main title of the page
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Whether to show the back button
   * @default false
   */
  showBackButton?: boolean;
  /**
   * Custom back navigation handler
   * If not provided, uses navigate(-1)
   */
  onBack?: () => void;
  /**
   * Optional action buttons or elements to display on the right
   */
  actions?: React.ReactNode;
  /**
   * Custom icon to display next to the title
   */
  icon?: string;
  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * A standardized page header component with optional back navigation,
 * title, subtitle, and action elements.
 */
export const PageHeader = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  actions,
  icon,
  'data-testid': testId = 'page-header-component',
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Box
      sx={{
        pb: 2,
        mb: 3,
        borderBottom: 1,
        borderColor: 'divider',
      }}
      data-testid={testId}
    >
      <Stack direction='row' alignItems='center' spacing={2}>
        {showBackButton && (
          <IconButton
            onClick={handleBack}
            data-testid='page-header-back-button'
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <Icon name='ArrowBack' />
          </IconButton>
        )}

        <Stack direction='row' alignItems='center' spacing={1} sx={{ flex: 1 }}>
          {icon && (
            <Icon
              name={icon}
              sx={{
                fontSize: 28,
                color: 'primary.main',
              }}
            />
          )}

          <Box>
            <Typography
              variant='h4'
              component='h1'
              fontWeight='bold'
              data-testid='page-header-title'
              sx={{
                lineHeight: 1.2,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography variant='body1' color='text.secondary' data-testid='page-header-subtitle'>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {actions && <Box data-testid='page-header-actions'>{actions}</Box>}
      </Stack>
    </Box>
  );
};
