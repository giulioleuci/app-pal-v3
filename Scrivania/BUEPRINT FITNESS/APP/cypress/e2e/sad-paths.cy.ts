/**
 * Cypress E2E Tests - Sad Paths and Error Scenarios
 *
 * This test suite covers error handling, validation, and edge cases in the Blueprint Fitness app.
 * Tests include form validation errors, cascading deletes, concurrent operations, navigation edge cases,
 * and data consistency checks.
 *
 * @see {@link /cypress/support/commands.ts} for custom Cypress commands
 */

describe('Sad Paths and Error Scenarios', () => {
  beforeEach(() => {
    // Reset database to clean state before each test
    cy.seedDatabase();
  });

  describe('Form Validation Errors', () => {
    describe('Profile Creation Validation', () => {
      beforeEach(() => {
        cy.visit('/');
        // Open the create profile dialog
        cy.get('[data-testid="profile-selector-add-button"]').click();
      });

      it('should show error when profile name is empty', () => {
        // Verify dialog is open
        cy.get('[data-testid="create-profile-dialog"]').should('be.visible');

        // Try to submit with empty name
        cy.get('[data-testid="create-profile-dialog-name-input"]').clear();

        // Submit button should be disabled
        cy.get('[data-testid="create-profile-dialog-create"]').should('be.disabled');

        // Click the input to trigger validation
        cy.get('[data-testid="create-profile-dialog-name-input"]').focus().blur();

        // Verify error message is displayed
        cy.get('[data-testid="create-profile-dialog-name-input"]')
          .parent()
          .should('contain', 'required');
      });

      it('should show error when profile name is too short', () => {
        cy.get('[data-testid="create-profile-dialog"]').should('be.visible');

        // Enter a name that's too short (less than 2 characters)
        cy.get('[data-testid="create-profile-dialog-name-input"]').clear().type('A');

        // Submit button should be disabled
        cy.get('[data-testid="create-profile-dialog-create"]').should('be.disabled');

        // Verify error message about minimum length
        cy.get('[data-testid="create-profile-dialog-name-input"]')
          .parent()
          .should('contain', 'minLength');
      });

      it('should show error when profile name is too long', () => {
        cy.get('[data-testid="create-profile-dialog"]').should('be.visible');

        // Enter a name that's too long (more than 50 characters)
        const longName = 'A'.repeat(51);
        cy.get('[data-testid="create-profile-dialog-name-input"]').clear().type(longName);

        // Submit button should be disabled
        cy.get('[data-testid="create-profile-dialog-create"]').should('be.disabled');

        // Verify error message about maximum length
        cy.get('[data-testid="create-profile-dialog-name-input"]')
          .parent()
          .should('contain', 'maxLength');
      });

      it('should recover after fixing validation errors', () => {
        cy.get('[data-testid="create-profile-dialog"]').should('be.visible');

        // Enter invalid name (too short)
        cy.get('[data-testid="create-profile-dialog-name-input"]').clear().type('A');

        // Verify submit is disabled
        cy.get('[data-testid="create-profile-dialog-create"]').should('be.disabled');

        // Fix the name by adding more characters
        cy.get('[data-testid="create-profile-dialog-name-input"]').clear().type('John Doe');

        // Submit button should now be enabled
        cy.get('[data-testid="create-profile-dialog-create"]').should('not.be.disabled');

        // Submit the form successfully
        cy.get('[data-testid="create-profile-dialog-create"]').click();

        // Dialog should close
        cy.get('[data-testid="create-profile-dialog"]').should('not.exist');
      });
    });

    describe('Training Plan Creation Validation', () => {
      beforeEach(() => {
        // Seed database with a profile
        cy.seedDatabase();
        cy.visit('/training-plans');

        // Open create training plan dialog
        cy.get('[data-testid="create-training-plan-button"]').click();
      });

      it('should prevent submission with empty plan name', () => {
        cy.get('[data-testid="create-training-plan-dialog"]').should('be.visible');

        // Clear the name field
        cy.get('[data-testid="create-training-plan-name-field"]').clear();

        // Submit button should be disabled
        cy.get('[data-testid="form-dialog-submit"]').should('be.disabled');

        // Verify error message
        cy.get('[data-testid="create-training-plan-name-field"]')
          .parent()
          .should('contain.text', 'required');
      });

      it('should allow recovery from validation errors', () => {
        cy.get('[data-testid="create-training-plan-dialog"]').should('be.visible');

        // Clear the name field to trigger error
        cy.get('[data-testid="create-training-plan-name-field"]').clear().blur();

        // Verify submit is disabled
        cy.get('[data-testid="form-dialog-submit"]').should('be.disabled');

        // Fix by entering a valid name
        cy.get('[data-testid="create-training-plan-name-field"]').type('My Training Plan');

        // Submit should now be enabled
        cy.get('[data-testid="form-dialog-submit"]').should('not.be.disabled');

        // Successfully submit
        cy.get('[data-testid="form-dialog-submit"]').click();

        // Dialog should close
        cy.get('[data-testid="create-training-plan-dialog"]').should('not.exist');

        // Verify plan was created
        cy.get('[data-testid="training-plan-card"]').should('contain', 'My Training Plan');
      });
    });

    describe('Exercise Creation Validation', () => {
      beforeEach(() => {
        cy.seedDatabase();
        cy.visit('/exercises');

        // Assuming there's a button to open create exercise dialog
        cy.get('[data-testid="create-exercise-button"]').click();
      });

      it('should validate required fields for exercise creation', () => {
        cy.get('[data-testid="exercise-form-dialog"]').should('be.visible');

        // Try to submit without filling required fields
        cy.get('[data-testid="exercise-form-submit"]').should('be.disabled');

        // Enter name but not other required fields
        cy.get('[data-testid="exercise-form-name-input"]').type('Bench Press');

        // If category is required, submit should still be disabled
        cy.get('[data-testid="exercise-form-submit"]').should('be.disabled');

        // Fill all required fields
        cy.get('[data-testid="exercise-form-category-select"]').click();
        cy.get('[data-value="strength"]').click();

        // Now submit should be enabled
        cy.get('[data-testid="exercise-form-submit"]').should('not.be.disabled');
      });

      it('should display multiple validation errors simultaneously', () => {
        cy.get('[data-testid="exercise-form-dialog"]').should('be.visible');

        // Focus and blur multiple fields without filling them
        cy.get('[data-testid="exercise-form-name-input"]').focus().blur();
        cy.get('[data-testid="exercise-form-category-select"]').focus().blur();

        // Multiple error messages should be visible
        cy.get('.MuiFormHelperText-root.Mui-error').should('have.length.at.least', 2);

        // Submit button should remain disabled
        cy.get('[data-testid="exercise-form-submit"]').should('be.disabled');
      });
    });
  });

  describe('Cascading Deletes', () => {
    beforeEach(() => {
      cy.seedDatabase();
    });

    it('should warn about cascading deletes when deleting a training plan with sessions', () => {
      // Navigate to training plans
      cy.visit('/training-plans');

      // Create a training plan
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Full Body Program');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Open the newly created plan
      cy.get('[data-testid="training-plan-card"]').first().click();

      // Add a session to the plan
      cy.get('[data-testid="add-session-button"]').click();
      cy.get('[data-testid="session-name-input"]').type('Day 1 - Upper Body');
      cy.get('[data-testid="session-form-submit"]').click();

      // Go back to training plans list
      cy.go('back');

      // Delete the plan
      cy.get('[data-testid="training-plan-card"]')
        .first()
        .find('[data-testid="training-plan-delete-button"]')
        .click();

      // Confirmation dialog should appear with warning about cascading deletes
      cy.get('[data-testid="confirm-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-dialog-message"]')
        .should('contain.text', 'session')
        .and('contain.text', 'delete');

      // Verify cancel button works
      cy.get('[data-testid="confirm-dialog-cancel"]').click();
      cy.get('[data-testid="confirm-dialog"]').should('not.exist');

      // Plan should still exist
      cy.get('[data-testid="training-plan-card"]').should('contain', 'Full Body Program');

      // Try deleting again and confirm
      cy.get('[data-testid="training-plan-card"]')
        .first()
        .find('[data-testid="training-plan-delete-button"]')
        .click();

      cy.get('[data-testid="confirm-dialog-confirm"]').click();

      // Plan should be deleted
      cy.get('[data-testid="training-plan-card"]').should('not.exist');
    });

    it('should delete plan and sessions but NOT the exercises themselves', () => {
      cy.visit('/training-plans');

      // Create a plan with a session that includes exercises
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Test Plan');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Open the plan and add a session with exercises
      cy.get('[data-testid="training-plan-card"]').first().click();
      cy.get('[data-testid="add-session-button"]').click();
      cy.get('[data-testid="session-name-input"]').type('Session 1');
      cy.get('[data-testid="session-form-submit"]').click();

      // Add an exercise to the session
      cy.get('[data-testid="add-exercise-to-session-button"]').click();
      cy.get('[data-testid="exercise-picker-dialog"]').should('be.visible');
      cy.get('[data-testid="exercise-item"]').first().click();
      cy.get('[data-testid="exercise-picker-confirm"]').click();

      // Note the exercise name for later verification
      cy.get('[data-testid="session-exercise-item"]').first().invoke('text').as('exerciseName');

      // Go back and delete the plan
      cy.go('back');
      cy.get('[data-testid="training-plan-card"]')
        .first()
        .find('[data-testid="training-plan-delete-button"]')
        .click();
      cy.get('[data-testid="confirm-dialog-confirm"]').click();

      // Navigate to exercises library
      cy.visit('/exercises');

      // Verify the exercise still exists
      cy.get('@exerciseName').then((exerciseName) => {
        cy.get('[data-testid="exercise-card"]').should('contain', exerciseName);
      });
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      cy.seedDatabase();
    });

    it('should prevent deletion of active profile', () => {
      cy.visit('/');

      // Ensure we have an active profile
      cy.get('[data-testid="profile-selector"]').should('be.visible');

      // Open profile management
      cy.get('[data-testid="profile-selector"]').click();
      cy.get('[data-testid="manage-profiles-button"]').click();

      // Try to delete the active profile
      cy.get('[data-testid="profile-item-active"]')
        .find('[data-testid="profile-delete-button"]')
        .should('be.disabled')
        .or('not.exist');

      // Alternatively, if delete button is visible but shows error on click
      cy.get('[data-testid="profile-item-active"]')
        .find('[data-testid="profile-delete-button"]')
        .then(($button) => {
          if ($button.length && !$button.prop('disabled')) {
            $button.click();

            // Should show error message or warning
            cy.get('[data-testid="error-display-alert"]')
              .or('[data-testid="snackbar-notification"]')
              .should('be.visible')
              .and('contain.text', 'active');
          }
        });
    });

    it('should prevent deletion of the last profile', () => {
      // Start with only one profile
      cy.visit('/');

      // Open profile management
      cy.get('[data-testid="profile-selector"]').click();
      cy.get('[data-testid="manage-profiles-button"]').click();

      // Verify we have only one profile
      cy.get('[data-testid="profile-item"]').should('have.length', 1);

      // Try to delete the only profile
      cy.get('[data-testid="profile-item"]')
        .first()
        .find('[data-testid="profile-delete-button"]')
        .should('be.disabled')
        .or('not.exist');
    });

    it('should handle simultaneous state updates gracefully', () => {
      cy.visit('/training-plans');

      // Create a plan
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Concurrent Test Plan');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Open the plan
      cy.get('[data-testid="training-plan-card"]').first().click();

      // Rapidly add multiple sessions
      for (let i = 1; i <= 3; i++) {
        cy.get('[data-testid="add-session-button"]').click();
        cy.get('[data-testid="session-name-input"]').type(`Session ${i}`);
        cy.get('[data-testid="session-form-submit"]').click();
        // Small wait to allow state to update
        cy.wait(100);
      }

      // Verify all sessions were created
      cy.get('[data-testid="session-card"]').should('have.length', 3);

      // Verify sessions are in correct order
      cy.get('[data-testid="session-card"]').eq(0).should('contain', 'Session 1');
      cy.get('[data-testid="session-card"]').eq(1).should('contain', 'Session 2');
      cy.get('[data-testid="session-card"]').eq(2).should('contain', 'Session 3');
    });
  });

  describe('Navigation Edge Cases', () => {
    beforeEach(() => {
      cy.seedDatabase();
    });

    it('should show error state when navigating to non-existent plan', () => {
      // Navigate to a plan ID that doesn't exist
      cy.visit('/training-plans/non-existent-plan-id-12345');

      // Should display error state
      cy.get('[data-testid="error-display-component"]')
        .or('[data-testid="error-display-alert"]')
        .should('be.visible');

      // Error message should indicate the resource was not found
      cy.get('[data-testid="error-display-message"]')
        .should('be.visible')
        .and('contain.text', 'not found');

      // Should have an option to go back or navigate away
      cy.get('[data-testid="error-display-retry"]')
        .or('[data-testid="back-to-plans-button"]')
        .should('be.visible');
    });

    it('should show error state when navigating to non-existent exercise', () => {
      // Navigate to an exercise ID that doesn't exist
      cy.visit('/exercises/non-existent-exercise-id-67890');

      // Should display error state
      cy.get('[data-testid="error-display-component"]')
        .or('[data-testid="error-display-alert"]')
        .should('be.visible');

      // Error message should be helpful
      cy.get('[data-testid="error-display-message"]')
        .should('be.visible')
        .and('contain.text', 'not found');
    });

    it('should handle invalid route parameters gracefully', () => {
      // Navigate to a route with invalid parameters
      cy.visit('/training-plans/invalid-id/sessions/not-a-number', {
        failOnStatusCode: false,
      });

      // Should either redirect to error page or show error state
      cy.get('[data-testid="error-display-component"]')
        .or('[data-testid="error-display-alert"]')
        .should('be.visible');
    });

    it('should preserve navigation history and allow back button', () => {
      // Navigate through multiple pages
      cy.visit('/');
      cy.visit('/training-plans');
      cy.visit('/exercises');

      // Go back
      cy.go('back');
      cy.url().should('include', '/training-plans');

      // Go back again
      cy.go('back');
      cy.url().should('include', '/');
    });

    it('should handle rapid navigation changes', () => {
      cy.visit('/');

      // Rapidly navigate to different routes
      cy.visit('/training-plans');
      cy.visit('/exercises');
      cy.visit('/workouts');
      cy.visit('/profile');

      // Should end up on the last route without errors
      cy.url().should('include', '/profile');

      // No error display should be visible
      cy.get('[data-testid="error-display-component"]').should('not.exist');
    });
  });

  describe('Offline and Network Simulation', () => {
    beforeEach(() => {
      cy.seedDatabase();
    });

    it('should show offline indicator when network is unavailable', () => {
      cy.visit('/');

      // Simulate offline state
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });

      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]')
        .or('[data-testid="network-status-offline"]')
        .should('be.visible');

      // Try to perform an operation
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Offline Plan');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Should show error or queue message
      cy.get('[data-testid="snackbar-notification"]')
        .or('[data-testid="offline-message"]')
        .should('be.visible')
        .and('contain.text', 'offline');
    });

    it('should queue operations and sync when back online', () => {
      cy.visit('/');

      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });

      // Attempt to create a plan while offline
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Queued Plan');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Go back online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });

      // Should show sync indicator or success message
      cy.get('[data-testid="sync-indicator"]')
        .or('[data-testid="snackbar-notification"]')
        .should('be.visible');

      // Plan should eventually appear
      cy.get('[data-testid="training-plan-card"]', { timeout: 10000 }).should(
        'contain',
        'Queued Plan'
      );
    });

    it('should handle network timeout gracefully', () => {
      cy.intercept('POST', '/api/**', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/training-plans');

      // Try to create a plan
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Timeout Test');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Should show network error message
      cy.get('[data-testid="error-display-alert"]')
        .or('[data-testid="snackbar-notification"]')
        .should('be.visible')
        .and('contain.text', 'network');
    });
  });

  describe('Data Consistency and Edge Cases', () => {
    beforeEach(() => {
      cy.seedDatabase();
    });

    it('should handle missing optional data gracefully', () => {
      cy.visit('/training-plans');

      // Create a plan without description (optional field)
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Minimal Plan');
      // Leave description empty
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Plan should be created successfully
      cy.get('[data-testid="training-plan-card"]').should('contain', 'Minimal Plan');

      // Open the plan to verify it displays correctly with no description
      cy.get('[data-testid="training-plan-card"]').first().click();

      // Should not show errors or broken UI
      cy.get('[data-testid="error-display-component"]').should('not.exist');
      cy.get('[data-testid="plan-description"]').should('not.contain.text', 'undefined');
    });

    it('should handle special characters in text inputs', () => {
      cy.visit('/training-plans');

      // Create a plan with special characters
      const specialName = 'Plan\'s "Complex" Name <> & Test 100%';
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type(specialName);
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Plan should be created with properly escaped characters
      cy.get('[data-testid="training-plan-card"]').should('contain', specialName);

      // Open and verify the name is correctly displayed
      cy.get('[data-testid="training-plan-card"]').first().click();
      cy.get('[data-testid="plan-title"]').should('contain', specialName);
    });

    it('should maintain referential integrity after profile switch', () => {
      cy.visit('/training-plans');

      // Create a plan in the current profile
      cy.get('[data-testid="create-training-plan-button"]').click();
      cy.get('[data-testid="create-training-plan-name-field"]').type('Profile 1 Plan');
      cy.get('[data-testid="form-dialog-submit"]').click();

      // Verify plan exists
      cy.get('[data-testid="training-plan-card"]').should('contain', 'Profile 1 Plan');

      // Create a new profile
      cy.get('[data-testid="profile-selector"]').click();
      cy.get('[data-testid="profile-selector-add-button"]').click();
      cy.get('[data-testid="create-profile-dialog-name-input"]').type('Second Profile');
      cy.get('[data-testid="create-profile-dialog-create"]').click();

      // New profile should have no plans
      cy.get('[data-testid="training-plan-card"]').should('not.exist');
      cy.get('[data-testid="empty-state"]').should('be.visible');

      // Switch back to first profile
      cy.get('[data-testid="profile-selector"]').click();
      cy.get('[data-testid="profile-option"]').first().click();

      // Original plan should still be there
      cy.get('[data-testid="training-plan-card"]').should('contain', 'Profile 1 Plan');
    });

    it('should handle rapid deletion of multiple items', () => {
      cy.visit('/training-plans');

      // Create multiple plans
      for (let i = 1; i <= 5; i++) {
        cy.get('[data-testid="create-training-plan-button"]').click();
        cy.get('[data-testid="create-training-plan-name-field"]').type(`Plan ${i}`);
        cy.get('[data-testid="form-dialog-submit"]').click();
        cy.wait(100);
      }

      // Verify all plans were created
      cy.get('[data-testid="training-plan-card"]').should('have.length', 5);

      // Delete all plans rapidly
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="training-plan-card"]')
          .first()
          .find('[data-testid="training-plan-delete-button"]')
          .click();
        cy.get('[data-testid="confirm-dialog-confirm"]').click();
        cy.wait(200);
      }

      // All plans should be deleted
      cy.get('[data-testid="training-plan-card"]').should('not.exist');
      cy.get('[data-testid="empty-state"]').should('be.visible');
    });
  });

  describe('Permission and Access Control', () => {
    it('should prevent modification of read-only data', () => {
      cy.visit('/exercises');

      // Assuming system exercises are read-only
      cy.get('[data-testid="exercise-card-system"]')
        .first()
        .find('[data-testid="exercise-delete-button"]')
        .should('not.exist')
        .or('be.disabled');

      cy.get('[data-testid="exercise-card-system"]')
        .first()
        .find('[data-testid="exercise-edit-button"]')
        .should('not.exist')
        .or('be.disabled');
    });

    it('should show appropriate empty states for new users', () => {
      // Start with completely clean database
      cy.resetDatabase();
      cy.visit('/');

      // Should show onboarding or empty state
      cy.get('[data-testid="onboarding-screen"]')
        .or('[data-testid="empty-state"]')
        .should('be.visible');

      // Navigate to plans - should show empty state
      cy.visit('/training-plans');
      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.get('[data-testid="empty-state-message"]')
        .should('contain.text', 'plan')
        .or('contain.text', 'create');
    });
  });
});
