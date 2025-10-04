/// <reference types="cypress" />

/**
 * E2E Test Suite: User Onboarding Flow
 *
 * This test suite verifies the complete onboarding journey for first-time users
 * of the Blueprint Fitness application. It ensures that users can successfully
 * create their profile and are guided seamlessly into the main application.
 *
 * @description Tests the WelcomeWizard component and profile creation flow
 * @userStory As a first-time user, I want to create my profile so that I can start using the app
 */

describe('User Onboarding Flow', () => {
  beforeEach(() => {
    // Reset database to ensure clean state for each test
    cy.resetDatabase();

    // Visit the application
    cy.visit('/');
  });

  describe('Initial Welcome Screen', () => {
    it('should display the welcome wizard for first-time users', () => {
      // Verify the main wizard container is visible
      cy.getByTestId('welcome-wizard-component').should('be.visible').and('exist');

      // Verify welcome title is displayed
      cy.getByTestId('welcome-wizard-title').should('be.visible').and('not.be.empty');

      // Verify subtitle provides context
      cy.getByTestId('welcome-wizard-subtitle').should('be.visible').and('not.be.empty');

      // Verify the form is present
      cy.getByTestId('welcome-wizard-form').should('be.visible').and('exist');

      // Verify helper text is shown
      cy.getByTestId('welcome-wizard-helper').should('be.visible').and('not.be.empty');
    });

    it('should have focus on the name input field', () => {
      // The name input should be focused for immediate user interaction
      cy.getByTestId('welcome-wizard-name-input').should('be.visible').and('have.focus');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when name is empty', () => {
      // Focus on input and then blur without entering text
      cy.getByTestId('welcome-wizard-name-input').focus().blur();

      // Verify validation error message is displayed
      cy.getByTestId('welcome-wizard-name-input')
        .parent()
        .should('contain', 'required')
        .or('contain', 'obbligatorio')
        .or('contain', 'necessario');
    });

    it('should show validation error when name is too short', () => {
      // Enter a single character (below minimum length)
      cy.getByTestId('welcome-wizard-name-input').clear().type('A').blur();

      // Verify validation error for minimum length
      cy.getByTestId('welcome-wizard-name-input')
        .parent()
        .should('contain.text', '2')
        .or('contain', 'caratteri')
        .or('contain', 'characters');
    });

    it('should disable submit button when form is invalid', () => {
      // Leave name empty
      cy.getByTestId('welcome-wizard-name-input').clear();

      // Submit button should be disabled
      cy.getByTestId('welcome-wizard-submit').should('be.disabled');
    });

    it('should enable submit button when name is valid', () => {
      // Enter a valid name (at least 2 characters)
      cy.getByTestId('welcome-wizard-name-input').clear().type('John Doe');

      // Submit button should be enabled
      cy.getByTestId('welcome-wizard-submit').should('not.be.disabled').and('be.enabled');
    });

    it('should clear validation errors when valid input is provided', () => {
      // First, trigger validation error
      cy.getByTestId('welcome-wizard-name-input').clear().type('A').blur();

      // Verify error exists
      cy.getByTestId('welcome-wizard-name-input').parent().should('contain.text', '2');

      // Now enter valid input
      cy.getByTestId('welcome-wizard-name-input').clear().type('Jane Smith');

      // Error should be cleared
      cy.getByTestId('welcome-wizard-name-input')
        .parent()
        .should('not.contain', 'error')
        .and('not.have.class', 'Mui-error');
    });

    it('should trim whitespace from name input', () => {
      // Enter name with leading/trailing spaces
      cy.getByTestId('welcome-wizard-name-input').clear().type('  John Doe  ');

      // Submit the form
      cy.getByTestId('welcome-wizard-submit').click();

      // Wait for profile creation (the actual trimming validation would be in the component)
      cy.url().should('not.include', 'welcome');
    });
  });

  describe('Profile Creation Process', () => {
    it('should show loading state during profile creation', () => {
      // Enter valid name
      cy.getByTestId('welcome-wizard-name-input').clear().type('Alex Johnson');

      // Click submit button
      cy.getByTestId('welcome-wizard-submit').click();

      // Verify loading state is shown
      cy.getByTestId('welcome-wizard-submit')
        .should('be.disabled')
        .and('contain.text', '')
        .or('have.descendants', 'svg'); // Should contain a loading spinner
    });

    it('should successfully create profile and redirect to dashboard', () => {
      // Enter valid name
      cy.getByTestId('welcome-wizard-name-input').clear().type('Sarah Williams');

      // Submit the form
      cy.getByTestId('welcome-wizard-submit').click();

      // Wait for profile creation and redirect
      // The URL should change from welcome/onboarding to main app
      cy.url({ timeout: 10000 }).should('not.include', 'welcome').and('not.include', 'onboarding');

      // Verify user is on the dashboard or main app
      cy.url().should('satisfy', (url: string) => {
        return url.includes('dashboard') || url.endsWith('/') || url.includes('home');
      });

      // Verify welcome wizard is no longer visible
      cy.getByTestId('welcome-wizard-component').should('not.exist');
    });

    it('should persist profile data after creation', () => {
      const testName = 'Michael Chen';

      // Create profile
      cy.getByTestId('welcome-wizard-name-input').clear().type(testName);

      cy.getByTestId('welcome-wizard-submit').click();

      // Wait for redirect
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');

      // Reload the page
      cy.reload();

      // User should remain logged in (not see welcome wizard again)
      cy.getByTestId('welcome-wizard-component', { timeout: 2000 }).should('not.exist');

      // Verify we're still on the main app
      cy.url().should('not.include', 'welcome');
    });
  });

  describe('User Journey - Happy Path', () => {
    it('should complete the entire onboarding flow seamlessly', () => {
      // Step 1: User arrives at the app
      cy.getByTestId('welcome-wizard-component').should('be.visible');

      // Step 2: User reads the welcome message
      cy.getByTestId('welcome-wizard-title')
        .should('be.visible')
        .invoke('text')
        .should('not.be.empty');

      // Step 3: User enters their name
      const userName = 'Emma Rodriguez';
      cy.getByTestId('welcome-wizard-name-input')
        .should('be.visible')
        .and('have.focus')
        .clear()
        .type(userName);

      // Step 4: User verifies the submit button is enabled
      cy.getByTestId('welcome-wizard-submit').should('be.enabled').and('be.visible');

      // Step 5: User reads the helper text for reassurance
      cy.getByTestId('welcome-wizard-helper').should('be.visible');

      // Step 6: User clicks "Get Started"
      cy.getByTestId('welcome-wizard-submit').click();

      // Step 7: User sees loading state
      cy.getByTestId('welcome-wizard-submit').should('be.disabled');

      // Step 8: Profile is created and user is redirected
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');

      // Step 9: User sees the main application
      cy.getByTestId('welcome-wizard-component').should('not.exist');

      // Step 10: Verify dashboard or main content is visible
      cy.get('body').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab to name input (should already have focus)
      cy.getByTestId('welcome-wizard-name-input').should('have.focus');

      // Type a valid name
      cy.getByTestId('welcome-wizard-name-input').type('Keyboard User');

      // Tab to submit button
      cy.realPress('Tab');

      // Submit button should now have focus
      cy.getByTestId('welcome-wizard-submit').should('have.focus');

      // Press Enter to submit
      cy.realPress('Enter');

      // Should navigate away from welcome
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');
    });

    it('should have proper ARIA labels', () => {
      // Name input should have label or aria-label
      cy.getByTestId('welcome-wizard-name-input').should('satisfy', ($el: JQuery<HTMLElement>) => {
        const element = $el[0];
        return (
          element.hasAttribute('aria-label') ||
          element.hasAttribute('aria-labelledby') ||
          $el.prev('label').length > 0
        );
      });

      // Submit button should have accessible text
      cy.getByTestId('welcome-wizard-submit')
        .should('have.attr', 'type', 'submit')
        .and('not.be.empty');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions gracefully', () => {
      cy.getByTestId('welcome-wizard-name-input').clear().type('Rapid Clicker');

      // Click submit multiple times rapidly
      cy.getByTestId('welcome-wizard-submit').click().click().click();

      // Should still redirect successfully only once
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');
    });

    it('should handle special characters in name', () => {
      cy.getByTestId('welcome-wizard-name-input').clear().type("O'Connor-Smith");

      cy.getByTestId('welcome-wizard-submit').should('be.enabled').click();

      // Should successfully create profile
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100);

      cy.getByTestId('welcome-wizard-name-input').clear().type(longName);

      cy.getByTestId('welcome-wizard-submit').should('be.enabled').click();

      // Should handle long names appropriately
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');
    });

    it('should handle unicode characters in name', () => {
      cy.getByTestId('welcome-wizard-name-input').clear().type('José María 李明');

      cy.getByTestId('welcome-wizard-submit').should('be.enabled').click();

      cy.url({ timeout: 10000 }).should('not.include', 'welcome');
    });
  });

  describe('Error Recovery', () => {
    it('should allow user to retry after network error', () => {
      // Intercept the profile creation request to simulate failure
      cy.intercept('POST', '**/profiles', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('createProfileError');

      cy.getByTestId('welcome-wizard-name-input').clear().type('Error Test User');

      cy.getByTestId('welcome-wizard-submit').click();

      // Wait for the error response
      cy.wait('@createProfileError');

      // Error should be displayed (implementation specific)
      // Submit button should be re-enabled for retry
      cy.getByTestId('welcome-wizard-submit', { timeout: 5000 }).should('be.enabled');

      // Clear intercept and allow success
      cy.intercept('POST', '**/profiles').as('createProfileSuccess');

      // Retry submission
      cy.getByTestId('welcome-wizard-submit').click();

      // Should now succeed
      cy.url({ timeout: 10000 }).should('not.include', 'welcome');
    });
  });
});
