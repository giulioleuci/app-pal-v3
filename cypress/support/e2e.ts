/// <reference types="cypress" />

// Import custom commands
import './commands';

// Disable service workers during E2E tests to avoid caching issues
beforeEach(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
});

// Set viewport to mobile by default (mobile-first approach)
beforeEach(() => {
  cy.viewport(375, 667);
});

// Configure global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on unhandled promise rejections
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Add custom assertions for accessibility
chai.use((chai, utils) => {
  chai.Assertion.addMethod('beAccessible', function () {
    const obj = utils.flag(this, 'object');
    const hasAriaLabel = obj.attr('aria-label') || obj.attr('aria-labelledby');
    this.assert(
      hasAriaLabel,
      'expected element to have aria-label or aria-labelledby',
      'expected element not to have aria-label or aria-labelledby'
    );
  });
});
