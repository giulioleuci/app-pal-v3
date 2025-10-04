# Exercise CRUD E2E Test - Required Components

This document lists all the components and attributes that need to be created or added to enable the full exercise CRUD E2E test suite.

## Missing Components

### 1. Exercise Create Page/Form
**File**: `src/app/pages/ExerciseCreatePage.tsx` OR `src/features/exercise/components/ExerciseFormDialog.tsx`
**Route**: `/exercises/create`
**Description**: A form component for creating new exercises

**Required data-testid attributes**:
- `data-testid="exercise-form-name"` - Text input for exercise name
- `data-testid="exercise-form-description"` - Text area for exercise description
- `data-testid="exercise-form-category"` - Select/dropdown for category (strength, cardio, flexibility, etc.)
- `data-testid="exercise-form-difficulty"` - Select/dropdown for difficulty (beginner, intermediate, advanced)
- `data-testid="exercise-form-movement-type"` - Select/dropdown for movement type (compound, isolation)
- `data-testid="exercise-form-counter-type"` - Select/dropdown for counter type (reps, time, distance)
- `data-testid="exercise-form-joint-type"` - Select/dropdown for joint type (single, multi)
- `data-testid="exercise-form-equipment"` - Multi-select for equipment
- `data-testid="muscle-activation-{muscleName}"` - Slider inputs for each muscle activation percentage
  - Example: `data-testid="muscle-activation-quadriceps"`
  - Example: `data-testid="muscle-activation-glutes"`
  - Example: `data-testid="muscle-activation-hamstrings"`
  - Example: `data-testid="muscle-activation-core"`
- `data-testid="exercise-form-submit"` - Submit button
- `data-testid="exercise-form-cancel"` - Cancel button

### 2. Exercise Edit Page/Form
**File**: `src/app/pages/ExerciseEditPage.tsx` OR reuse `ExerciseFormDialog.tsx` in edit mode
**Route**: `/exercises/edit/:exerciseId`
**Description**: A form component for editing existing exercises (should be pre-filled with exercise data)

**Required data-testid attributes**: Same as Create Page (listed above)

### 3. ExerciseCard Delete Button
**File**: `src/features/exercise/components/ExerciseCard.tsx` (needs to be updated)
**Required attribute**:
- `data-testid="{testId}-delete-exercise"` - Delete button on the ExerciseCard

**Current Status**: The delete logic exists in `ExercisesPage.tsx` (`handleDeleteExercise` function) but is not exposed in the UI. The ExerciseCard component needs to be updated to:
1. Accept an `onDeleteExercise` callback prop
2. Add a delete button (IconButton or Button with DeleteIcon)
3. Apply the `data-testid="{testId}-delete-exercise"` attribute

**Suggested Implementation**:
```tsx
// In ExerciseCard props interface
export interface ExerciseCardProps {
  // ... existing props
  onDeleteExercise: (exerciseId: string) => void;
}

// In ExerciseCard component
<IconButton
  size="small"
  onClick={handleDeleteExercise}
  data-testid={`${testId}-delete-exercise`}
  aria-label={t('exercise.actions.delete')}
>
  <DeleteIcon />
</IconButton>
```

### 4. VirtualizedCardList Search Input
**File**: `src/shared/components/VirtualizedCardList.tsx` (may need to be verified)
**Required attribute**:
- `data-testid="virtualized-card-list-search"` - Search input field

**Description**: Confirm that the search input in VirtualizedCardList has a data-testid attribute for E2E testing.

## Routing Updates Required

### AppRoutes.tsx
**File**: `src/app/components/AppRoutes.tsx`

Add the following routes:

```tsx
// Exercise Create Route
<Route
  path="/exercises/create"
  element={
    <Suspense fallback={<RouteLoadingFallback />}>
      <AnimatedPage>
        <ExerciseCreatePage />
      </AnimatedPage>
    </Suspense>
  }
/>

// Exercise Edit Route
<Route
  path="/exercises/edit/:exerciseId"
  element={
    <Suspense fallback={<RouteLoadingFallback />}>
      <AnimatedPage>
        <ExerciseEditPage />
      </AnimatedPage>
    </Suspense>
  }
/>
```

