import { create } from 'zustand';

import { env } from '@/app/env';

/**
 * Theme mode type
 */
type ThemeMode = 'light' | 'dark';

/**
 * Theme store state interface
 */
interface ThemeStoreState {
  /** Current theme mode */
  mode: ThemeMode;

  /** Primary color for the theme */
  primaryColor: string;

  /** Secondary color for the theme */
  secondaryColor: string;

  /** Sets the theme mode */
  setMode: (mode: ThemeMode) => void;

  /** Sets the primary color */
  setPrimaryColor: (color: string) => void;

  /** Sets the secondary color */
  setSecondaryColor: (color: string) => void;

  /** Toggles between light and dark mode */
  toggleMode: () => void;

  /** Resets theme to default values from env */
  resetToDefaults: () => void;
}

/**
 * Zustand store for managing the application theme state.
 *
 * The initial state is derived from the type-safe env object to ensure
 * consistent default values across the application. This store handles
 * theme mode switching and color customization.
 */
export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  mode: env.VITE_DEFAULT_THEME_MODE,
  primaryColor: env.VITE_DEFAULT_PRIMARY_COLOR,
  secondaryColor: env.VITE_DEFAULT_SECONDARY_COLOR,

  setMode: (mode: ThemeMode) => set({ mode }),

  setPrimaryColor: (color: string) => set({ primaryColor: color }),

  setSecondaryColor: (color: string) => set({ secondaryColor: color }),

  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'light' ? 'dark' : 'light',
    })),

  resetToDefaults: () =>
    set({
      mode: env.VITE_DEFAULT_THEME_MODE,
      primaryColor: env.VITE_DEFAULT_PRIMARY_COLOR,
      secondaryColor: env.VITE_DEFAULT_SECONDARY_COLOR,
    }),
}));
