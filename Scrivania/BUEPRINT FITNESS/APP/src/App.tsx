/**
 * Root application component.
 *
 * This component is responsible for setting up all global context providers
 * in the correct order to ensure proper dependency flow:
 *
 * 1. QueryClientProvider - Provides React Query client for data fetching
 * 2. AppServicesProvider - Provides application services from DI container
 * 3. LocalizationProvider - Provides MUI date picker localization
 * 4. SnackbarProvider - Provides global notification system
 * 5. ThemeProvider - Provides MUI theme with user preferences
 * 6. CssBaseline - Normalizes browser styles
 * 7. BrowserRouter - Provides routing context
 * 8. AppRoutes - Renders the application routes
 */

import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from './app/components/AppRoutes';
import { AppServicesProvider } from './app/providers/AppServicesProvider';
import { SnackbarProvider } from './app/providers/SnackbarProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';

/**
 * App component.
 *
 * Sets up the provider hierarchy and renders the application routes.
 */
function App() {
  // Create React Query client with default configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppServicesProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <SnackbarProvider>
            <ThemeProvider>
              <CssBaseline />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ThemeProvider>
          </SnackbarProvider>
        </LocalizationProvider>
      </AppServicesProvider>
    </QueryClientProvider>
  );
}

export default App;
