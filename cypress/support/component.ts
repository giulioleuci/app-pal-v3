/// <reference types="cypress" />

// Import custom commands
import './commands';
// Import global styles
import '../../src/index.css';

// Import React and required testing libraries
import { mount } from 'cypress/react18';

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Configure viewport for component tests (mobile-first)
beforeEach(() => {
  cy.viewport(375, 667);
});