## Form Validation Requirements

The exercise forms must use `react-hook-form-mui` with Zod schema validation as per the architecture guidelines.

### Required Validations:
- **name**: Required, min 3 characters, max 100 characters
- **category**: Required, must be one of: strength, cardio, flexibility, balance, etc.
- **difficulty**: Required, must be one of: beginner, intermediate, advanced
- **movementType**: Required, must be one of: compound, isolation
- **counterType**: Required, must be one of: reps, time, distance
- **jointType**: Required, must be one of: single, multi
- **equipment**: Optional array
- **muscleActivation**: Object with muscle names as keys and percentages (0-1) as values
- **description**: Optional, max 500 characters
- **notes**: Optional

### Error Message Handling:
All error messages must be i18n keys that are passed to the `t()` function from `i18next`:

```tsx
// In Zod schema
z.string().min(1, 'exercise.validation.nameRequired')

// In form component
<TextField
  error={!!errors.name}
  helperText={errors.name?.message ? t(errors.name.message) : ''}
  // ...
/>
```

## Confirmation Dialog Integration

The delete flow requires the `ConfirmDialog` component (already exists at `src/shared/components/ConfirmDialog.tsx`).

**Usage in ExercisesPage.tsx**:
```tsx
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [exerciseToDelete, setExerciseToDelete] = useState<ExerciseItem | null>(null);

const handleDeleteClick = (exercise: ExerciseItem) => {
  setExerciseToDelete(exercise);
  setDeleteConfirmOpen(true);
};

const handleConfirmDelete = async () => {
  if (exerciseToDelete) {
    await handleDeleteExercise(exerciseToDelete);
  }
  setDeleteConfirmOpen(false);
  setExerciseToDelete(null);
};

// In render:
<ConfirmDialog
  open={deleteConfirmOpen}
  title={t('exercise.delete.confirmTitle')}
  message={t('exercise.delete.confirmMessage', { name: exerciseToDelete?.name })}
  variant="danger"
  onClose={() => setDeleteConfirmOpen(false)}
  onConfirm={handleConfirmDelete}
/>
```

## Additional Considerations

### Empty State Seed Command
Consider creating a custom Cypress seed command for testing the empty state:
```ts
cy.seedDatabase('with-profile-no-exercises')
```

### API Interceptors for Error Testing
Some tests may require intercepting API calls to simulate errors:
```ts
cy.intercept('DELETE', '/api/exercises/*', {
  statusCode: 500,
  body: { error: 'Internal server error' },
}).as('deleteError');
```

### i18n Keys Required
Ensure the following translation keys exist:
- `exercise.create.button`
- `exercise.actions.created`
- `exercise.actions.updated`
- `exercise.actions.deleted`
- `exercise.actions.deleteError`
- `exercise.delete.confirmTitle`
- `exercise.delete.confirmMessage`
- `exercise.validation.nameRequired`
- `exercises.empty.title`
- `exercises.empty.description`
- `exercises.empty.action`
- `exercises.search.placeholder`

## Priority Order

1. **HIGH**: Create ExerciseCard delete button (quick fix to enable delete flow testing)
2. **HIGH**: Create/update ExercisesPage to integrate ConfirmDialog for deletion
3. **MEDIUM**: Create ExerciseCreatePage/Form component with all required fields
4. **MEDIUM**: Add create route to AppRoutes.tsx
5. **MEDIUM**: Create ExerciseEditPage/Form component (or reuse create form)
6. **MEDIUM**: Add edit route to AppRoutes.tsx
7. **LOW**: Verify VirtualizedCardList search input data-testid
8. **LOW**: Add custom seed command for empty state testing

## Notes

The E2E test suite is comprehensive and covers:
- ✅ Create flow with validation
- ✅ Read flow (detail dialog)
- ✅ Update flow with validation
- ✅ Delete flow with confirmation
- ✅ Complete CRUD cycle
- ✅ Empty state handling
- ✅ Search and filter functionality
- ✅ Error handling scenarios

Once all the required components and attributes are in place, the test suite should run successfully and provide confidence in the exercise management user flows.