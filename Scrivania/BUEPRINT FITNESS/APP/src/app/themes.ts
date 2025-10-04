/**
 * A centralized list of pre-defined theme combinations for users to select.
 * This is static application data, not environment configuration.
 */
export const themes = [
  { name: 'Light Blue/Red', mode: 'light' as const, primary: '#1976D2', secondary: '#D32F2F' },
  { name: 'Light Green/Orange', mode: 'light' as const, primary: '#388E3C', secondary: '#F57C00' },
  { name: 'Dark Blue/Red', mode: 'dark' as const, primary: '#90CAF9', secondary: '#EF9A9A' },
  { name: 'Dark Green/Orange', mode: 'dark' as const, primary: '#A5D6A7', secondary: '#FFCC80' },
];
