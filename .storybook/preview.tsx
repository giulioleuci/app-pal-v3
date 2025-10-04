import 'reflect-metadata';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { Decorator, Preview } from '@storybook/react';
import * as React from 'react';
import { Suspense, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { themes } from '../src/app/themes';
import i18n from '../src/shared/locales';

// Global mocks for Node.js APIs that are not available in browser
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}

if (typeof process === 'undefined') {
  (globalThis as any).process = {
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    platform: 'browser',
    version: 'v16.0.0',
    versions: { node: '16.0.0' },
  };
}

/**
 * Create MUI themes from the central app themes list.
 * Transforms our theme configuration into Material-UI theme objects.
 */
const muiThemes = themes.map((themeConfig) => ({
  ...themeConfig,
  theme: createTheme({
    palette: {
      mode: themeConfig.mode,
      primary: { main: themeConfig.primary },
      secondary: { main: themeConfig.secondary },
      background: {
        default: themeConfig.mode === 'light' ? '#ffffff' : '#000000',
      },
    },
  }),
}));

interface I18nProviderProps {
  locale: string;
  children: React.ReactNode;
}

/**
 * I18n Provider Component that handles language switching.
 */
const I18nProvider = ({ locale, children }: I18nProviderProps) => {
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <Suspense fallback={<div>loading translations...</div>}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Suspense>
  );
};

/**
 * Decorator for react-i18next integration.
 * Switches the language based on the Storybook toolbar selection.
 */
const withI18next: Decorator = (Story, context) => {
  const { locale } = context.globals;

  return (
    <I18nProvider locale={locale}>
      <Story />
    </I18nProvider>
  );
};

/**
 * Storybook preview configuration with global decorators.
 * Provides theming, routing, localization, and MUI providers to all stories.
 */
const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // Global settings for the i18n toolbar
  globals: {
    locale: 'it',
    locales: {
      en: 'English',
      it: 'Italiano',
    },
  },
  decorators: [
    // Order is important. Outer decorators wrap inner decorators.
    (Story) => (
      <MemoryRouter>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Story />
        </LocalizationProvider>
      </MemoryRouter>
    ),
    withI18next,
    withThemeFromJSXProvider({
      themes: muiThemes.reduce((acc, { name, theme }) => ({ ...acc, [name]: theme }), {}),
      defaultTheme: muiThemes[2].name, // Default to "Dark Blue/Red"
      Provider: MuiThemeProvider,
      GlobalStyles: CssBaseline,
    }),
  ],
};

export default preview;
