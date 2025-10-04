/**
 * E2E Test: Exercise CRUD Flow
 *
 * This test suite validates the complete Create, Read, Update, Delete flow
 * for exercises in the Blueprint Fitness application.
 *
 * User Journey:
 * 1. Navigate to Exercises page
 * 2. Create a new exercise with full details
 * 3. Verify exercise appears in the list
 * 4. View exercise details in dialog
 * 5. Edit the exercise
 * 6. Verify changes are reflected
 * 7. Delete the exercise
 * 8. Verify exercise is removed
 */

describe('Exercise CRUD Flow', () => {
  beforeEach(() => {
    // Seed database with a user profile to enable exercise management
    cy.seedDatabase('with-profile');

    // Navigate to the exercises page
    cy.visit('/exercises');

    // Wait for the page to load
    cy.get('[data-testid="exercises-page"]').should('be.visible');
  });

  describe('Create Flow', () => {
    it('should successfully create a new exercise with complete details', () => {
      // Step 1: Click the Create Exercise FAB
      cy.get('[data-testid="exercises-page-create-fab"]').should('be.visible').click();

      // Step 2: Verify navigation to create form
      // ACTION_REQUIRED: The create route and form component do not exist yet
      // Expected route: /exercises/create
      // Expected component: ExerciseCreatePage or ExerciseFormDialog
      cy.url().should('include', '/exercises/create');

      // Step 3: Fill in the exercise form
      // ACTION_REQUIRED: Missing data-testid attributes on form fields
      // Component: ExerciseForm (needs to be created)
      // Required attributes:
      //   - data-testid="exercise-form-name"
      //   - data-testid="exercise-form-description"
      //   - data-testid="exercise-form-category"
      //   - data-testid="exercise-form-difficulty"
      //   - data-testid="exercise-form-movement-type"
      //   - data-testid="exercise-form-counter-type"
      //   - data-testid="exercise-form-joint-type"
      //   - data-testid="exercise-form-equipment" (multi-select)
      //   - data-testid="exercise-form-muscle-activation" (muscle sliders)
      //   - data-testid="exercise-form-submit"
      //   - data-testid="exercise-form-cancel"

      // Fill in basic information
      cy.get('[data-testid="exercise-form-name"]')
        .should('be.visible')
        .type('Barbell Squat E2E Test');

      cy.get('[data-testid="exercise-form-description"]')
        .should('be.visible')
        .type('A compound lower body exercise focusing on quadriceps, glutes, and hamstrings');

      // Select category
      cy.get('[data-testid="exercise-form-category"]').should('be.visible').click();
      cy.get('[data-value="strength"]').click();

      // Select difficulty
      cy.get('[data-testid="exercise-form-difficulty"]').should('be.visible').click();
      cy.get('[data-value="intermediate"]').click();

      // Select movement type
      cy.get('[data-testid="exercise-form-movement-type"]').should('be.visible').click();
      cy.get('[data-value="compound"]').click();

      // Select counter type
      cy.get('[data-testid="exercise-form-counter-type"]').should('be.visible').click();
      cy.get('[data-value="reps"]').click();

      // Select joint type
      cy.get('[data-testid="exercise-form-joint-type"]').should('be.visible').click();
      cy.get('[data-value="multi"]').click();

      // Add equipment
      cy.get('[data-testid="exercise-form-equipment"]').should('be.visible').click();
      cy.get('[data-value="barbell"]').click();
      cy.get('[data-value="rack"]').click();
      // Close dropdown
      cy.get('body').click(0, 0);

      // Set muscle activation percentages
      // ACTION_REQUIRED: Define muscle activation input pattern
      // Suggested: Slider components for each muscle group
      cy.get('[data-testid="muscle-activation-quadriceps"]')
        .should('be.visible')
        .invoke('val', 90)
        .trigger('change');

      cy.get('[data-testid="muscle-activation-glutes"]')
        .should('be.visible')
        .invoke('val', 85)
        .trigger('change');

      cy.get('[data-testid="muscle-activation-hamstrings"]')
        .should('be.visible')
        .invoke('val', 70)
        .trigger('change');

      cy.get('[data-testid="muscle-activation-core"]')
        .should('be.visible')
        .invoke('val', 60)
        .trigger('change');

      // Step 4: Submit the form
      cy.get('[data-testid="exercise-form-submit"]')
        .should('be.visible')
        .should('not.be.disabled')
        .click();

      // Step 5: Verify success feedback
      // Should see success snackbar notification
      cy.get('[data-testid="snackbar"]').should('be.visible').should('contain', 'created');

      // Step 6: Verify navigation back to exercises list
      cy.url().should('eq', `${Cypress.config().baseUrl}/exercises`);

      // Step 7: Verify the new exercise appears in the list
      cy.get('[data-testid="exercises-page-list"]')
        .should('be.visible')
        .within(() => {
          cy.contains('Barbell Squat E2E Test').should('be.visible');
        });
    });

    it('should validate required fields and show error messages', () => {
      // Navigate to create form
      cy.get('[data-testid="exercises-page-create-fab"]').click();
      cy.url().should('include', '/exercises/create');

      // Attempt to submit without filling required fields
      cy.get('[data-testid="exercise-form-submit"]').click();

      // Verify validation errors appear for required fields
      cy.get('[data-testid="exercise-form-name"]').parent().should('contain', 'required'); // i18n key from Zod schema

      cy.get('[data-testid="exercise-form-category"]').parent().should('contain', 'required');

      cy.get('[data-testid="exercise-form-difficulty"]').parent().should('contain', 'required');

      // Form should not submit
      cy.url().should('include', '/exercises/create');
    });

    it('should allow canceling exercise creation', () => {
      // Navigate to create form
      cy.get('[data-testid="exercises-page-create-fab"]').click();
      cy.url().should('include', '/exercises/create');

      // Fill in some data
      cy.get('[data-testid="exercise-form-name"]').type('Temporary Exercise');

      // Click cancel button
      cy.get('[data-testid="exercise-form-cancel"]').should('be.visible').click();

      // Should navigate back to exercises list without creating
      cy.url().should('eq', `${Cypress.config().baseUrl}/exercises`);

      // Exercise should not exist in list
      cy.get('[data-testid="exercises-page-list"]').should('not.contain', 'Temporary Exercise');
    });
  });

  describe('Read Flow', () => {
    beforeEach(() => {
      // Create an exercise to view
      // This assumes a custom Cypress command or uses the create flow
      // For now, we'll assume the test database has at least one exercise
    });

    it('should display exercise details in a dialog when clicking "View Details"', () => {
      // Step 1: Locate the first exercise card
      cy.get('[data-testid^="exercise-item-"]').first().as('firstExercise');

      // Step 2: Click the "View Details" button
      cy.get('@firstExercise').find('[data-testid$="-view-details"]').should('be.visible').click();

      // Step 3: Verify the detail dialog opens
      cy.get('[data-testid="exercises-page-detail-dialog"]')
        .should('be.visible')
        .within(() => {
          // Verify all key sections are present
          cy.contains('Basic Info').should('be.visible');
          cy.contains('Technical Specs').should('be.visible');
          cy.contains('Muscle Activation').should('be.visible');

          // Verify action buttons are present
          cy.get('[data-testid="exercises-page-detail-dialog-edit-button"]').should('be.visible');
          cy.get('[data-testid="exercises-page-detail-dialog-close-button"]').should('be.visible');
        });
    });

    it('should display comprehensive muscle activation data in detail dialog', () => {
      // Open detail dialog for first exercise
      cy.get('[data-testid^="exercise-item-"]')
        .first()
        .find('[data-testid$="-view-details"]')
        .click();

      cy.get('[data-testid="exercises-page-detail-dialog"]')
        .should('be.visible')
        .within(() => {
          // Verify muscle activation section
          cy.contains('Muscle Activation').should('be.visible');

          // Should show progress bars for each muscle
          // Muscles are sorted by activation level (highest first)
          cy.get('.MuiLinearProgress-root').should('have.length.greaterThan', 0);

          // Should show activation percentage labels
          cy.get('.MuiTypography-caption')
            .filter(':contains("%")')
            .should('have.length.greaterThan', 0);

          // Should show activation level chips (High, Moderate, Low, Minimal)
          cy.get('.MuiChip-root')
            .filter(
              ':contains("High"), :contains("Moderate"), :contains("Low"), :contains("Minimal")'
            )
            .should('exist');
        });
    });

    it('should close detail dialog when clicking close button', () => {
      // Open detail dialog
      cy.get('[data-testid^="exercise-item-"]')
        .first()
        .find('[data-testid$="-view-details"]')
        .click();

      cy.get('[data-testid="exercises-page-detail-dialog"]').should('be.visible');

      // Click close button
      cy.get('[data-testid="exercises-page-detail-dialog-close-button"]').click();

      // Dialog should close
      cy.get('[data-testid="exercises-page-detail-dialog"]').should('not.exist');
    });

    it('should close detail dialog when clicking X icon', () => {
      // Open detail dialog
      cy.get('[data-testid^="exercise-item-"]')
        .first()
        .find('[data-testid$="-view-details"]')
        .click();

      cy.get('[data-testid="exercises-page-detail-dialog"]').should('be.visible');

      // Click X close icon
      cy.get('[data-testid="exercises-page-detail-dialog-close"]').click();

      // Dialog should close
      cy.get('[data-testid="exercises-page-detail-dialog"]').should('not.exist');
    });
  });

  describe('Update Flow', () => {
    it('should successfully edit an existing exercise', () => {
      // Step 1: Locate the first exercise and store its original name
      cy.get('[data-testid^="exercise-item-"]').first().as('firstExercise');

      // Step 2: Click the "Edit" button on the exercise card
      cy.get('@firstExercise').find('[data-testid$="-edit-exercise"]').should('be.visible').click();

      // Step 3: Verify navigation to edit form
      // ACTION_REQUIRED: The edit route and form component do not exist yet
      // Expected route: /exercises/edit/:exerciseId
      // Expected component: ExerciseEditPage or ExerciseFormDialog
      cy.url().should('match', /\/exercises\/edit\/.+/);

      // Step 4: Modify exercise fields
      // Form should be pre-filled with existing data
      cy.get('[data-testid="exercise-form-name"]')
        .should('be.visible')
        .should('not.have.value', '')
        .clear()
        .type('Updated Exercise Name E2E');

      cy.get('[data-testid="exercise-form-description"]')
        .clear()
        .type('Updated description for testing purposes');

      // Change difficulty level
      cy.get('[data-testid="exercise-form-difficulty"]').click();
      cy.get('[data-value="advanced"]').click();

      // Adjust muscle activation
      cy.get('[data-testid="muscle-activation-quadriceps"]').invoke('val', 95).trigger('change');

      // Step 5: Submit the updated form
      cy.get('[data-testid="exercise-form-submit"]')
        .should('be.visible')
        .should('not.be.disabled')
        .click();

      // Step 6: Verify success feedback
      cy.get('[data-testid="snackbar"]').should('be.visible').should('contain', 'updated');

      // Step 7: Verify navigation back to exercises list
      cy.url().should('eq', `${Cypress.config().baseUrl}/exercises`);

      // Step 8: Verify changes are reflected in the list
      cy.get('[data-testid="exercises-page-list"]')
        .should('be.visible')
        .within(() => {
          cy.contains('Updated Exercise Name E2E').should('be.visible');
        });

      // Step 9: Open detail dialog to verify all changes
      cy.contains('Updated Exercise Name E2E')
        .closest('[data-testid^="exercise-item-"]')
        .find('[data-testid$="-view-details"]')
        .click();

      cy.get('[data-testid="exercises-page-detail-dialog"]')
        .should('be.visible')
        .within(() => {
          cy.contains('Updated Exercise Name E2E').should('be.visible');
          cy.contains('Updated description for testing purposes').should('be.visible');
          cy.contains('advanced').should('be.visible');
        });
    });

    it('should navigate to edit form from detail dialog', () => {
      // Open detail dialog
      cy.get('[data-testid^="exercise-item-"]')
        .first()
        .find('[data-testid$="-view-details"]')
        .click();

      cy.get('[data-testid="exercises-page-detail-dialog"]').should('be.visible');

      // Click edit button in dialog
      cy.get('[data-testid="exercises-page-detail-dialog-edit-button"]').click();

      // Should navigate to edit form and close dialog
      cy.url().should('match', /\/exercises\/edit\/.+/);
      cy.get('[data-testid="exercises-page-detail-dialog"]').should('not.exist');
    });

    it('should validate updated fields and prevent invalid submissions', () => {
      // Navigate to edit form
      cy.get('[data-testid^="exercise-item-"]')
        .first()
        .find('[data-testid$="-edit-exercise"]')
        .click();

      cy.url().should('match', /\/exercises\/edit\/.+/);

      // Clear required field (name)
      cy.get('[data-testid="exercise-form-name"]').clear();

      // Attempt to submit
      cy.get('[data-testid="exercise-form-submit"]').click();

      // Should show validation error
      cy.get('[data-testid="exercise-form-name"]').parent().should('contain', 'required');

      // Should not navigate away
      cy.url().should('match', /\/exercises\/edit\/.+/);
    });
  });

  describe('Delete Flow', () => {
    // ACTION_REQUIRED: Missing delete button on ExerciseCard
    // Component: ExerciseCard (needs to be updated)
    // Required attribute: data-testid="{testId}-delete-exercise"
    // The delete logic exists in ExercisesPage.tsx but is not exposed to the UI

    it('should successfully delete an exercise with confirmation', () => {
      // Step 1: Locate an exercise to delete and store its name
      cy.get('[data-testid^="exercise-item-"]').first().as('exerciseToDelete');

      cy.get('@exerciseToDelete').find('h3').invoke('text').as('exerciseName');

      // Step 2: Click the delete button on the exercise card
      cy.get('@exerciseToDelete')
        .find('[data-testid$="-delete-exercise"]')
        .should('be.visible')
        .click();

      // Step 3: Verify confirmation dialog appears
      cy.get('[data-testid="confirm-dialog"]')
        .should('be.visible')
        .within(() => {
          // Dialog should show warning variant
          cy.get('[data-testid="confirm-dialog-title"]').should('contain', 'Delete'); // or localized version

          cy.get('[data-testid="confirm-dialog-message"]').should('be.visible');

          // Should have cancel and confirm buttons
          cy.get('[data-testid="confirm-dialog-cancel"]').should('be.visible');
          cy.get('[data-testid="confirm-dialog-confirm"]').should('be.visible');
        });

      // Step 4: Confirm deletion
      cy.get('[data-testid="confirm-dialog-confirm"]').click();

      // Step 5: Verify success feedback
      cy.get('[data-testid="snackbar"]').should('be.visible').should('contain', 'deleted');

      // Step 6: Verify exercise is removed from the list
      cy.get('@exerciseName').then((name) => {
        cy.get('[data-testid="exercises-page-list"]').should('not.contain', name);
      });
    });

    it('should cancel deletion when clicking cancel in confirmation dialog', () => {
      // Locate an exercise
      cy.get('[data-testid^="exercise-item-"]').first().as('exercise');

      cy.get('@exercise').find('h3').invoke('text').as('exerciseName');

      // Click delete button
      cy.get('@exercise').find('[data-testid$="-delete-exercise"]').click();

      // Confirmation dialog appears
      cy.get('[data-testid="confirm-dialog"]').should('be.visible');

      // Click cancel
      cy.get('[data-testid="confirm-dialog-cancel"]').click();

      // Dialog should close
      cy.get('[data-testid="confirm-dialog"]').should('not.exist');

      // Exercise should still be in the list
      cy.get('@exerciseName').then((name) => {
        cy.get('[data-testid="exercises-page-list"]').should('contain', name);
      });
    });

    it('should handle deletion errors gracefully', () => {
      // This test would require mocking the API to return an error
      // For demonstration, we'll outline the expected behavior

      // Intercept delete request to simulate error
      cy.intercept('DELETE', '/api/exercises/*', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('deleteError');

      // Attempt to delete
      cy.get('[data-testid^="exercise-item-"]')
        .first()
        .find('[data-testid$="-delete-exercise"]')
        .click();

      cy.get('[data-testid="confirm-dialog-confirm"]').click();

      // Wait for error response
      cy.wait('@deleteError');

      // Should show error snackbar
      cy.get('[data-testid="snackbar"]').should('be.visible').should('contain', 'error');

      // Exercise should still be in the list
      cy.get('[data-testid^="exercise-item-"]').first().should('exist');
    });
  });

  describe('Complete CRUD Cycle', () => {
    it('should successfully complete a full create-read-update-delete cycle', () => {
      // === CREATE ===
      cy.get('[data-testid="exercises-page-create-fab"]').click();
      cy.url().should('include', '/exercises/create');

      // Fill form with unique exercise name
      const exerciseName = `E2E Test Exercise ${Date.now()}`;
      cy.get('[data-testid="exercise-form-name"]').type(exerciseName);

      cy.get('[data-testid="exercise-form-description"]').type('Full cycle test exercise');

      cy.get('[data-testid="exercise-form-category"]').click();
      cy.get('[data-value="strength"]').click();

      cy.get('[data-testid="exercise-form-difficulty"]').click();
      cy.get('[data-value="beginner"]').click();

      cy.get('[data-testid="exercise-form-movement-type"]').click();
      cy.get('[data-value="isolation"]').click();

      cy.get('[data-testid="exercise-form-counter-type"]').click();
      cy.get('[data-value="reps"]').click();

      cy.get('[data-testid="exercise-form-joint-type"]').click();
      cy.get('[data-value="single"]').click();

      cy.get('[data-testid="exercise-form-submit"]').click();

      cy.get('[data-testid="snackbar"]').should('contain', 'created');

      // === READ ===
      // Verify exercise is in list
      cy.get('[data-testid="exercises-page-list"]').should('contain', exerciseName);

      // View details
      cy.contains(exerciseName)
        .closest('[data-testid^="exercise-item-"]')
        .find('[data-testid$="-view-details"]')
        .click();

      cy.get('[data-testid="exercises-page-detail-dialog"]')
        .should('be.visible')
        .should('contain', exerciseName)
        .should('contain', 'Full cycle test exercise');

      cy.get('[data-testid="exercises-page-detail-dialog-close-button"]').click();

      // === UPDATE ===
      const updatedName = `${exerciseName} - Updated`;
      cy.contains(exerciseName)
        .closest('[data-testid^="exercise-item-"]')
        .find('[data-testid$="-edit-exercise"]')
        .click();

      cy.url().should('match', /\/exercises\/edit\/.+/);

      cy.get('[data-testid="exercise-form-name"]').clear().type(updatedName);

      cy.get('[data-testid="exercise-form-difficulty"]').click();
      cy.get('[data-value="advanced"]').click();

      cy.get('[data-testid="exercise-form-submit"]').click();

      cy.get('[data-testid="snackbar"]').should('contain', 'updated');

      // Verify update
      cy.get('[data-testid="exercises-page-list"]').should('contain', updatedName);

      // === DELETE ===
      cy.contains(updatedName)
        .closest('[data-testid^="exercise-item-"]')
        .find('[data-testid$="-delete-exercise"]')
        .click();

      cy.get('[data-testid="confirm-dialog"]').should('be.visible');

      cy.get('[data-testid="confirm-dialog-confirm"]').click();

      cy.get('[data-testid="snackbar"]').should('contain', 'deleted');

      // Verify deletion
      cy.get('[data-testid="exercises-page-list"]').should('not.contain', updatedName);
    });
  });

  describe('Empty State Handling', () => {
    it('should show empty state when no exercises exist', () => {
      // This test assumes a clean database state
      // You may need a custom seed command like: cy.seedDatabase('with-profile-no-exercises')

      cy.get('[data-testid="exercises-empty-state"]')
        .should('be.visible')
        .within(() => {
          // Should show contextual onboarding message
          cy.contains('No exercises').should('be.visible'); // or localized version
          cy.contains('Create your first exercise').should('be.visible');

          // Should have action button
          cy.get('button').should('be.visible').should('contain', 'Create');
        });
    });

    it('should navigate to create form from empty state action button', () => {
      // Assumes empty state is visible
      cy.get('[data-testid="exercises-empty-state"]').find('button').click();

      cy.url().should('include', '/exercises/create');
    });
  });

  describe('Search and Filter', () => {
    it('should filter exercises by name using search', () => {
      // Assumes multiple exercises exist
      cy.get('[data-testid="exercises-page-list"]').should('be.visible');

      // Find search input
      // ACTION_REQUIRED: Confirm data-testid for VirtualizedCardList search input
      // Expected: data-testid="virtualized-card-list-search" or similar
      cy.get('[data-testid="virtualized-card-list-search"]').should('be.visible').type('squat');

      // Wait for debounced search
      cy.wait(500);

      // Should only show exercises matching search
      cy.get('[data-testid^="exercise-item-"]').each(($el) => {
        cy.wrap($el).should('contain.text', 'squat');
      });
    });

    it('should show "no results" when search matches nothing', () => {
      cy.get('[data-testid="virtualized-card-list-search"]').type('xyznonexistent123');

      cy.wait(500);

      // Should show empty state or "no results" message
      cy.get('[data-testid="exercises-page-list"]').should('contain', 'No exercises found'); // or similar localized message
    });
  });
});
