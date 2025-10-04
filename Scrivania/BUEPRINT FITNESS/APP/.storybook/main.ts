import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { mergeConfig } from 'vite';

/**
 * Storybook configuration with Vite support and path aliases.
 * Enables themes addon for interactive theme switching in the Storybook toolbar.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-themes', // Add the themes addon
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: undefined,
      },
    },
  },
  typescript: {
    reactDocgen: false,
  },
  docs: {
    autodocs: 'tag',
  },
  // Add path alias support for Vite
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@nozbe/watermelondb': path.resolve(__dirname, './mocks/watermelondb.ts'),
          '@nozbe/watermelondb/adapters/sqlite': path.resolve(__dirname, './mocks/watermelondb.ts'),
          '@nozbe/watermelondb/decorators': path.resolve(__dirname, './mocks/watermelondb.ts'),
        },
      },
      define: {
        global: 'globalThis',
        process: {
          env: {},
          nextTick: (fn: Function) => setTimeout(fn, 0),
        },
      },
      optimizeDeps: {
        include: ['@storybook/builder-vite'],
        exclude: ['@nozbe/watermelondb', '@nozbe/watermelondb/adapters/sqlite'],
      },
    });
  },
};

export default config;
