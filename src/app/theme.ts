import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Design system colors mapped to semantic meanings
 */
interface DesignTokens {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

/**
 * Light mode design tokens
 */
const lightTokens: DesignTokens = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

/**
 * Dark mode design tokens
 */
const darkTokens: DesignTokens = {
  primary: '#90caf9',
  secondary: '#f48fb1',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#f44336',
  info: '#29b6f6',
  neutral: {
    50: '#303030',
    100: '#424242',
    200: '#616161',
    300: '#757575',
    400: '#9e9e9e',
    500: '#bdbdbd',
    600: '#e0e0e0',
    700: '#eeeeee',
    800: '#f5f5f5',
    900: '#fafafa',
  },
};

/**
 * Typography scale following Material Design 3 guidelines
 */
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.4,
    textTransform: 'none' as const,
  },
};

/**
 * Shape tokens for consistent border radius
 */
const shape = {
  borderRadius: 8,
};

/**
 * Spacing scale using 8px base unit
 */
const spacing = (factor: number) => `${factor * 8}px`;

/**
 * Creates a comprehensive MUI theme with design tokens
 *
 * @param mode - Light or dark theme mode
 * @param primary_color - Primary brand color (overrides default if provided)
 * @param secondary_color - Secondary accent color (overrides default if provided)
 * @returns Complete MUI theme object
 */
export function createAppTheme(
  mode: 'light' | 'dark' = 'light',
  primary_color?: string,
  secondary_color?: string
): Theme {
  const tokens = mode === 'light' ? lightTokens : darkTokens;

  // Use provided colors or fall back to design token defaults
  const primaryColor = primary_color || tokens.primary;
  const secondaryColor = secondary_color || tokens.secondary;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryColor,
        light: mode === 'light' ? '#42a5f5' : '#bbdefb',
        dark: mode === 'light' ? '#1565c0' : '#1976d2',
      },
      secondary: {
        main: secondaryColor,
        light: mode === 'light' ? '#ff5983' : '#f8bbd9',
        dark: mode === 'light' ? '#9a0036' : '#dc004e',
      },
      success: {
        main: tokens.success,
        light: mode === 'light' ? '#4caf50' : '#81c784',
        dark: mode === 'light' ? '#1b5e20' : '#388e3c',
      },
      warning: {
        main: tokens.warning,
        light: mode === 'light' ? '#ff9800' : '#ffb74d',
        dark: mode === 'light' ? '#e65100' : '#f57c00',
      },
      error: {
        main: tokens.error,
        light: mode === 'light' ? '#ef5350' : '#e57373',
        dark: mode === 'light' ? '#c62828' : '#d32f2f',
      },
      info: {
        main: tokens.info,
        light: mode === 'light' ? '#03a9f4' : '#4fc3f7',
        dark: mode === 'light' ? '#01579b' : '#0277bd',
      },
      background: {
        default: mode === 'light' ? '#ffffff' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? tokens.neutral[900] : tokens.neutral[900],
        secondary: mode === 'light' ? tokens.neutral[600] : tokens.neutral[600],
        disabled: mode === 'light' ? tokens.neutral[400] : tokens.neutral[400],
      },
      divider: mode === 'light' ? tokens.neutral[200] : tokens.neutral[200],
      grey: tokens.neutral,
    },
    typography,
    shape,
    spacing,
    components: {
      // Global component overrides
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            border: '1px solid',
            borderColor: mode === 'light' ? tokens.neutral[200] : tokens.neutral[200],
            borderRadius: shape.borderRadius,
            '&:hover': {
              borderColor: mode === 'light' ? tokens.neutral[300] : tokens.neutral[300],
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: shape.borderRadius / 2,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.borderRadius,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: mode === 'light' ? tokens.neutral[200] : tokens.neutral[200],
          },
        },
      },
    },
  });
}

/**
 * Default theme instance for light mode
 */
export const defaultTheme = createAppTheme('light');

/**
 * Common animation variants for consistent motion design
 */
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
} as const;

/**
 * Z-index scale for consistent layering
 */
export const zIndex = {
  drawer: 1200,
  appBar: 1100,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
} as const;
