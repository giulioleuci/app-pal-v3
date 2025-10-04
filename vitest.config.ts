import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
    testTimeout: 30000, // Extended timeout for architecture tests that analyze the codebase
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});