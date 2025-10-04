/// <reference types="cypress" />

/**
 * Custom Cypress commands for Blueprint Fitness E2E tests
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to simulate user login
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to reset the database to a clean state
       * @example cy.resetDatabase()
       */
      resetDatabase(): Chainable<void>;

      /**
       * Custom command to seed the database with test data
       * @example cy.seedDatabase('onboarding')
       */
      seedDatabase(scenario: string): Chainable<void>;
    }
  }
}

// Get element by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  cy.getByTestId('email-input').type(email);
  cy.getByTestId('password-input').type(password);
  cy.getByTestId('login-button').click();
  cy.url().should('not.include', '/login');
});

// Reset database
Cypress.Commands.add('resetDatabase', () => {
  cy.log('Resetting database to clean state');
  // Use cy.window() to access the browser's IndexedDB in the test context
  cy.window().then((win) => {
    win.indexedDB.deleteDatabase('blueprint-fitness');
  });
});

// Seed database with test data
Cypress.Commands.add('seedDatabase', (scenario: string) => {
  cy.log(`Seeding database with scenario: ${scenario}`);
  // This would typically call a backend endpoint or populate IndexedDB
  cy.task('seedDatabase', { scenario });
});

export {};
