/**
 * Main application layout component.
 *
 * This "smart" layout component manages the persistent UI shell including:
 * - Top AppBar with branding and navigation
 * - Bottom navigation for mobile-first navigation
 * - Main content area for route rendering
 * - Theme synchronization from active profile data
 */

import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ROUTE_PATHS } from '@/app/routes';
import { useThemeStore } from '@/app/store/themeStore';
import { useActiveProfileData } from '@/features/profile/hooks/useActiveProfileData';
import { Icon } from '@/shared/components/Icon';

/**
 * MainLayout component.
 *
 * Provides the persistent application shell with navigation and theme syncing.
 * Uses the useActiveProfileData hook to sync user theme preferences.
 *
 * @returns The main layout shell with outlet for nested routes
 */
export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setMode } = useThemeStore();
  const { data: profileData, isLoading } = useActiveProfileData();

  // Track current navigation value
  const [navValue, setNavValue] = useState(location.pathname);

  // Sync theme preference from active profile
  useEffect(() => {
    if (profileData?.settings?.theme_preference) {
      const themeMode = profileData.settings.theme_preference;
      if (themeMode === 'light' || themeMode === 'dark') {
        setMode(themeMode);
      }
    }
  }, [profileData?.settings?.theme_preference, setMode]);

  // Update navigation value when route changes
  useEffect(() => {
    setNavValue(location.pathname);
  }, [location.pathname]);

  const handleNavigation = (_event: React.SyntheticEvent, newValue: string) => {
    setNavValue(newValue);
    navigate(newValue);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
      data-testid='main-layout'
    >
      {/* Top AppBar */}
      <AppBar position='static' color='default' elevation={0}>
        <Toolbar>
          <Icon name='FitnessCenter' sx={{ mr: 2 }} />
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            Blueprint Fitness
          </Typography>
          {isLoading && (
            <Typography variant='caption' color='text.secondary'>
              Loading...
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container
        component='main'
        maxWidth='lg'
        sx={{
          flex: 1,
          py: 3,
          pb: 10, // Extra padding for bottom navigation
        }}
      >
        <Outlet />
      </Container>

      {/* Bottom Navigation */}
      <Box
        component='nav'
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
        data-testid='bottom-navigation'
      >
        <BottomNavigation value={navValue} onChange={handleNavigation} showLabels>
          <BottomNavigationAction
            label='Dashboard'
            value={ROUTE_PATHS.dashboard}
            icon={<Icon name='Dashboard' />}
            data-testid='nav-dashboard'
          />
          <BottomNavigationAction
            label='Plans'
            value={ROUTE_PATHS.trainingPlans}
            icon={<Icon name='ListAlt' />}
            data-testid='nav-plans'
          />
          <BottomNavigationAction
            label='Workout'
            value={ROUTE_PATHS.workouts}
            icon={<Icon name='FitnessCenter' />}
            data-testid='nav-workout'
          />
          <BottomNavigationAction
            label='Progress'
            value={ROUTE_PATHS.progress}
            icon={<Icon name='TrendingUp' />}
            data-testid='nav-progress'
          />
          <BottomNavigationAction
            label='Settings'
            value={ROUTE_PATHS.settings}
            icon={<Icon name='Settings' />}
            data-testid='nav-settings'
          />
        </BottomNavigation>
      </Box>
    </Box>
  );
}
