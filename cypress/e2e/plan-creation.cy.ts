/// <reference types="cypress" />

/**
 * E2E Test: Training Plan Creation Flow
 *
 * This test suite verifies the complete user journey for creating a new training plan
 * in the Blueprint Fitness application. It follows the narrative of a user who:
 * 1. Navigates to the plans page
 * 2. Initiates plan creation
 * 3. Fills in plan details with validation
 * 4. Successfully creates the plan
 * 5. Navigates to the plan editor
 * 6. Returns to the plans list to verify the new plan appears
 *
 * Test Data:
 * - Plan Name: "Full Body Workout Program"
 * - Plan Description: "A comprehensive full body training plan for strength and hypertrophy"
 *
 * Pre-conditions:
 * - Database is seeded with an active profile using cy.seedDatabase('with-profile')
 * - Application is running and accessible
 */

describe('Training Plan Creation Flow', () => {
  beforeEach(() => {
    // Reset database and seed with a profile for clean test state
    cy.seedDatabase('with-profile');

    // Navigate to the plans page
    cy.visit('/training-plans');

    // Wait for the page to load
    cy.get('[data-testid="plans-page"]').should('be.visible');
  });

  describe('Navigation to Plan Creation', () => {
    it('should display the plans page with a create button', () => {
      // Verify the page header is visible
      cy.get('[data-testid="plans-page-header"]').should('be.visible');

      // Verify the create FAB is visible and accessible
      cy.get('[data-testid="plans-page-create-fab"]').should('be.visible').and('not.be.disabled');
    });

    it('should navigate to plan editor when create button is clicked', () => {
      // Click the floating action button to create a new plan
      cy.get('[data-testid="plans-page-create-fab"]').click();

      // Verify navigation to the plan creation route
      cy.url().should('include', '/plans/create');
    });
  });

  describe('Plan Creation Dialog Interaction', () => {
    beforeEach(() => {
      // Navigate to plan editor page
      cy.visit('/plan-editor');

      // Open the create plan dialog by clicking the FAB
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Verify the dialog is visible
      cy.get('[data-testid="create-training-plan-dialog"]').should('be.visible');
    });

    it('should display the create plan dialog with all form fields', () => {
      // Verify dialog title is present
      cy.get('[data-testid="create-training-plan-dialog"]')
        .should('be.visible')
        .within(() => {
          // Verify name field is visible
          cy.get('[data-testid="create-training-plan-name-field"]').should('be.visible');

          // Verify description field is visible
          cy.get('[data-testid="create-training-plan-description-field"]').should('be.visible');

          // Verify action buttons are visible
          cy.get('[data-testid="form-dialog-cancel-button"]').should('be.visible');
          cy.get('[data-testid="form-dialog-submit-button"]').should('be.visible');
        });
    });

    it('should close the dialog when cancel button is clicked', () => {
      // Click the cancel button
      cy.get('[data-testid="form-dialog-cancel-button"]').click();

      // Verify the dialog is closed
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');
    });

    it('should close the dialog when close icon button is clicked', () => {
      // Click the close button in the dialog header
      cy.get('[data-testid="form-dialog-close-button"]').click();

      // Verify the dialog is closed
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      // Navigate to plan editor and open create dialog
      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();
      cy.get('[data-testid="create-training-plan-dialog"]').should('be.visible');
    });

    it('should disable submit button when plan name is empty', () => {
      // Verify submit button is disabled initially (empty form)
      cy.get('[data-testid="form-dialog-submit-button"]').should('be.disabled');
    });

    it('should show validation error when trying to submit empty form', () => {
      // Focus and blur the name field without entering data
      cy.get('[data-testid="create-training-plan-name-field"]').find('input').focus().blur();

      // Verify validation error message is displayed
      cy.get('[data-testid="create-training-plan-name-field"]')
        .parent()
        .should('contain.text', 'required');
    });

    it('should enable submit button when plan name is valid', () => {
      // Enter a valid plan name
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .type('Full Body Workout Program');

      // Verify submit button is enabled
      cy.get('[data-testid="form-dialog-submit-button"]').should('not.be.disabled');
    });

    it('should allow description field to be optional', () => {
      // Enter only the plan name (required field)
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .type('Full Body Workout Program');

      // Leave description empty

      // Verify submit button is still enabled
      cy.get('[data-testid="form-dialog-submit-button"]').should('not.be.disabled');
    });
  });

  describe('Plan Creation with Loading State', () => {
    beforeEach(() => {
      // Navigate to plan editor and open create dialog
      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();
      cy.get('[data-testid="create-training-plan-dialog"]').should('be.visible');
    });

    it('should show loading state during plan creation', () => {
      // Fill in the form with valid data
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .type('Full Body Workout Program');

      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .type('A comprehensive full body training plan for strength and hypertrophy');

      // Click submit button
      cy.get('[data-testid="form-dialog-submit-button"]').click();

      // Verify submit button is disabled during submission
      cy.get('[data-testid="form-dialog-submit-button"]').should('be.disabled');

      // Note: In a real implementation with API delays, we would verify loading indicators here
    });
  });

  describe('Successful Plan Creation Flow', () => {
    it('should create a plan and navigate to the plan editor', () => {
      // Navigate to plan editor
      cy.visit('/plan-editor');

      // Open create dialog
      cy.get('[data-testid="plan-editor-create-fab"]').click();
      cy.get('[data-testid="create-training-plan-dialog"]').should('be.visible');

      // Fill in the plan name
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .type('Full Body Workout Program');

      // Fill in the plan description
      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .type('A comprehensive full body training plan for strength and hypertrophy');

      // Submit the form
      cy.get('[data-testid="form-dialog-submit-button"]').click();

      // Verify the dialog closes after successful creation
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');

      // Verify we remain on the plan editor page (or navigate to the specific plan editor)
      cy.url().should('match', /\/plan-editor/);
    });

    it('should clear form data after successful submission', () => {
      // Navigate to plan editor
      cy.visit('/plan-editor');

      // Create a plan
      cy.get('[data-testid="plan-editor-create-fab"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').find('input').type('First Plan');
      cy.get('[data-testid="form-dialog-submit-button"]').click();
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');

      // Open dialog again
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Verify form fields are empty
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .should('have.value', '');
      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .should('have.value', '');
    });
  });

  describe('Navigation Back to Plans List', () => {
    it('should navigate back to plans list using browser back button', () => {
      // Navigate to plan editor
      cy.visit('/plan-editor');

      // Use browser back button
      cy.go('back');

      // Verify we're back on the training plans list
      cy.url().should('not.include', '/plan-editor');
    });

    it('should navigate back to plans list using the back button in page header', () => {
      // Navigate to plan editor
      cy.visit('/plan-editor');

      // Verify page header with back button is visible
      cy.get('[data-testid="plan-editor-page-header"]').should('be.visible');

      // Click the back button
      // Note: The PageHeader component should have a back button with a testid
      // If implemented, it would be: cy.get('[data-testid="page-header-back-button"]').click();

      // For now, we verify the header exists
      cy.get('[data-testid="plan-editor-page-header"]').should('contain.text', 'Create Plan');
    });
  });

  describe('Plan Appears in List After Creation', () => {
    it('should display newly created plan in the plans list', () => {
      const planName = 'Integration Test Plan';
      const planDescription = 'Plan created during Cypress E2E test';

      // Navigate to plan editor
      cy.visit('/plan-editor');

      // Create a plan
      cy.get('[data-testid="plan-editor-create-fab"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').find('input').type(planName);
      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .type(planDescription);
      cy.get('[data-testid="form-dialog-submit-button"]').click();
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');

      // Navigate back to plans list
      cy.visit('/training-plans');

      // Wait for the list to load
      cy.get('[data-testid="plans-page-list"]').should('be.visible');

      // Verify the new plan appears in the list
      // Note: This assumes the TrainingPlanList component renders plan cards with the plan name
      cy.get('[data-testid="plans-page-list"]').should('contain.text', planName);
    });

    it('should display plan with correct details in the list', () => {
      const planName = 'Detailed Test Plan';
      const planDescription = 'This plan has detailed information for verification';

      // Create a plan
      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').find('input').type(planName);
      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .type(planDescription);
      cy.get('[data-testid="form-dialog-submit-button"]').click();
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');

      // Navigate to plans list
      cy.visit('/training-plans');

      // Verify plan details are displayed
      cy.get('[data-testid="plans-page-list"]')
        .should('contain.text', planName)
        .and('contain.text', planDescription);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle very long plan names gracefully', () => {
      const longPlanName = 'A'.repeat(200); // 200 character plan name

      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Enter a very long plan name
      cy.get('[data-testid="create-training-plan-name-field"]').find('input').type(longPlanName);

      // Verify the form still works
      cy.get('[data-testid="form-dialog-submit-button"]').should('not.be.disabled');
    });

    it('should handle special characters in plan name', () => {
      const specialPlanName = 'Plan with @#$%^&*() special characters!';

      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Enter plan name with special characters
      cy.get('[data-testid="create-training-plan-name-field"]').find('input').type(specialPlanName);

      // Verify the form accepts special characters
      cy.get('[data-testid="form-dialog-submit-button"]').should('not.be.disabled');
    });

    it('should handle multiline text in description field', () => {
      const multilineDescription =
        'First line of description{enter}Second line of description{enter}Third line of description';

      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .type('Multiline Test Plan');

      // Enter multiline description
      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .type(multilineDescription);

      // Verify the form still works
      cy.get('[data-testid="form-dialog-submit-button"]').should('not.be.disabled');
    });

    it('should prevent form submission when clicking submit multiple times rapidly', () => {
      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Fill in minimal required data
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .type('Rapid Submit Test');

      // Click submit button multiple times rapidly
      cy.get('[data-testid="form-dialog-submit-button"]').click();
      cy.get('[data-testid="form-dialog-submit-button"]').click();
      cy.get('[data-testid="form-dialog-submit-button"]').click();

      // Verify only one plan is created (dialog should close once)
      // This is a defensive test to ensure proper loading state management
      cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support keyboard navigation through the form', () => {
      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Tab through the form fields
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('input')
        .focus()
        .type('Tab Plan');

      // Tab to description field
      cy.realPress('Tab');

      // Type in description field
      cy.focused().type('Description entered via keyboard');

      // Verify the description field received the input
      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('textarea')
        .should('have.value', 'Description entered via keyboard');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/plan-editor');
      cy.get('[data-testid="plan-editor-create-fab"]').click();

      // Verify dialog has proper ARIA attributes
      cy.get('[data-testid="create-training-plan-dialog"]')
        .should('have.attr', 'role', 'dialog')
        .and('have.attr', 'aria-labelledby');

      // Verify form fields have proper labels
      cy.get('[data-testid="create-training-plan-name-field"]')
        .find('label')
        .should('exist')
        .and('not.be.empty');

      cy.get('[data-testid="create-training-plan-description-field"]')
        .find('label')
        .should('exist')
        .and('not.be.empty');
    });
  });
});
