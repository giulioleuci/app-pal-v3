import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Register task to seed the database with test data
      on('task', {
        seedDatabase({ scenario }: { scenario: string }) {
          // In a real implementation, this would populate IndexedDB
          // For now, we'll just log the scenario and return null
          // Cypress tasks must return a value or null
          console.log(`[Cypress Task] Seeding database with scenario: ${scenario}`);
          return null;
        },
      });
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 375,
    viewportHeight: 667,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});