import CssBaseline from '@mui/material/CssBaseline';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { AppServicesProvider } from '@/app/providers/AppServicesProvider';
import { SnackbarProvider } from '@/app/providers/SnackbarProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import i18n from '@/shared/locales';

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

const renderWithProviders = (ui: ReactElement, renderOptions: CustomRenderOptions = {}) => {
  const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={testQueryClient}>
      <AppServicesProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SnackbarProvider>
            <ThemeProvider>
              <CssBaseline />
              <I18nextProvider i18n={i18n}>
                <MemoryRouter>{children}</MemoryRouter>
              </I18nextProvider>
            </ThemeProvider>
          </SnackbarProvider>
        </LocalizationProvider>
      </AppServicesProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export commonly used functions from @testing-library/react
export {
  act,
  cleanup,
  fireEvent,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

// Export our custom render function
export { renderWithProviders as render };
