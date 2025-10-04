import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { usePageTitle } from '@/app/hooks/usePageTitle';
import { useActiveProfileId } from '@/shared/hooks/useActiveProfileId';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
}));

const WelcomeBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
}));

/**
 * Simplified dashboard page - temporary welcome message
 * (Dashboard features disabled for performance testing)
 */
export const DashboardPage = () => {
  const { t } = useTranslation();
  const activeProfileId = useActiveProfileId();

  // Set page title
  usePageTitle('dashboard', t('pages.dashboard.title'));

  return (
    <StyledContainer maxWidth='lg' data-testid='dashboard-page'>
      <WelcomeBox elevation={2}>
        <Typography variant='h3' gutterBottom>
          Welcome to Blueprint Fitness
        </Typography>
        <Typography variant='h6' color='text.secondary' sx={{ mt: 2 }}>
          Your fitness journey starts here
        </Typography>
        {activeProfileId && (
          <Typography variant='body1' sx={{ mt: 4 }} color='text.secondary'>
            Profile ID: {activeProfileId}
          </Typography>
        )}
        <Box sx={{ mt: 4 }}>
          <Typography variant='body2' color='text.secondary'>
            Dashboard features temporarily disabled for testing
          </Typography>
        </Box>
      </WelcomeBox>
    </StyledContainer>
  );
};
