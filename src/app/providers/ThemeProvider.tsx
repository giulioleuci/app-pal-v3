import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import React from 'react';

import { useThemeStore } from '@/app/store/themeStore';
import { createAppTheme } from '@/app/theme';

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * React provider that integrates Zustand theme state with MUI's ThemeProvider.
 *
 * This provider reads from the useThemeStore and creates a dynamic MUI theme
 * based on the current theme mode and color preferences. It automatically
 * updates the theme when the store state changes.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, primaryColor, secondaryColor } = useThemeStore();

  const theme = React.useMemo(() => {
    const baseTheme = createAppTheme(mode, primaryColor, secondaryColor);

    // Extend the base theme with custom scrollbar styles
    return {
      ...baseTheme,
      components: {
        ...baseTheme.components,
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f5f5f5',
              '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f5f5f5',
              },
              '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                borderRadius: 8,
                backgroundColor: mode === 'dark' ? '#6b6b6b' : '#959595',
                minHeight: 24,
                border: `3px solid ${mode === 'dark' ? '#2b2b2b' : '#f5f5f5'}`,
              },
              '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
                backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
              },
              '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
                backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
              },
              '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
                backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
              },
            },
          },
        },
      },
    };
  }, [mode, primaryColor, secondaryColor]);

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
