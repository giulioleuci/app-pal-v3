# Persistence Layer API Documentation

This document provides comprehensive documentation for the Persistence Layer's public API.
The Persistence Layer handles all data access operations, repository implementations,
and database interactions while maintaining clean separation from business logic.

## Architecture Overview

The Persistence Layer follows these key principles:
- **Repository Pattern**: All data access goes through repository interfaces
- **Data Mapping**: Clean separation between domain models and persistence models
- **Transaction Management**: Consistent transaction handling across operations
- **Error Handling**: Proper error mapping from persistence to domain layer
- **Caching Strategy**: Intelligent caching for performance optimization

---

## File: `src/App.tsx`

_No exported classes found in this file._

## File: `src/main.tsx`

_No exported classes found in this file._

## File: `src/reactive-hook-test-utils.tsx`

_No exported classes found in this file._

## File: `src/test-database-transactions.test.ts`

_No exported classes found in this file._

## File: `src/test-database.ts`

### class `TestExtendedDatabase`

**Description:**
Extended database class for tests that provides the same interface as production BlueprintFitnessDB

#### Constructor

##### Constructor

```typescript
/**
 * @param {any} options - 
 */
constructor(options: any)
```

#### Public Properties

##### `profiles: any`

##### `userSettings: any`

##### `trainingPlans: any`

##### `workoutSessions: any`

##### `exerciseGroups: any`

##### `appliedExercises: any`

##### `workoutLogs: any`

##### `performedGroups: any`

##### `performedExerciseLogs: any`

##### `performedExercises: any`

##### `performedSets: any`

##### `exercises: any`

##### `exerciseTemplates: any`

##### `maxLogs: any`

##### `weightRecords: any`

##### `heightRecords: any`

##### `workoutStates: any`

##### `cleanup: () => Promise<void>`

##### `delete: () => Promise<void>`

---

## File: `src/test-factories.ts`

_No exported classes found in this file._

## File: `src/test-setup.ts`

_No exported classes found in this file._

## File: `src/test-utils.tsx`

_No exported classes found in this file._

## File: `src/app/container.ts`

_No exported classes found in this file._

## File: `src/app/env.ts`

_No exported classes found in this file._

## File: `src/app/queryKeys.ts`

_No exported classes found in this file._

## File: `src/app/themes.ts`

_No exported classes found in this file._

## File: `src/architecture/domain-constructors.test.ts`

_No exported classes found in this file._

## File: `src/architecture/domain-purity.test.ts`

_No exported classes found in this file._

## File: `src/architecture/index.ts`

_No exported classes found in this file._

## File: `src/architecture/repository-interfaces.test.ts`

_No exported classes found in this file._

## File: `src/architecture/service-results.test.ts`

_No exported classes found in this file._

## File: `src/lib/calculations.ts`

_No exported classes found in this file._

## File: `src/lib/dates.ts`

_No exported classes found in this file._

## File: `src/lib/duration.ts`

_No exported classes found in this file._

## File: `src/lib/id.ts`

_No exported classes found in this file._

## File: `src/lib/index.ts`

_No exported classes found in this file._

## File: `src/lib/rpe-chart.ts`

_No exported classes found in this file._

## File: `src/app/__tests__/container.test.ts`

_No exported classes found in this file._

## File: `src/app/db/database.ts`

_No exported classes found in this file._

## File: `src/app/db/index.ts`

_No exported classes found in this file._

## File: `src/app/db/schema.ts`

_No exported classes found in this file._

## File: `src/app/db/transaction.ts`

_No exported classes found in this file._

## File: `src/app/providers/AppServicesProvider.tsx`

_No exported classes found in this file._

## File: `src/app/providers/index.ts`

_No exported classes found in this file._

## File: `src/app/providers/SnackbarProvider.tsx`

_No exported classes found in this file._

## File: `src/app/providers/ThemeProvider.tsx`

_No exported classes found in this file._

## File: `src/app/services/ConsoleLogger.ts`

### class `ConsoleLogger`

**Description:**
A simple implementation of the ILogger interface that logs to the console.

#### Public Instance Methods

##### `info()`

```typescript
/**
 * @param {string} message - 
 * @param {Record<string, any> | undefined} data - 
 */
public info(message: string, data?: Record<string, any>): void
```

##### `warn()`

```typescript
/**
 * @param {string} message - 
 * @param {Record<string, any> | undefined} data - 
 */
public warn(message: string, data?: Record<string, any>): void
```

##### `error()`

```typescript
/**
 * @param {string} message - 
 * @param {Error | undefined} error - 
 * @param {Record<string, any> | undefined} data - 
 */
public error(message: string, error?: Error, data?: Record<string, any>): void
```

---

## File: `src/app/services/ILogger.ts`

_No exported classes found in this file._

## File: `src/app/services/index.ts`

_No exported classes found in this file._

## File: `src/app/store/index.ts`

_No exported classes found in this file._

## File: `src/app/store/LocalStorageAdapter.ts`

### class `LocalStorageAdapter`

**Description:**
Custom storage adapter for Zustand's persist middleware that wraps localStorage with proper error handling and JSON serialization. This abstraction allows for easier testing and potential future migration to different storage backends (e.g., AsyncStorage, IndexedDB, etc.).

#### Public Instance Methods

##### `getItem()`

```typescript
/**
 * Retrieves and parses a value from localStorage
 *
 * @param {string} name - 
 * @returns {string | null} Returns string | null
 */
getItem(name: string): string | null
```

##### `setItem()`

```typescript
/**
 * Serializes and stores a value in localStorage
 *
 * @param {string} name - 
 * @param {string} value - 
 */
setItem(name: string, value: string): void
```

##### `removeItem()`

```typescript
/**
 * Removes an item from localStorage
 *
 * @param {string} name - 
 */
removeItem(name: string): void
```

---

## File: `src/app/store/profileStore.ts`

_No exported classes found in this file._

## File: `src/app/store/themeStore.ts`

_No exported classes found in this file._

## File: `src/lib/__tests__/calculations.test.ts`

_No exported classes found in this file._

## File: `src/lib/__tests__/dates.test.ts`

_No exported classes found in this file._

## File: `src/lib/__tests__/rpe-chart.test.ts`

_No exported classes found in this file._

## File: `src/shared/application/index.ts`

_No exported classes found in this file._

## File: `src/shared/domain/BaseModel.ts`

### class `BaseModel`

**Description:**
An abstract base class for all domain models in the application. It provides common properties like id, createdAt, and updatedAt, and enforces a contract for serialization and validation.

#### Constructor

##### Constructor

```typescript
/**
 * @param {T} props - 
 */
protected constructor(props: T)
```

#### Public Properties

##### `id: string`

##### `createdAt: Date`

##### `updatedAt: Date`

#### Public Instance Methods

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {T} Returns T
 */
abstract toPlainObject(): T;
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {{ success: boolean; errors?: unknown; }} Returns { success: boolean; errors?: unknown; }
 */
abstract validate():
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} Returns this
 */
public abstract clone(): this;
```

##### `equals()`

```typescript
/**
 * Compares this model with another for equality based on their unique IDs.
 *
 * @param {BaseModel<unknown> | null | undefined} other - 
 * @returns {boolean} Returns boolean
 */
public equals(other: BaseModel<unknown> | null | undefined): boolean
```

---

## File: `src/shared/domain/index.ts`

_No exported classes found in this file._

## File: `src/shared/errors/AmrapEmomRequiresDurationError.ts`

### class `AmrapEmomRequiresDurationError`

**Description:**
Thrown when an AMRAP or EMOM group is created without a duration.

#### Constructor

##### Constructor

```typescript
/**
 * @param {"AMRAP" | "EMOM"} type - 
 */
constructor(public readonly type: 'AMRAP' | 'EMOM')
```

---

## File: `src/shared/errors/ApplicationError.ts`

### class `ApplicationError`

**Description:**
Base class for all custom application errors.

#### Constructor

##### Constructor

```typescript
/**
 * @param {I18nKeys} message - 
 */
constructor(public readonly message: I18nKeys)
```

---

## File: `src/shared/errors/ApplicationValidationError.ts`

### class `ApplicationValidationError`

**Description:**
Thrown when data validation fails at the application service level.

#### Constructor

##### Constructor

```typescript
/**
 * @param {I18nKeys} message - 
 */
constructor(public readonly message: I18nKeys)
```

---

## File: `src/shared/errors/BusinessRuleError.ts`

### class `BusinessRuleError`

**Description:**
Thrown when a business rule is violated.

#### Constructor

##### Constructor

```typescript
/**
 * @param {I18nKeys} message - 
 */
constructor(public readonly message: I18nKeys)
```

---

## File: `src/shared/errors/CircuitRequiresMultipleExercisesError.ts`

### class `CircuitRequiresMultipleExercisesError`

**Description:**
Thrown when a circuit is created with fewer than two exercises.

#### Constructor

##### Constructor

```typescript
/**
 */
constructor()
```

---

## File: `src/shared/errors/ConflictError.ts`

### class `ConflictError`

**Description:**
Thrown when an operation violates a unique constraint (e.g., creating a duplicate).

#### Constructor

##### Constructor

```typescript
/**
 * @param {I18nKeys} message - 
 */
constructor(public readonly message: I18nKeys)
```

---

## File: `src/shared/errors/guards.ts`

_No exported classes found in this file._

## File: `src/shared/errors/index.ts`

_No exported classes found in this file._

## File: `src/shared/errors/InvalidWeightOrCountsError.ts`

### class `InvalidWeightOrCountsError`

**Description:**
Thrown when weight or counts are invalid for a calculation.

#### Constructor

##### Constructor

```typescript
/**
 * @param {I18nKeys} message - 
 */
constructor(message: I18nKeys)
```

---

## File: `src/shared/errors/NotFoundError.ts`

### class `NotFoundError`

**Description:**
Thrown when a requested entity is not found.

#### Constructor

##### Constructor

```typescript
/**
 * @param {I18nKeys} message - 
 */
constructor(public readonly message: I18nKeys)
```

---

## File: `src/shared/errors/SupersetRequiresMultipleExercisesError.ts`

### class `SupersetRequiresMultipleExercisesError`

**Description:**
Thrown when a superset is created with fewer than two exercises.

#### Constructor

##### Constructor

```typescript
/**
 */
constructor()
```

---

## File: `src/shared/errors/TrainingPlanMustHaveSessionsError.ts`

### class `TrainingPlanMustHaveSessionsError`

**Description:**
Thrown when attempting to build a training plan with no sessions.

#### Constructor

##### Constructor

```typescript
/**
 */
constructor()
```

---

## File: `src/shared/hooks/index.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/useActiveProfileId.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/useDebouncedValue.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/useObserveQuery.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/useProgressCalculations.ts`

_No exported classes found in this file._

## File: `src/shared/locales/i18n.generated.ts`

_No exported classes found in this file._

## File: `src/shared/locales/index.ts`

_No exported classes found in this file._

## File: `src/shared/locales/useAppTranslation.ts`

_No exported classes found in this file._

## File: `src/shared/types/index.ts`

_No exported classes found in this file._

## File: `src/shared/types/schemas.ts`

_No exported classes found in this file._

## File: `src/shared/utils/Result.ts`

### class `Result`

**Description:**
A class that represents the result of an operation that can either succeed with a value of type T or fail with an error of type E. This promotes a functional approach to error handling between the Application and Query Service layers.

#### Constructor

##### Constructor

```typescript
/**
 * @param {boolean} isSuccess - 
 * @param {T | undefined} value - 
 * @param {E | undefined} error - 
 */
private constructor(isSuccess: boolean, value?: T, error?: E)
```

#### Public Properties

##### `isSuccess: boolean`

##### `isFailure: boolean`

##### `error: E | undefined`

#### Public Static Methods

##### `success()`

```typescript
/**
 * Creates a success result.
 *
 * @param {T} value - 
 * @returns {Result<T, E>} Returns Result<T, E>
 */
public static success<T, E>(value: T): Result<T, E>
```

##### `failure()`

```typescript
/**
 * Creates a failure result.
 *
 * @param {E} error - 
 * @returns {Result<T, E>} Returns Result<T, E>
 */
public static failure<T, E>(error: E): Result<T, E>
```

#### Public Instance Methods

##### `getValue()`

```typescript
/**
 * Gets the success value. Throws an error if the result is a failure.
 *
 * @returns {T} The success value of type T.
 */
public getValue(): T
```

---

## File: `src/shared/utils/transformations.ts`

_No exported classes found in this file._

## File: `src/shared/validation/index.test.ts`

_No exported classes found in this file._

## File: `src/shared/validation/index.ts`

_No exported classes found in this file._

## File: `src/app/db/__tests__/persistence.architecture.test.ts`

_No exported classes found in this file._

## File: `src/app/db/fixtures/sample-data.ts`

_No exported classes found in this file._

## File: `src/app/db/model/AppliedExercise.ts`

### class `AppliedExercise`

**Description:**
WatermelonDB model for AppliedExercise entity. Represents an exercise applied within a specific exercise group with configuration. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly exercise_groups: { readonly type: "belongs_to"; readonly key: "exercise_group_id"; }; readonly exercises: { readonly type: "belongs_to"; readonly key: "exercise_id"; }; readonly exercise_templates: { readonly type: "belongs_to"; readonly key: "template_id"; }; readonly performed_exercise_logs: { readonly type: "has_many"; readonly foreignKey: "planned_exercise_id"; }; }`

##### `profileId: string`

##### `exerciseGroupId: string`

##### `exerciseId: string`

##### `templateId: string`

##### `setConfiguration: Record<string, any>`

##### `restTimeSeconds: number`

##### `executionCount: number`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `exerciseGroup: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/ExerciseGroup").ExerciseGroup>`

##### `exercise: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Exercise").Exercise>`

##### `template: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/ExerciseTemplate").ExerciseTemplate>`

##### `performedExerciseLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/PerformedExerciseLog").PerformedExerciseLog>`

---

## File: `src/app/db/model/CustomTheme.ts`

### class `CustomTheme`

**Description:**
WatermelonDB model for CustomTheme entity. Represents user-defined theme configurations. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; }`

##### `profileId: string`

##### `name: string`

##### `mode: string`

##### `primaryColor: string`

##### `secondaryColor: string`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

---

## File: `src/app/db/model/Exercise.ts`

### class `Exercise`

**Description:**
WatermelonDB model for Exercise entity. Represents individual exercises in the fitness application. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly exercise_templates: { readonly type: "has_many"; readonly foreignKey: "exercise_id"; }; readonly applied_exercises: { readonly type: "has_many"; readonly foreignKey: "exercise_id"; }; readonly max_logs: { readonly type: "has_many"; readonly foreignKey: "exercise_id"; }; readonly performed_exercise_logs: { readonly type: "has_many"; readonly foreignKey: "exercise_id"; }; }`

##### `profileId: string`

##### `name: string`

##### `description: string`

##### `category: string`

##### `movementType: string`

##### `movementPattern: string`

##### `difficulty: string`

##### `equipment: string[]`

##### `muscleActivation: Record<string, number>`

##### `counterType: string`

##### `jointType: string`

##### `notes: string`

##### `substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `exerciseTemplates: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/ExerciseTemplate").ExerciseTemplate>`

##### `appliedExercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/AppliedExercise").AppliedExercise>`

##### `maxLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/MaxLog").MaxLog>`

##### `performedExerciseLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/PerformedExerciseLog").PerformedExerciseLog>`

---

## File: `src/app/db/model/ExerciseGroup.ts`

### class `ExerciseGroup`

**Description:**
WatermelonDB model for ExerciseGroup entity. Represents a group of exercises (single, superset, circuit, etc.) within a workout session. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly workout_sessions: { readonly type: "belongs_to"; readonly key: "workout_session_id"; }; readonly applied_exercises: { readonly type: "has_many"; readonly foreignKey: "exercise_group_id"; }; readonly performed_groups: { readonly type: "has_many"; readonly foreignKey: "planned_group_id"; }; }`

##### `profileId: string`

##### `workoutSessionId: string`

##### `type: string`

##### `rounds: { min: number; max?: number | undefined; direction: "asc" | "desc"; }`

##### `durationMinutes: number`

##### `restTimeSeconds: number`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `workoutSession: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/WorkoutSession").WorkoutSession>`

##### `appliedExercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/AppliedExercise").AppliedExercise>`

##### `performedGroups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/PerformedGroup").PerformedGroup>`

---

## File: `src/app/db/model/ExerciseTemplate.ts`

### class `ExerciseTemplate`

**Description:**
WatermelonDB model for ExerciseTemplate entity. Represents predefined exercise configurations with set parameters. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly exercises: { readonly type: "belongs_to"; readonly key: "exercise_id"; }; readonly applied_exercises: { readonly type: "has_many"; readonly foreignKey: "template_id"; }; }`

##### `name: string`

##### `exerciseId: string`

##### `setConfiguration: Record<string, any>`

##### `notes: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `exercise: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Exercise").Exercise>`

##### `appliedExercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/AppliedExercise").AppliedExercise>`

---

## File: `src/app/db/model/HeightRecord.ts`

### class `HeightRecord`

**Description:**
WatermelonDB model for HeightRecord entity. Represents a height measurement record for body metrics tracking. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; }`

##### `profileId: string`

##### `date: Date`

##### `height: number`

##### `notes: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

---

## File: `src/app/db/model/index.ts`

_No exported classes found in this file._

## File: `src/app/db/model/MaxLog.ts`

### class `MaxLog`

**Description:**
WatermelonDB model for MaxLog entity. Represents a maximum lift record for strength tracking. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly exercises: { readonly type: "belongs_to"; readonly key: "exercise_id"; }; }`

##### `profileId: string`

##### `exerciseId: string`

##### `weightEnteredByUser: number`

##### `date: Date`

##### `reps: number`

##### `notes: string`

##### `estimated1RM: number`

##### `maxBrzycki: number`

##### `maxBaechle: number`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `exercise: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Exercise").Exercise>`

---

## File: `src/app/db/model/PerformedExerciseLog.ts`

### class `PerformedExerciseLog`

**Description:**
WatermelonDB model for PerformedExerciseLog entity. Represents an exercise actually performed during a workout with its performance data. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly performed_groups: { readonly type: "belongs_to"; readonly key: "performed_group_id"; }; readonly exercises: { readonly type: "belongs_to"; readonly key: "exercise_id"; }; readonly applied_exercises: { readonly type: "belongs_to"; readonly key: "planned_exercise_id"; }; readonly performed_sets: { readonly type: "has_many"; readonly foreignKey: "performed_exercise_log_id"; }; }`

##### `profileId: string`

##### `performedGroupId: string`

##### `exerciseId: string`

##### `plannedExerciseId: string`

##### `notes: string`

##### `isSkipped: boolean`

##### `exerciseName: string`

##### `exerciseCategory: string`

##### `muscleActivation: Record<string, number>`

##### `totalSets: number`

##### `totalCounts: number`

##### `totalVolume: number`

##### `repCategoryDistribution: Record<string, number>`

##### `comparisonTrend: string`

##### `comparisonSetsChange: number`

##### `comparisonCountsChange: number`

##### `comparisonVolumeChange: number`

##### `comparisonVolume: number`

##### `comparisonAvgWeight: number`

##### `comparisonMaxWeight: number`

##### `comparisonTotalReps: number`

##### `rpeEffort: string`

##### `estimated1RM: number`

##### `profile: any`

##### `performedGroup: any`

##### `exercise: any`

##### `plannedExercise: any`

##### `performedSets: any`

---

## File: `src/app/db/model/PerformedGroup.ts`

### class `PerformedGroup`

**Description:**
WatermelonDB model for PerformedGroup entity. Represents a group of exercises actually performed during a workout. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly workout_logs: { readonly type: "belongs_to"; readonly key: "workout_log_id"; }; readonly exercise_groups: { readonly type: "belongs_to"; readonly key: "planned_group_id"; }; readonly performed_exercise_logs: { readonly type: "has_many"; readonly foreignKey: "performed_group_id"; }; }`

##### `profileId: string`

##### `workoutLogId: string`

##### `plannedGroupId: string`

##### `type: string`

##### `actualRestSeconds: number`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile`

##### `workoutLog: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/WorkoutLog").WorkoutLog`

##### `plannedGroup: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/ExerciseGroup").ExerciseGroup`

##### `performedExerciseLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/PerformedExerciseLog").PerformedExerciseLog>`

---

## File: `src/app/db/model/PerformedSet.ts`

### class `PerformedSet`

**Description:**
WatermelonDB model for PerformedSet entity. Represents an individual set performed during a workout. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly performed_exercise_logs: { readonly type: "belongs_to"; readonly key: "performed_exercise_log_id"; }; }`

##### `profileId: string`

##### `performedExerciseLogId: string`

##### `counterType: string`

##### `counts: number`

##### `weight: number`

##### `completed: boolean`

##### `notes: string`

##### `rpe: number`

##### `percentage: number`

##### `plannedLoad: { min: number; max?: number | undefined; direction: "asc" | "desc"; }`

##### `plannedRpe: { min: number; max?: number | undefined; direction: "asc" | "desc"; }`

##### `plannedCounts: { min: number; max?: number | undefined; direction: "asc" | "desc"; }`

##### `profile: any`

##### `performedExerciseLog: any`

---

## File: `src/app/db/model/Profile.ts`

### class `Profile`

**Description:**
WatermelonDB model for Profile entity. Represents a user profile in the Blueprint Fitness application. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `name: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `userSettings: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `userDetails: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `customThemes: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `exercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `trainingCycles: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `trainingPlans: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `workoutSessions: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `exerciseGroups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `appliedExercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `workoutLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `performedGroups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `performedExerciseLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `performedSets: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `weightRecords: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `heightRecords: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `maxLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

##### `workoutStates: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Model/index").default>`

---

## File: `src/app/db/model/TrainingCycle.ts`

### class `TrainingCycle`

**Description:**
WatermelonDB model for TrainingCycle entity. Represents a training cycle with specific goals and timeframe. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly training_plans: { readonly type: "has_many"; readonly foreignKey: "cycle_id"; }; }`

##### `profileId: string`

##### `name: string`

##### `startDate: Date`

##### `endDate: Date`

##### `goal: string`

##### `notes: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `trainingPlans: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/TrainingPlan").TrainingPlan>`

---

## File: `src/app/db/model/TrainingPlan.ts`

### class `TrainingPlan`

**Description:**
WatermelonDB model for TrainingPlan entity. Represents a complete training plan with multiple sessions. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly training_cycles: { readonly type: "belongs_to"; readonly key: "cycle_id"; }; readonly workout_sessions: { readonly type: "has_many"; readonly foreignKey: "training_plan_id"; }; readonly workout_logs: { readonly type: "has_many"; readonly foreignKey: "training_plan_id"; }; }`

##### `profileId: string`

##### `name: string`

##### `description: string`

##### `isArchived: boolean`

##### `currentSessionIndex: number`

##### `notes: string`

##### `cycleId: string`

##### `order: number`

##### `lastUsed: Date`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `cycle: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/TrainingCycle").TrainingCycle>`

##### `workoutSessions: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/WorkoutSession").WorkoutSession>`

##### `workoutLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/WorkoutLog").WorkoutLog>`

---

## File: `src/app/db/model/UserDetails.ts`

### class `UserDetails`

**Description:**
WatermelonDB model for UserDetails entity. Represents personal details and information about the user. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; }`

##### `profileId: string`

##### `fullName: string`

##### `biologicalSex: string`

##### `dateOfBirth: Date`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

---

## File: `src/app/db/model/UserSettings.ts`

### class `UserSettings`

**Description:**
WatermelonDB model for UserSettings entity. Represents user-specific settings and preferences. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; }`

##### `profileId: string`

##### `themeMode: string`

##### `primaryColor: string`

##### `secondaryColor: string`

##### `unitSystem: string`

##### `bmiFormula: string`

##### `activeTrainingPlanId: string`

##### `autoStartRestTimer: boolean`

##### `autoStartShortRestTimer: boolean`

##### `liftMappings: Record<string, string>`

##### `dashboardLayout: string[]`

##### `dashboardVisibility: Record<string, boolean>`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

---

## File: `src/app/db/model/WeightRecord.ts`

### class `WeightRecord`

**Description:**
WatermelonDB model for WeightRecord entity. Represents a weight measurement record for body metrics tracking. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; }`

##### `profileId: string`

##### `date: Date`

##### `weight: number`

##### `notes: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

---

## File: `src/app/db/model/WorkoutLog.ts`

### class `WorkoutLog`

**Description:**
WatermelonDB model for WorkoutLog entity. Represents a completed workout session with its performance data. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly training_plans: { readonly type: "belongs_to"; readonly key: "training_plan_id"; }; readonly workout_sessions: { readonly type: "belongs_to"; readonly key: "session_id"; }; readonly performed_groups: { readonly type: "has_many"; readonly foreignKey: "workout_log_id"; }; }`

##### `profileId: string`

##### `trainingPlanId: string`

##### `trainingPlanName: string`

##### `sessionId: string`

##### `sessionName: string`

##### `startTime: Date`

##### `endTime: Date`

##### `durationSeconds: number`

##### `totalVolume: number`

##### `notes: string`

##### `userRating: number`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `trainingPlan: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/TrainingPlan").TrainingPlan>`

##### `session: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/WorkoutSession").WorkoutSession>`

##### `performedGroups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/PerformedGroup").PerformedGroup>`

---

## File: `src/app/db/model/WorkoutSession.ts`

### class `WorkoutSession`

**Description:**
WatermelonDB model for WorkoutSession entity. Represents an individual workout session within a training plan. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; readonly training_plans: { readonly type: "belongs_to"; readonly key: "training_plan_id"; }; readonly exercise_groups: { readonly type: "has_many"; readonly foreignKey: "workout_session_id"; }; readonly workout_logs: { readonly type: "has_many"; readonly foreignKey: "session_id"; }; }`

##### `profileId: string`

##### `trainingPlanId: string`

##### `name: string`

##### `notes: string`

##### `executionCount: number`

##### `isDeload: boolean`

##### `dayOfWeek: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

##### `trainingPlan: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/TrainingPlan").TrainingPlan>`

##### `exerciseGroups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/ExerciseGroup").ExerciseGroup>`

##### `workoutLogs: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Query/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/WorkoutLog").WorkoutLog>`

---

## File: `src/app/db/model/WorkoutState.ts`

### class `WorkoutState`

**Description:**
WatermelonDB model for WorkoutState entity. Represents persisted workout state for session continuity. This model handles only data persistence - business logic remains in the Domain layer.

#### Public Properties

##### `table: string`

##### `associations: { readonly profiles: { readonly type: "belongs_to"; readonly key: "profile_id"; }; }`

##### `profileId: string`

##### `state: string`

##### `createdAt: Date`

##### `updatedAt: Date`

##### `profile: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/node_modules/@nozbe/watermelondb/Relation/index").default<import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/app/db/model/Profile").Profile>`

---

## File: `src/app/providers/__tests__/AppServicesProvider.test.tsx`

_No exported classes found in this file._

## File: `src/app/providers/__tests__/SnackbarProvider.test.tsx`

_No exported classes found in this file._

## File: `src/app/providers/__tests__/ThemeProvider.test.tsx`

_No exported classes found in this file._

## File: `src/app/store/__tests__/LocalStorageAdapter.test.ts`

_No exported classes found in this file._

## File: `src/app/store/__tests__/profileStore.test.ts`

_No exported classes found in this file._

## File: `src/app/store/__tests__/themeStore.test.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useAnalysisPageData.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useDataExport.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useGenerateFullReport.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useGetFrequencyAnalysis.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useGetStrengthProgress.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useGetVolumeAnalysis.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useGetWeightProgress.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/useProgressCharts.ts`

_No exported classes found in this file._

## File: `src/features/analysis/query-services/AnalysisQueryService.ts`

### class `AnalysisQueryService`

**Description:**
Query service that acts as an adapter between the Analysis Application Layer and React Query. This service handles the unwrapping of Result objects returned by the AnalysisService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all analysis-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {AnalysisService} analysisService - 
 */
constructor(@inject('AnalysisService') private readonly analysisService: AnalysisService)
```

#### Public Instance Methods

##### `getStrengthProgress()`

```typescript
/**
 * Generates strength progress analysis for a specific exercise over a date range.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<StrengthProgressData>} Promise resolving to strength progress data
 * @throws When the operation fails
 */
async getStrengthProgress(
    profileId: string,
    exerciseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StrengthProgressData>
```

##### `getWeightProgress()`

```typescript
/**
 * Generates body weight progression analysis over a date range.
 *
 * @param {string} profileId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<WeightProgressData>} Promise resolving to weight progress data
 * @throws When the operation fails
 */
async getWeightProgress(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeightProgressData>
```

##### `getVolumeAnalysis()`

```typescript
/**
 * Generates training volume analysis over a date range.
 *
 * @param {string} profileId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<VolumeAnalysisData>} Promise resolving to volume analysis data
 * @throws When the operation fails
 */
async getVolumeAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VolumeAnalysisData>
```

##### `getFrequencyAnalysis()`

```typescript
/**
 * Generates workout frequency analysis over a date range.
 *
 * @param {string} profileId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<FrequencyAnalysisData>} Promise resolving to frequency analysis data
 * @throws When the operation fails
 */
async getFrequencyAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FrequencyAnalysisData>
```

---

## File: `src/features/analysis/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/analysis/services/AnalysisService.test.ts`

_No exported classes found in this file._

## File: `src/features/analysis/services/AnalysisService.ts`

### class `AnalysisService`

**Description:**
Service responsible for generating training and progress analytics. This service provides read-only analysis capabilities for user data, aggregating information from multiple domains to provide insights.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IWorkoutLogRepository} workoutLogRepository - 
 * @param {IMaxLogRepository} maxLogRepository - 
 * @param {IBodyMetricsRepository} bodyMetricsRepository - 
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository') private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ITrainingPlanRepository') private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `getStrengthProgress()`

```typescript
/**
 * Generates strength progress analysis for a specific exercise over a date range.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<Result<StrengthProgressData, ApplicationError>>} Result containing strength progress data or an error
 */
async getStrengthProgress(
    profileId: string,
    exerciseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<StrengthProgressData, ApplicationError>>
```

##### `getWeightProgress()`

```typescript
/**
 * Generates body weight progression analysis over a date range.
 *
 * @param {string} profileId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<Result<WeightProgressData, ApplicationError>>} Result containing weight progress data or an error
 */
async getWeightProgress(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<WeightProgressData, ApplicationError>>
```

##### `getVolumeAnalysis()`

```typescript
/**
 * Generates training volume analysis over a date range.
 *
 * @param {string} profileId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<Result<VolumeAnalysisData, ApplicationError>>} Result containing volume analysis data or an error
 */
async getVolumeAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<VolumeAnalysisData, ApplicationError>>
```

##### `getFrequencyAnalysis()`

```typescript
/**
 * Generates workout frequency analysis over a date range.
 *
 * @param {string} profileId - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @returns {Promise<Result<FrequencyAnalysisData, ApplicationError>>} Result containing frequency analysis data or an error
 */
async getFrequencyAnalysis(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<FrequencyAnalysisData, ApplicationError>>
```

---

## File: `src/features/analysis/services/index.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/data/BodyMetricsRepository.ts`

### class `BodyMetricsRepository`

**Description:**
Concrete implementation of IBodyMetricsRepository using WatermelonDB. Handles persistence and retrieval of WeightRecord and HeightRecord domain models by delegating hydration to the models' static hydrate methods and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new BodyMetricsRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `saveWeight()`

```typescript
/**
 * Persists a WeightRecordModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {WeightRecordModel} record - 
 * @returns {Promise<WeightRecordModel>} Promise resolving to the saved WeightRecordModel
 */
async saveWeight(record: WeightRecordModel): Promise<WeightRecordModel>
```

##### `saveHeight()`

```typescript
/**
 * Persists a HeightRecordModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {HeightRecordModel} record - 
 * @returns {Promise<HeightRecordModel>} Promise resolving to the saved HeightRecordModel
 */
async saveHeight(record: HeightRecordModel): Promise<HeightRecordModel>
```

##### `findWeightHistory()`

```typescript
/**
 * Retrieves all weight records for a given profile ID and hydrates them into WeightRecordModel instances using the model's static hydrate method, ordered by date descending.
 *
 * @param {string} profileId - 
 * @returns {Promise<WeightRecordModel[]>} Promise resolving to an array of WeightRecordModel instances
 */
async findWeightHistory(profileId: string): Promise<WeightRecordModel[]>
```

##### `findHeightHistory()`

```typescript
/**
 * Retrieves all height records for a given profile ID and hydrates them into HeightRecordModel instances using the model's static hydrate method, ordered by date descending.
 *
 * @param {string} profileId - 
 * @returns {Promise<HeightRecordModel[]>} Promise resolving to an array of HeightRecordModel instances
 */
async findHeightHistory(profileId: string): Promise<HeightRecordModel[]>
```

##### `findLatestWeight()`

```typescript
/**
 * Retrieves the most recent weight record for a given profile ID and hydrates it into a WeightRecordModel using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<WeightRecordModel | undefined>} Promise resolving to the latest WeightRecordModel if found, undefined otherwise
 */
async findLatestWeight(profileId: string): Promise<WeightRecordModel | undefined>
```

##### `findWeightById()`

```typescript
/**
 * Retrieves a weight record by its ID and hydrates it into a WeightRecordModel instance.
 *
 * @param {string} recordId - 
 * @returns {Promise<WeightRecordModel | undefined>} Promise resolving to the WeightRecordModel if found, undefined otherwise
 */
async findWeightById(recordId: string): Promise<WeightRecordModel | undefined>
```

##### `findHeightById()`

```typescript
/**
 * Retrieves a height record by its ID and hydrates it into a HeightRecordModel instance.
 *
 * @param {string} recordId - 
 * @returns {Promise<HeightRecordModel | undefined>} Promise resolving to the HeightRecordModel if found, undefined otherwise
 */
async findHeightById(recordId: string): Promise<HeightRecordModel | undefined>
```

##### `deleteWeight()`

```typescript
/**
 * Deletes a weight record by ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise that resolves when the deletion is complete
 */
async deleteWeight(id: string): Promise<void>
```

##### `deleteHeight()`

```typescript
/**
 * Deletes a height record by ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise that resolves when the deletion is complete
 */
async deleteHeight(id: string): Promise<void>
```

---

## File: `src/features/body-metrics/data/index.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/domain/HeightRecordModel.ts`

### class `HeightRecordModel`

**Description:**
Rich domain model representing a height measurement record. Encapsulates business logic for height tracking and conversions.

#### Constructor

##### Constructor

```typescript
/**
 * Protected constructor enforces the use of the static hydrate method.
 *
 * @param {{ id: string; profileId: string; date: Date; height: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 */
protected constructor(props: HeightRecordData)
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `date: Date`

##### `height: number`

##### `notes: string | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Static factory method for creating HeightRecordModel instances from plain data.
 *
 * @param {{ id: string; profileId: string; date: Date; height: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 * @returns {HeightRecordModel} A new HeightRecordModel instance.
 */
public static hydrate(props: HeightRecordData): HeightRecordModel
```

#### Public Instance Methods

##### `cloneWithNewHeight()`

```typescript
/**
 * Creates a new instance with an updated height value.
 *
 * @param {number} newHeight - 
 * @returns {HeightRecordModel} A new HeightRecordModel instance with the updated height.
 */
cloneWithNewHeight(newHeight: number): HeightRecordModel
```

##### `cloneWithNewNotes()`

```typescript
/**
 * Creates a new instance with updated notes.
 *
 * @param {string} newNotes - 
 * @returns {HeightRecordModel} A new HeightRecordModel instance with updated notes.
 */
cloneWithNewNotes(newNotes: string): HeightRecordModel
```

##### `isTallerThan()`

```typescript
/**
 * Compares this height record with another to determine if it's taller.
 *
 * @param {HeightRecordModel} other - 
 * @returns {boolean} True if this record's height is greater than the other's.
 */
isTallerThan(other: HeightRecordModel): boolean
```

##### `wasRecordedBefore()`

```typescript
/**
 * Checks if this height record was recorded before a specific date.
 *
 * @param {Date} date - 
 * @returns {boolean} True if this record's date is before the provided date.
 */
wasRecordedBefore(date: Date): boolean
```

##### `getHeightIn()`

```typescript
/**
 * Converts the height to different units.
 *
 * @param {"cm" | "inches"} unit - 
 * @returns {number} The height converted to the specified unit.
 */
getHeightIn(unit: 'cm' | 'inches'): number
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this HeightRecordModel.
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; date: Date; height: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} The plain HeightRecordData object.
 */
toPlainObject(): HeightRecordData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against the HeightRecord Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; date: Date; height: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }>} Validation result with success flag and potential errors.
 */
validate()
```

---

## File: `src/features/body-metrics/domain/IBodyMetricsRepository.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/domain/index.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/domain/WeightRecordModel.ts`

### class `WeightRecordModel`

**Description:**
Rich domain model representing a bodyweight measurement record. Encapsulates business logic for weight tracking and conversions.

#### Constructor

##### Constructor

```typescript
/**
 * Protected constructor enforces the use of the static hydrate method.
 *
 * @param {{ id: string; profileId: string; date: Date; weight: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 */
protected constructor(props: WeightRecordData)
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `date: Date`

##### `weight: number`

##### `notes: string | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Static factory method for creating WeightRecordModel instances from plain data.
 *
 * @param {{ id: string; profileId: string; date: Date; weight: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 * @returns {WeightRecordModel} A new WeightRecordModel instance.
 */
public static hydrate(props: WeightRecordData): WeightRecordModel
```

#### Public Instance Methods

##### `cloneWithNewWeight()`

```typescript
/**
 * Creates a new instance with an updated weight value.
 *
 * @param {number} newWeight - 
 * @returns {WeightRecordModel} A new WeightRecordModel instance with the updated weight.
 */
cloneWithNewWeight(newWeight: number): WeightRecordModel
```

##### `cloneWithNewNotes()`

```typescript
/**
 * Creates a new instance with updated notes.
 *
 * @param {string} newNotes - 
 * @returns {WeightRecordModel} A new WeightRecordModel instance with updated notes.
 */
cloneWithNewNotes(newNotes: string): WeightRecordModel
```

##### `isHeavierThan()`

```typescript
/**
 * Compares this weight record with another to determine if it's heavier.
 *
 * @param {WeightRecordModel} other - 
 * @returns {boolean} True if this record's weight is greater than the other's.
 */
isHeavierThan(other: WeightRecordModel): boolean
```

##### `wasRecordedBefore()`

```typescript
/**
 * Checks if this weight record was recorded before a specific date.
 *
 * @param {Date} date - 
 * @returns {boolean} True if this record's date is before the provided date.
 */
wasRecordedBefore(date: Date): boolean
```

##### `getWeightIn()`

```typescript
/**
 * Converts the weight to different units.
 *
 * @param {"kg" | "lbs"} unit - 
 * @returns {number} The weight converted to the specified unit.
 */
getWeightIn(unit: 'kg' | 'lbs'): number
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this WeightRecordModel.
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; date: Date; weight: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} The plain WeightRecordData object.
 */
toPlainObject(): WeightRecordData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against the WeightRecord Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; date: Date; weight: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; }>} Validation result with success flag and potential errors.
 */
validate()
```

---

## File: `src/features/body-metrics/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useAddHeightRecord.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useAddWeightRecord.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useBodyProgressAnalyzer.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useDeleteHeightRecord.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useDeleteWeightRecord.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useGetHeightHistory.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useGetLatestWeight.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useGetWeightHistory.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useMetricConversions.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/useUpdateWeightRecord.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/query-services/BodyMetricsQueryService.ts`

### class `BodyMetricsQueryService`

**Description:**
Query service that acts as an adapter between the Body Metrics Application Layer and React Query. This service handles the unwrapping of Result objects returned by the BodyMetricsService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all body metrics-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {BodyMetricsService} bodyMetricsService - 
 */
constructor(
    @inject('BodyMetricsService') private readonly bodyMetricsService: BodyMetricsService
  )
```

#### Public Instance Methods

##### `addWeightRecord()`

```typescript
/**
 * Adds a new weight record for a user profile.
 *
 * @param {string} profileId - 
 * @param {number} weight - 
 * @param {Date} date - 
 * @param {string | undefined} notes - 
 * @returns {Promise<WeightRecordModel>} Promise resolving to the created WeightRecordModel
 * @throws When the operation fails
 */
async addWeightRecord(
    profileId: string,
    weight: number,
    date: Date,
    notes?: string
  ): Promise<WeightRecordModel>
```

##### `addHeightRecord()`

```typescript
/**
 * Adds a new height record for a user profile.
 *
 * @param {string} profileId - 
 * @param {number} height - 
 * @param {Date} date - 
 * @param {string | undefined} notes - 
 * @returns {Promise<HeightRecordModel>} Promise resolving to the created HeightRecordModel
 * @throws When the operation fails
 */
async addHeightRecord(
    profileId: string,
    height: number,
    date: Date,
    notes?: string
  ): Promise<HeightRecordModel>
```

##### `getWeightHistory()`

```typescript
/**
 * Retrieves the weight history for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {default<WeightRecord>} Query for WeightRecord models for reactive observation
 * @throws When the operation fails
 */
getWeightHistory(profileId: string): Query<WeightRecord>
```

##### `getHeightHistory()`

```typescript
/**
 * Retrieves the height history for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {default<HeightRecord>} Query for HeightRecord models for reactive observation
 * @throws When the operation fails
 */
getHeightHistory(profileId: string): Query<HeightRecord>
```

##### `getLatestWeight()`

```typescript
/**
 * Retrieves the latest weight record for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<WeightRecordModel | undefined>} Promise resolving to the latest WeightRecordModel or undefined
 * @throws When the operation fails
 */
async getLatestWeight(profileId: string): Promise<WeightRecordModel | undefined>
```

##### `getLatestWeightQuery()`

```typescript
/**
 * Gets a WatermelonDB query for the latest weight record of a specific profile.
 *
 * @param {string} profileId - 
 * @returns {default<WeightRecord>} Query for WeightRecord models for reactive observation (sorted by date descending, limit 1)
 */
getLatestWeightQuery(profileId: string): Query<WeightRecord>
```

##### `updateWeightRecord()`

```typescript
/**
 * Updates an existing weight record.
 *
 * @param {string} recordId - 
 * @param {number | undefined} newWeight - 
 * @param {string | undefined} newNotes - 
 * @returns {Promise<WeightRecordModel>} Promise resolving to the updated WeightRecordModel
 * @throws When the operation fails
 */
async updateWeightRecord(
    recordId: string,
    newWeight?: number,
    newNotes?: string
  ): Promise<WeightRecordModel>
```

##### `deleteWeightRecord()`

```typescript
/**
 * Deletes a weight record permanently.
 *
 * @param {string} recordId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteWeightRecord(recordId: string): Promise<void>
```

##### `deleteHeightRecord()`

```typescript
/**
 * Deletes a height record permanently.
 *
 * @param {string} recordId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteHeightRecord(recordId: string): Promise<void>
```

---

## File: `src/features/body-metrics/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/services/BodyMetricsService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/services/BodyMetricsService.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/services/BodyMetricsService.ts`

### class `BodyMetricsService`

**Description:**
Application service responsible for orchestrating body metrics operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to weight and height tracking.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IBodyMetricsRepository} bodyMetricsRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IBodyMetricsRepository') private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `addWeightRecord()`

```typescript
/**
 * Adds a new weight record for a user profile.
 *
 * @param {string} profileId - 
 * @param {number} weight - 
 * @param {Date} date - 
 * @param {string | undefined} notes - 
 * @returns {Promise<Result<WeightRecordModel, ApplicationError>>} A Result containing the created WeightRecordModel or an error
 */
async addWeightRecord(
    profileId: string,
    weight: number,
    date: Date,
    notes?: string
  ): Promise<Result<WeightRecordModel, ApplicationError>>
```

##### `addHeightRecord()`

```typescript
/**
 * Adds a new height record for a user profile.
 *
 * @param {string} profileId - 
 * @param {number} height - 
 * @param {Date} date - 
 * @param {string | undefined} notes - 
 * @returns {Promise<Result<HeightRecordModel, ApplicationError>>} A Result containing the created HeightRecordModel or an error
 */
async addHeightRecord(
    profileId: string,
    height: number,
    date: Date,
    notes?: string
  ): Promise<Result<HeightRecordModel, ApplicationError>>
```

##### `getWeightHistory()`

```typescript
/**
 * Retrieves the weight history for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<WeightRecordModel[], ApplicationError>>} A Result containing an array of WeightRecordModels or an error
 */
async getWeightHistory(
    profileId: string
  ): Promise<Result<WeightRecordModel[], ApplicationError>>
```

##### `getHeightHistory()`

```typescript
/**
 * Retrieves the height history for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<HeightRecordModel[], ApplicationError>>} A Result containing an array of HeightRecordModels or an error
 */
async getHeightHistory(
    profileId: string
  ): Promise<Result<HeightRecordModel[], ApplicationError>>
```

##### `getLatestWeight()`

```typescript
/**
 * Retrieves the latest weight record for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<WeightRecordModel | undefined, ApplicationError>>} A Result containing the latest WeightRecordModel or an error
 */
async getLatestWeight(
    profileId: string
  ): Promise<Result<WeightRecordModel | undefined, ApplicationError>>
```

##### `updateWeightRecord()`

```typescript
/**
 * Updates an existing weight record.
 *
 * @param {string} recordId - 
 * @param {number | undefined} newWeight - 
 * @param {string | undefined} newNotes - 
 * @returns {Promise<Result<WeightRecordModel, ApplicationError>>} A Result containing the updated WeightRecordModel or an error
 */
async updateWeightRecord(
    recordId: string,
    newWeight?: number,
    newNotes?: string
  ): Promise<Result<WeightRecordModel, ApplicationError>>
```

##### `deleteWeightRecord()`

```typescript
/**
 * Deletes a weight record permanently.
 *
 * @param {string} recordId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteWeightRecord(recordId: string): Promise<Result<void, ApplicationError>>
```

##### `deleteHeightRecord()`

```typescript
/**
 * Deletes a height record permanently.
 *
 * @param {string} recordId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteHeightRecord(recordId: string): Promise<Result<void, ApplicationError>>
```

---

## File: `src/features/body-metrics/services/index.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useDashboardData.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useGetDashboardData.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useGetDashboardMetrics.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useGetProgressTrends.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useGetRecentActivity.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useWorkoutStreak.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/useWorkoutSummaryCard.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/query-services/DashboardQueryService.ts`

### class `DashboardQueryService`

**Description:**
Query service that acts as an adapter between the Dashboard Application Layer and React Query. This service handles the unwrapping of Result objects returned by the DashboardService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all dashboard-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {DashboardService} dashboardService - 
 */
constructor(@inject('DashboardService') private readonly dashboardService: DashboardService)
```

#### Public Instance Methods

##### `getDashboardData()`

```typescript
/**
 * Generates complete dashboard data for a profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<DashboardData>} Promise resolving to complete dashboard data
 * @throws When the operation fails
 */
async getDashboardData(profileId: string): Promise<DashboardData>
```

##### `generateDashboardMetrics()`

```typescript
/**
 * Generates key metrics for the dashboard.
 *
 * @param {string} profileId - 
 * @returns {Promise<DashboardMetrics>} Promise resolving to dashboard metrics
 * @throws When the operation fails
 */
async generateDashboardMetrics(profileId: string): Promise<DashboardMetrics>
```

##### `generateRecentActivity()`

```typescript
/**
 * Generates recent activity data for the dashboard.
 *
 * @param {string} profileId - 
 * @returns {Promise<RecentActivity>} Promise resolving to recent activity data
 * @throws When the operation fails
 */
async generateRecentActivity(profileId: string): Promise<RecentActivity>
```

##### `generateProgressTrends()`

```typescript
/**
 * Generates progress trends for dashboard charts.
 *
 * @param {string} profileId - 
 * @returns {Promise<ProgressTrends>} Promise resolving to progress trends
 * @throws When the operation fails
 */
async generateProgressTrends(profileId: string): Promise<ProgressTrends>
```

---

## File: `src/features/dashboard/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/services/DashboardService.test.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/services/DashboardService.ts`

### class `DashboardService`

**Description:**
Service responsible for generating dashboard data and analytics. This service aggregates data from multiple domains to provide comprehensive overview information for users.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IProfileRepository} profileRepository - 
 * @param {IWorkoutLogRepository} workoutLogRepository - 
 * @param {IMaxLogRepository} maxLogRepository - 
 * @param {IBodyMetricsRepository} bodyMetricsRepository - 
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository') private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ITrainingPlanRepository') private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `getDashboardData()`

```typescript
/**
 * Generates complete dashboard data for a profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<DashboardData, ApplicationError>>} Result containing dashboard data or an error
 */
async getDashboardData(profileId: string): Promise<Result<DashboardData, ApplicationError>>
```

##### `generateDashboardMetrics()`

```typescript
/**
 * Generates key metrics for the dashboard.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<DashboardMetrics, ApplicationError>>} Result containing dashboard metrics or an error
 */
async generateDashboardMetrics(
    profileId: string
  ): Promise<Result<DashboardMetrics, ApplicationError>>
```

##### `generateRecentActivity()`

```typescript
/**
 * Generates recent activity data for the dashboard.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<RecentActivity, ApplicationError>>} Result containing recent activity or an error
 */
async generateRecentActivity(
    profileId: string
  ): Promise<Result<RecentActivity, ApplicationError>>
```

##### `generateProgressTrends()`

```typescript
/**
 * Generates progress trends for dashboard charts.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<ProgressTrends, ApplicationError>>} Result containing progress trends or an error
 */
async generateProgressTrends(
    profileId: string
  ): Promise<Result<ProgressTrends, ApplicationError>>
```

---

## File: `src/features/dashboard/services/index.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/useDataIntegrityChecker.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/useExportData.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/useImportData.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/query-services/DataSyncQueryService.ts`

### class `DataSyncQueryService`

**Description:**
Query service that acts as an adapter between the Data Sync Application Layer and React Query. This service handles the unwrapping of Result objects returned by the DataSyncService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all data synchronization operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {DataSyncService} dataSyncService - 
 */
constructor(@inject('DataSyncService') private readonly dataSyncService: DataSyncService)
```

#### Public Instance Methods

##### `exportData()`

```typescript
/**
 * Exports all user data to a structured format. Uses chunking to prevent UI blocking during large exports.
 *
 * @param {string} profileId - 
 * @param {((status: ExportStatus) => void) | undefined} onProgress - 
 * @returns {Promise<ExportData>} Promise resolving to export data
 * @throws When the operation fails
 */
async exportData(
    profileId: string,
    onProgress?: (status: ExportStatus) => void
  ): Promise<ExportData>
```

##### `importData()`

```typescript
/**
 * Imports data from an export file. Uses chunking to prevent UI blocking during large imports.
 *
 * @param {ExportData} importData - 
 * @param {((status: ImportStatus) => void) | undefined} onProgress - 
 * @returns {Promise<ImportStatus>} Promise resolving to import status
 * @throws When the operation fails or conflicts are detected
 */
async importData(
    importData: ExportData,
    onProgress?: (status: ImportStatus) => void
  ): Promise<ImportStatus>
```

---

## File: `src/features/data-sync/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/services/DataSyncService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/services/DataSyncService.test.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/services/DataSyncService.ts`

### class `DataSyncService`

**Description:**
Service responsible for data synchronization operations including import and export. Implements chunking techniques for long-running operations to prevent UI freezing. This service handles bulk operations across multiple domains.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IProfileRepository} profileRepository - 
 * @param {IExerciseRepository} exerciseRepository - 
 * @param {IExerciseTemplateRepository} exerciseTemplateRepository - 
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 * @param {IWorkoutLogRepository} workoutLogRepository - 
 * @param {IMaxLogRepository} maxLogRepository - 
 * @param {IBodyMetricsRepository} bodyMetricsRepository - 
 * @param {ILogger} logger - 
 * @param {default} database - 
 */
constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('IExerciseRepository') private readonly exerciseRepository: IExerciseRepository,
    @inject('IExerciseTemplateRepository') private readonly exerciseTemplateRepository: IExerciseTemplateRepository,
    @inject('ITrainingPlanRepository') private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository') private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('BlueprintFitnessDB') private readonly database: Database = database
  )
```

#### Public Instance Methods

##### `exportData()`

```typescript
/**
 * Exports all user data to a structured format. Uses chunking to prevent UI blocking during large exports.
 *
 * @param {string} profileId - 
 * @param {((status: ExportStatus) => void) | undefined} onProgress - 
 * @returns {Promise<Result<ExportData, ApplicationError>>} Result containing export data or an error
 */
async exportData(
    profileId: string,
    onProgress?: (status: ExportStatus) => void
  ): Promise<Result<ExportData, ApplicationError>>
```

##### `importData()`

```typescript
/**
 * Imports data from an export file. Uses chunking to prevent UI blocking during large imports.
 *
 * @param {ExportData} importData - 
 * @param {((status: ImportStatus) => void) | undefined} onProgress - 
 * @returns {Promise<Result<ImportStatus, ApplicationError>>} Result containing import status or an error
 */
async importData(
    importData: ExportData,
    onProgress?: (status: ImportStatus) => void
  ): Promise<Result<ImportStatus, ApplicationError>>
```

---

## File: `src/features/data-sync/services/ExportService.ts`

### class `ExportService`

**Description:**
Application service responsible for data export functionality. This service handles the conversion and export of various data types to different formats like JSON, CSV, and Excel.

#### Constructor

##### Constructor

```typescript
/**
 * @param {ILogger} logger - 
 */
constructor(
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `exportData()`

```typescript
/**
 * Exports data to the specified format
 *
 * @param {T[]} data - 
 * @param {ExportOptions} options - 
 * @returns {Promise<Result<ExportResult, ApplicationError>>} A Result containing the export data or an error
 */
async exportData<T>(
    data: T[],
    options: ExportOptions
  ): Promise<Result<ExportResult, ApplicationError>>
```

##### `validateExportOptions()`

```typescript
/**
 * Validates export options
 *
 * @param {ExportOptions} options - 
 * @returns {Promise<Result<void, ApplicationError>>} A Promise resolving to a Result indicating success or validation errors
 */
async validateExportOptions(options: ExportOptions): Promise<Result<void, ApplicationError>>
```

---

## File: `src/features/data-sync/services/index.ts`

_No exported classes found in this file._

## File: `src/features/exercise/data/ExerciseRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/data/ExerciseRepository.ts`

### class `ExerciseRepository`

**Description:**
Concrete implementation of IExerciseRepository using WatermelonDB. Handles persistence and retrieval of Exercise domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new ExerciseRepository instance.
 *
 * @param {default} database - 
 */
constructor(database: Database = db)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists an ExerciseModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {ExerciseModel} exercise - 
 * @returns {Promise<ExerciseModel>} Promise resolving to the saved ExerciseModel
 */
async save(exercise: ExerciseModel): Promise<ExerciseModel>
```

##### `saveBulk()`

```typescript
/**
 * Persists multiple ExerciseModels to the database in a single transaction by converting them to plain data using each model's toPlainObject method.
 *
 * @param {ExerciseModel[]} exercises - 
 * @returns {Promise<void>} Promise resolving when all exercises are saved
 */
async saveBulk(exercises: ExerciseModel[]): Promise<void>
```

##### `findById()`

```typescript
/**
 * Retrieves an exercise by profile ID and exercise ID, and hydrates it into an ExerciseModel using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @param {string} id - 
 * @returns {Promise<ExerciseModel | undefined>} Promise resolving to ExerciseModel if found, undefined otherwise
 */
async findById(profileId: string, id: string): Promise<ExerciseModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple exercises by profile ID and exercise IDs, and hydrates them into ExerciseModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @param {string[]} ids - 
 * @returns {Promise<ExerciseModel[]>} Promise resolving to array of ExerciseModels
 */
async findByIds(profileId: string, ids: string[]): Promise<ExerciseModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all exercises for a profile ID and hydrates them into ExerciseModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<ExerciseModel[]>} Promise resolving to array of ExerciseModels
 */
async findAll(profileId: string): Promise<ExerciseModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes an exercise by profile ID and exercise ID from the database.
 *
 * @param {string} profileId - 
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(profileId: string, id: string): Promise<void>
```

---

## File: `src/features/exercise/data/ExerciseTemplateRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/data/ExerciseTemplateRepository.ts`

### class `ExerciseTemplateRepository`

**Description:**
Concrete implementation of IExerciseTemplateRepository using WatermelonDB. Handles persistence and retrieval of ExerciseTemplate domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new ExerciseTemplateRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists an ExerciseTemplateModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {ExerciseTemplateModel} template - 
 * @returns {Promise<ExerciseTemplateModel>} Promise resolving to the saved ExerciseTemplateModel
 */
async save(template: ExerciseTemplateModel): Promise<ExerciseTemplateModel>
```

##### `findById()`

```typescript
/**
 * Retrieves an exercise template by its ID and hydrates it into an ExerciseTemplateModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<ExerciseTemplateModel | undefined>} Promise resolving to ExerciseTemplateModel if found, undefined otherwise
 */
async findById(id: string): Promise<ExerciseTemplateModel | undefined>
```

##### `findAll()`

```typescript
/**
 * Retrieves all exercise templates for a profile ID and hydrates them into ExerciseTemplateModels using the model's static hydrate method. Note: This implementation filters via the exercises relationship to maintain profile isolation.
 *
 * @param {string} profileId - 
 * @returns {Promise<ExerciseTemplateModel[]>} Promise resolving to array of ExerciseTemplateModels
 */
async findAll(profileId: string): Promise<ExerciseTemplateModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes an exercise template by its ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/exercise/data/index.ts`

_No exported classes found in this file._

## File: `src/features/exercise/domain/ExerciseModel.ts`

### class `ExerciseModel`

**Description:**
A domain model representing an exercise with its details, equipment requirements, muscle activation patterns, and substitution options.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }} props - 
 */
protected constructor(props: ExerciseData)
```

#### Public Properties

##### `profileId: string`

##### `name: string`

##### `description: string`

##### `category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"`

##### `movementType: "other" | "pull" | "push" | "static" | "dynamic"`

##### `movementPattern: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined`

##### `difficulty: "beginner" | "intermediate" | "advanced"`

##### `equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]`

##### `muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>`

##### `counterType: "reps" | "mins" | "secs"`

##### `jointType: "isolation" | "compound"`

##### `notes: string | undefined`

##### `substitutions: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/domain/value-objects/ExerciseSubstitution").ExerciseSubstitution[]`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new ExerciseModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }} props - 
 * @returns {ExerciseModel} A new ExerciseModel instance
 */
public static hydrate(props: ExerciseData): ExerciseModel
```

#### Public Instance Methods

##### `cloneWithUpdatedDetails()`

```typescript
/**
 * Creates a new exercise instance with updated details.
 *
 * @param {Partial<Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "profileId" | "createdAt" | "updatedAt">>} details - 
 * @returns {ExerciseModel} A new ExerciseModel instance with updated details
 */
cloneWithUpdatedDetails(
    details: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): ExerciseModel
```

##### `getPrimaryMuscleGroups()`

```typescript
/**
 * Gets muscle groups that are primarily activated by this exercise.
 *
 * @param {number} threshold - 
 * @returns {("chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes")[]} Array of primary muscle groups
 */
getPrimaryMuscleGroups(threshold = 0.75): MuscleGroup[]
```

##### `getActivatedMuscles()`

```typescript
/**
 * Gets muscle groups activated above the specified threshold.
 *
 * @param {number} threshold - 
 * @returns {("chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes")[]} Array of activated muscle groups
 */
getActivatedMuscles(threshold = 0.5): MuscleGroup[]
```

##### `getEquipment()`

```typescript
/**
 * Gets the equipment required for this exercise.
 *
 * @returns {("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]} Array of required equipment
 */
getEquipment(): Equipment[]
```

##### `getMovementType()`

```typescript
/**
 * Gets the movement type of this exercise.
 *
 * @returns {"other" | "pull" | "push" | "static" | "dynamic"} The exercise movement type
 */
getMovementType(): ExerciseMovementType
```

##### `getCategory()`

```typescript
/**
 * Gets the category of this exercise.
 *
 * @returns {"strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"} The exercise category
 */
getCategory(): ExerciseCategory
```

##### `getMovementPattern()`

```typescript
/**
 * Gets the movement pattern of this exercise.
 *
 * @returns {"verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined} The exercise movement pattern, or undefined if not set
 */
getMovementPattern(): ExerciseMovementPattern | undefined
```

##### `getDescription()`

```typescript
/**
 * Gets the description of this exercise.
 *
 * @returns {string} The exercise description
 */
getDescription(): string
```

##### `isBodyweight()`

```typescript
/**
 * Checks if this exercise uses only bodyweight.
 *
 * @returns {boolean} True if the exercise only requires bodyweight
 */
isBodyweight(): boolean
```

##### `requiresEquipment()`

```typescript
/**
 * Checks if this exercise requires specific equipment.
 *
 * @param {"other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step"} equipment - 
 * @returns {boolean} True if the exercise requires the specified equipment
 */
requiresEquipment(equipment: Equipment): boolean
```

##### `cloneWithAddedSubstitution()`

```typescript
/**
 * Creates a new exercise instance with an added substitution.
 *
 * @param {string} exerciseId - 
 * @param {number} priority - 
 * @param {string | undefined} reason - 
 * @returns {ExerciseModel} A new ExerciseModel instance with the added substitution
 */
cloneWithAddedSubstitution(exerciseId: string, priority: number, reason?: string): ExerciseModel
```

##### `cloneWithRemovedSubstitution()`

```typescript
/**
 * Creates a new exercise instance with a removed substitution.
 *
 * @param {string} exerciseId - 
 * @returns {ExerciseModel} A new ExerciseModel instance with the substitution removed
 */
cloneWithRemovedSubstitution(exerciseId: string): ExerciseModel
```

##### `cloneWithUpdatedSubstitution()`

```typescript
/**
 * Creates a new exercise instance with an updated substitution.
 *
 * @param {{ exerciseId: string; priority: number; reason?: string | undefined; }} updatedSub - 
 * @returns {ExerciseModel} A new ExerciseModel instance with the updated substitution
 */
cloneWithUpdatedSubstitution(updatedSub: ExerciseSubstitutionData): ExerciseModel
```

##### `getSortedSubstitutions()`

```typescript
/**
 * Gets substitutions sorted by priority (highest first).
 *
 * @returns {ExerciseSubstitution[]} Array of substitutions sorted by priority
 */
getSortedSubstitutions(): ExerciseSubstitution[]
```

##### `getBestSubstitution()`

```typescript
/**
 * Gets the highest priority substitution for this exercise.
 *
 * @returns {ExerciseSubstitution | undefined} The best substitution, or undefined if none exist
 */
getBestSubstitution(): ExerciseSubstitution | undefined
```

##### `getSimilarityScore()`

```typescript
/**
 * Calculates a similarity score between this exercise and another.
 *
 * @param {ExerciseModel} otherExercise - 
 * @returns {number} A similarity score between 0 and 1
 */
getSimilarityScore(otherExercise: ExerciseModel): number
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this ExerciseModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }} The plain ExerciseData object
 */
toPlainObject(): ExerciseData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/exercise/domain/ExerciseTemplateModel.ts`

### class `ExerciseTemplateModel`

**Description:**
A domain model representing a template for exercise execution with predefined set configurations. Links an exercise with specific set parameters for consistent workout planning.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; name: string; exerciseId: string; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 */
protected constructor(props: ExerciseTemplateData)
```

#### Public Properties

##### `name: string`

##### `exerciseId: string`

##### `setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }`

##### `notes: string | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new ExerciseTemplateModel instance from plain data.
 *
 * @param {{ id: string; name: string; exerciseId: string; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 * @returns {ExerciseTemplateModel} A new ExerciseTemplateModel instance
 */
public static hydrate(props: ExerciseTemplateData): ExerciseTemplateModel
```

#### Public Instance Methods

##### `cloneWithNewName()`

```typescript
/**
 * Creates a new template instance with an updated name.
 *
 * @param {string} newName - 
 * @returns {ExerciseTemplateModel} A new ExerciseTemplateModel instance with the updated name
 */
cloneWithNewName(newName: string): ExerciseTemplateModel
```

##### `cloneWithNewNotes()`

```typescript
/**
 * Creates a new template instance with updated notes.
 *
 * @param {string | undefined} newNotes - 
 * @returns {ExerciseTemplateModel} A new ExerciseTemplateModel instance with the updated notes
 */
cloneWithNewNotes(newNotes?: string): ExerciseTemplateModel
```

##### `cloneWithNewSetConfiguration()`

```typescript
/**
 * Creates a new template instance with an updated set configuration.
 *
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} newSetConfiguration - 
 * @returns {ExerciseTemplateModel} A new ExerciseTemplateModel instance with the updated configuration
 */
cloneWithNewSetConfiguration(
    newSetConfiguration: AnySetConfigurationData
  ): ExerciseTemplateModel
```

##### `getTotalSets()`

```typescript
/**
 * Gets the total number of sets defined in this template.
 *
 * @returns {number} The total number of sets
 */
getTotalSets(): number
```

##### `getSetSummary()`

```typescript
/**
 * Gets a human-readable summary of the set configuration.
 *
 * @returns {string} A string summarizing the set structure (e.g., "3x8-12")
 */
getSetSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * Gets the estimated duration for completing this template.
 *
 * @param {number | undefined} timePerRep - 
 * @param {number | undefined} baseTimePerSet - 
 * @returns {number} Estimated duration in seconds
 */
getEstimatedDurationSeconds(timePerRep?: number, baseTimePerSet?: number): number
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * Gets a simplified RPE curve for this template's set configuration.
 *
 * @returns {number[]} Array of RPE values, one for each set
 */
getEstimatedRPECurve(): number[]
```

##### `getSetConfigurationType()`

```typescript
/**
 * Gets the type of set configuration used in this template.
 *
 * @returns {string} The set configuration type
 */
getSetConfigurationType(): string
```

##### `hasNotes()`

```typescript
/**
 * Checks if this template has notes.
 *
 * @returns {boolean} True if notes are present
 */
hasNotes(): boolean
```

##### `getDisplayName()`

```typescript
/**
 * Gets the template display name.
 *
 * @returns {string} The template name
 */
getDisplayName(): string
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this ExerciseTemplateModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; name: string; exerciseId: string; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} The plain ExerciseTemplateData object
 */
toPlainObject(): ExerciseTemplateData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; name: string; exerciseId: string; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; createdAt: Date; updatedAt: Date; notes?: string | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/exercise/domain/IExerciseRepository.ts`

_No exported classes found in this file._

## File: `src/features/exercise/domain/IExerciseTemplateRepository.ts`

_No exported classes found in this file._

## File: `src/features/exercise/domain/index.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useAddSubstitution.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useCachedExerciseData.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useCreateExercise.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useDeleteExercise.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useExerciseInstructions.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useExercisePerformanceOverview.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useExerciseSearch.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useExerciseStatistics.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useExerciseWizard.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useGetExercise.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useGetExercises.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useGetExercisesByIds.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useRecentExercises.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useRemoveSubstitution.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useSaveBulkExercises.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/useUpdateExercise.ts`

_No exported classes found in this file._

## File: `src/features/exercise/query-services/ExerciseQueryService.ts`

### class `ExerciseQueryService`

**Description:**
Query service that acts as an adapter between the Exercise Application Layer and React Query. This service handles the unwrapping of Result objects returned by the ExerciseService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all exercise-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {ExerciseService} exerciseService - 
 */
constructor(@inject('ExerciseService') private readonly exerciseService: ExerciseService)
```

#### Public Instance Methods

##### `createExercise()`

```typescript
/**
 * Creates a new exercise for a profile.
 *
 * @param {Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "createdAt" | "updatedAt">} exerciseData - 
 * @returns {Promise<ExerciseModel | null>} Promise resolving to the created ExerciseModel
 * @throws When the operation fails
 */
async createExercise(
    exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExerciseModel | null>
```

##### `getExercise()`

```typescript
/**
 * Retrieves an exercise by its ID for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @returns {Promise<ExerciseModel>} Promise resolving to the ExerciseModel
 * @throws When the operation fails
 */
async getExercise(profileId: string, exerciseId: string): Promise<ExerciseModel>
```

##### `getAllExercises()`

```typescript
/**
 * Retrieves all exercises for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {default<Exercise>} Query for Exercise models for reactive observation
 * @throws When the operation fails
 */
getAllExercises(profileId: string): Query<Exercise>
```

##### `getExercisesByIds()`

```typescript
/**
 * Retrieves multiple exercises by their IDs for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string[]} exerciseIds - 
 * @returns {default<Exercise>} Query for Exercise models for reactive observation
 * @throws When the operation fails
 */
getExercisesByIds(profileId: string, exerciseIds: string[]): Query<Exercise>
```

##### `updateExercise()`

```typescript
/**
 * Updates an existing exercise.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {Partial<Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "profileId" | "createdAt" | "updatedAt">>} updates - 
 * @returns {Promise<ExerciseModel>} Promise resolving to the updated ExerciseModel
 * @throws When the operation fails
 */
async updateExercise(
    profileId: string,
    exerciseId: string,
    updates: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ExerciseModel>
```

##### `addSubstitution()`

```typescript
/**
 * Adds a substitution to an existing exercise.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {string} substituteExerciseId - 
 * @param {number} priority - 
 * @param {string | undefined} reason - 
 * @returns {Promise<ExerciseModel>} Promise resolving to the updated ExerciseModel
 * @throws When the operation fails
 */
async addSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string,
    priority: number,
    reason?: string
  ): Promise<ExerciseModel>
```

##### `removeSubstitution()`

```typescript
/**
 * Removes a substitution from an existing exercise.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {string} substituteExerciseId - 
 * @returns {Promise<ExerciseModel>} Promise resolving to the updated ExerciseModel
 * @throws When the operation fails
 */
async removeSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string
  ): Promise<ExerciseModel>
```

##### `deleteExercise()`

```typescript
/**
 * Permanently deletes an exercise from the system.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteExercise(profileId: string, exerciseId: string): Promise<void>
```

##### `saveBulkExercises()`

```typescript
/**
 * Saves multiple exercises in bulk.
 *
 * @param {ExerciseModel[]} exercises - 
 * @returns {Promise<void>} Promise resolving when bulk save is complete
 * @throws When the operation fails
 */
async saveBulkExercises(exercises: ExerciseModel[]): Promise<void>
```

---

## File: `src/features/exercise/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/exercise/services/ExerciseService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/services/ExerciseService.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/services/ExerciseService.ts`

### class `ExerciseService`

**Description:**
Application service responsible for orchestrating exercise-related operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to exercise management.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IExerciseRepository} exerciseRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IExerciseRepository') private readonly exerciseRepository: IExerciseRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `createExercise()`

```typescript
/**
 * Creates a new exercise for a profile.
 *
 * @param {Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "createdAt" | "updatedAt">} exerciseData - 
 * @returns {Promise<Result<ExerciseModel, ApplicationError>>} A Result containing the created ExerciseModel or an error
 */
async createExercise(
    exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<ExerciseModel, ApplicationError>>
```

##### `getExercise()`

```typescript
/**
 * Retrieves an exercise by its ID for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @returns {Promise<Result<ExerciseModel, ApplicationError>>} A Result containing the ExerciseModel or an error
 */
async getExercise(
    profileId: string,
    exerciseId: string
  ): Promise<Result<ExerciseModel, ApplicationError>>
```

##### `getAllExercises()`

```typescript
/**
 * Retrieves all exercises for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<ExerciseModel[], ApplicationError>>} A Result containing an array of ExerciseModels or an error
 */
async getAllExercises(profileId: string): Promise<Result<ExerciseModel[], ApplicationError>>
```

##### `getExercisesByIds()`

```typescript
/**
 * Retrieves multiple exercises by their IDs for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string[]} exerciseIds - 
 * @returns {Promise<Result<ExerciseModel[], ApplicationError>>} A Result containing an array of ExerciseModels or an error
 */
async getExercisesByIds(
    profileId: string,
    exerciseIds: string[]
  ): Promise<Result<ExerciseModel[], ApplicationError>>
```

##### `updateExercise()`

```typescript
/**
 * Updates an existing exercise.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {Partial<Omit<{ id: string; profileId: string; name: string; description: string; category: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; movementType: "other" | "pull" | "push" | "static" | "dynamic"; difficulty: "beginner" | "intermediate" | "advanced"; equipment: ("other" | "barbell" | "dumbbell" | "machine" | "bodyweight" | "kettlebell" | "cable" | "smithMachine" | "bench" | "rack" | "fitball" | "step")[]; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; counterType: "reps" | "mins" | "secs"; jointType: "isolation" | "compound"; substitutions: { exerciseId: string; priority: number; reason?: string | undefined; }[]; createdAt: Date; updatedAt: Date; movementPattern?: "verticalPush" | "verticalPull" | "horizontalPush" | "horizontalPull" | "hipHinge" | "squat" | "coreRotation" | undefined; notes?: string | undefined; }, "id" | "profileId" | "createdAt" | "updatedAt">>} updates - 
 * @returns {Promise<Result<ExerciseModel, ApplicationError>>} A Result containing the updated ExerciseModel or an error
 */
async updateExercise(
    profileId: string,
    exerciseId: string,
    updates: Partial<Omit<ExerciseData, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<ExerciseModel, ApplicationError>>
```

##### `addSubstitution()`

```typescript
/**
 * Adds a substitution to an existing exercise.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {string} substituteExerciseId - 
 * @param {number} priority - 
 * @param {string | undefined} reason - 
 * @returns {Promise<Result<ExerciseModel, ApplicationError>>} A Result containing the updated ExerciseModel or an error
 */
async addSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string,
    priority: number,
    reason?: string
  ): Promise<Result<ExerciseModel, ApplicationError>>
```

##### `removeSubstitution()`

```typescript
/**
 * Removes a substitution from an existing exercise.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @param {string} substituteExerciseId - 
 * @returns {Promise<Result<ExerciseModel, ApplicationError>>} A Result containing the updated ExerciseModel or an error
 */
async removeSubstitution(
    profileId: string,
    exerciseId: string,
    substituteExerciseId: string
  ): Promise<Result<ExerciseModel, ApplicationError>>
```

##### `deleteExercise()`

```typescript
/**
 * Permanently deletes an exercise from the system.
 *
 * @param {string} profileId - 
 * @param {string} exerciseId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteExercise(
    profileId: string,
    exerciseId: string
  ): Promise<Result<void, ApplicationError>>
```

##### `saveBulkExercises()`

```typescript
/**
 * Saves multiple exercises in bulk.
 *
 * @param {ExerciseModel[]} exercises - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async saveBulkExercises(exercises: ExerciseModel[]): Promise<Result<void, ApplicationError>>
```

---

## File: `src/features/exercise/services/index.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/useBulkDelete.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/useOptimizeDatabase.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/useValidateDataIntegrity.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/query-services/MaintenanceQueryService.ts`

### class `MaintenanceQueryService`

**Description:**
Query service that acts as an adapter between the Maintenance Application Layer and React Query. This service handles the unwrapping of Result objects returned by the MaintenanceService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all maintenance operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {MaintenanceService} maintenanceService - 
 */
constructor(
    @inject('MaintenanceService') private readonly maintenanceService: MaintenanceService
  )
```

#### Public Instance Methods

##### `bulkDelete()`

```typescript
/**
 * Performs bulk delete operations based on the specified option. Uses chunking to prevent UI blocking during large operations.
 *
 * @param {BulkDeleteOptions} option - 
 * @param {((status: MaintenanceStatus) => void) | undefined} onProgress - 
 * @returns {Promise<CleanupResult>} Promise resolving to cleanup results
 * @throws When the operation fails
 */
async bulkDelete(
    option: BulkDeleteOptions,
    onProgress?: (status: MaintenanceStatus) => void
  ): Promise<CleanupResult>
```

##### `optimizeDatabase()`

```typescript
/**
 * Optimizes database performance by running cleanup operations.
 *
 * @returns {Promise<{ message: string; operationsPerformed: string[]; }>} Promise resolving to optimization results
 * @throws When the operation fails
 */
async optimizeDatabase(): Promise<
```

##### `validateDataIntegrity()`

```typescript
/**
 * Validates data integrity across all repositories.
 *
 * @returns {Promise<{ isValid: boolean; issues: string[]; totalRecordsChecked: number; }>} Promise resolving to validation results
 * @throws When the operation fails
 */
async validateDataIntegrity(): Promise<
```

---

## File: `src/features/maintenance/services/index.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/services/MaintenanceService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/services/MaintenanceService.test.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/services/MaintenanceService.ts`

### class `MaintenanceService`

**Description:**
Service responsible for system maintenance operations. Handles data cleanup, bulk operations, and system optimization tasks. Uses chunking technique for long-running operations to prevent UI freezing.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IProfileRepository} profileRepository - 
 * @param {IExerciseRepository} exerciseRepository - 
 * @param {IExerciseTemplateRepository} exerciseTemplateRepository - 
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 * @param {IWorkoutLogRepository} workoutLogRepository - 
 * @param {IMaxLogRepository} maxLogRepository - 
 * @param {IBodyMetricsRepository} bodyMetricsRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('IExerciseRepository') private readonly exerciseRepository: IExerciseRepository,
    @inject('IExerciseTemplateRepository')
    private readonly exerciseTemplateRepository: IExerciseTemplateRepository,
    @inject('ITrainingPlanRepository')
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository')
    private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `bulkDelete()`

```typescript
/**
 * Performs bulk delete operations based on the specified option. Uses chunking to prevent UI blocking during large operations.
 *
 * @param {BulkDeleteOptions} option - 
 * @param {((status: MaintenanceStatus) => void) | undefined} onProgress - 
 * @returns {Promise<Result<CleanupResult, ApplicationError>>} Result containing cleanup results or an error
 */
async bulkDelete(
    option: BulkDeleteOptions,
    onProgress?: (status: MaintenanceStatus) => void
  ): Promise<Result<CleanupResult, ApplicationError>>
```

##### `optimizeDatabase()`

```typescript
/**
 * Optimizes database performance by running cleanup operations.
 *
 * @returns {Promise<Result<{ message: string; operationsPerformed: string[]; }, ApplicationError>>} Result indicating success or failure
 */
async optimizeDatabase(): Promise<
    Result<
```

##### `validateDataIntegrity()`

```typescript
/**
 * Validates data integrity across all repositories.
 *
 * @returns {Promise<Result<{ isValid: boolean; issues: string[]; totalRecordsChecked: number; }, ApplicationError>>} Result containing validation results or an error
 */
async validateDataIntegrity(): Promise<
    Result<
```

---

## File: `src/features/max-log/data/index.ts`

_No exported classes found in this file._

## File: `src/features/max-log/data/MaxLogRepository.ts`

### class `MaxLogRepository`

**Description:**
Concrete implementation of IMaxLogRepository using WatermelonDB. Handles persistence and retrieval of MaxLog domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new MaxLogRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a MaxLogModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {MaxLogModel} log - 
 * @returns {Promise<MaxLogModel>} Promise resolving to the saved MaxLogModel
 */
async save(log: MaxLogModel): Promise<MaxLogModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a max log by ID and hydrates it into a MaxLogModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<MaxLogModel | undefined>} Promise resolving to MaxLogModel if found, undefined otherwise
 */
async findById(id: string): Promise<MaxLogModel | undefined>
```

##### `findAll()`

```typescript
/**
 * Retrieves all max logs for a given profile ID and hydrates them into MaxLogModel instances using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<MaxLogModel[]>} Promise resolving to an array of MaxLogModel instances
 */
async findAll(profileId: string): Promise<MaxLogModel[]>
```

##### `findLatestByExercise()`

```typescript
/**
 * Retrieves the latest max log for each exercise for a given profile ID. Returns a Map where keys are exercise IDs and values are the most recent MaxLogModel for that exercise.
 *
 * @param {string} profileId - 
 * @returns {Promise<Map<string, MaxLogModel>>} Promise resolving to a Map of exercise ID to latest MaxLogModel
 */
async findLatestByExercise(profileId: string): Promise<Map<string, MaxLogModel>>
```

##### `delete()`

```typescript
/**
 * Deletes a max log by ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise that resolves when the deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/max-log/domain/IMaxLogRepository.ts`

_No exported classes found in this file._

## File: `src/features/max-log/domain/index.ts`

_No exported classes found in this file._

## File: `src/features/max-log/domain/IOneRepMaxFormula.ts`

### class `BrzyckiFormula`

**Description:**
Implements the Brzycki formula for 1RM estimation. Formula: 1RM = weight / (1.0278 - 0.0278 × reps)

#### Public Instance Methods

##### `calculate()`

```typescript
/**
 * Calculates 1RM using the Brzycki formula.
 *
 * @param {number} weight - 
 * @param {number} reps - 
 * @returns {number} The estimated 1-Rep Max using Brzycki formula.
 */
calculate(weight: number, reps: number): number
```

---

### class `EpleyFormula`

**Description:**
Implements the Epley (or Baechle) formula for 1RM estimation. Formula: 1RM = weight × (1 + 0.0333 × reps)

#### Public Instance Methods

##### `calculate()`

```typescript
/**
 * Calculates 1RM using the Epley formula.
 *
 * @param {number} weight - 
 * @param {number} reps - 
 * @returns {number} The estimated 1-Rep Max using Epley formula.
 */
calculate(weight: number, reps: number): number
```

---

### class `LanderFormula`

**Description:**
Implements the Lander formula for 1RM estimation. Formula: 1RM = (100 × weight) / (101.3 - 2.67123 × reps)

#### Public Instance Methods

##### `calculate()`

```typescript
/**
 * Calculates 1RM using the Lander formula.
 *
 * @param {number} weight - 
 * @param {number} reps - 
 * @returns {number} The estimated 1-Rep Max using Lander formula.
 */
calculate(weight: number, reps: number): number
```

---

## File: `src/features/max-log/domain/MaxLogModel.ts`

### class `MaxLogModel`

**Description:**
Rich domain model representing a maximum lift log entry. Encapsulates business logic for 1-Rep Max calculations using injectable formula strategies.

#### Constructor

##### Constructor

```typescript
/**
 * Protected constructor enforces the use of the static hydrate method.
 *
 * @param {{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }} props - 
 * @param {IOneRepMaxFormula[]} formulas - 
 */
protected constructor(props: MaxLogData, formulas: IOneRepMaxFormula[])
```

#### Public Properties

##### `profileId: string`

##### `exerciseId: string`

##### `weightEnteredByUser: number`

##### `date: Date`

##### `reps: number`

##### `notes: string | undefined`

##### `estimated1RM: number`

##### `maxBrzycki: number | undefined`

##### `maxBaechle: number | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Static factory method for creating MaxLogModel instances from plain data.
 *
 * @param {{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }} props - 
 * @param {IOneRepMaxFormula[]} formulas - 
 * @returns {MaxLogModel} A new MaxLogModel instance.
 */
public static hydrate(
    props: MaxLogData,
    formulas: IOneRepMaxFormula[] = [new BrzyckiFormula(), new EpleyFormula()]
  ): MaxLogModel
```

#### Public Instance Methods

##### `isDirect1RM()`

```typescript
/**
 * Determines if this is a direct 1-Rep Max attempt.
 *
 * @returns {boolean} True if the lift was performed for exactly 1 repetition.
 */
isDirect1RM(): boolean
```

##### `cloneWithUpdatedDetails()`

```typescript
/**
 * Creates a new instance with updated lift details.
 *
 * @param {Partial<{ weight: number; reps: number; notes: string; date: Date; }>} details - 
 * @returns {MaxLogModel} A new MaxLogModel instance with updated details.
 */
cloneWithUpdatedDetails(
    details: Partial<
```

##### `getPrimaryEstimate()`

```typescript
/**
 * Gets the primary 1RM estimate calculated from the strategy formulas.
 *
 * @returns {number} The estimated 1-Rep Max value.
 */
getPrimaryEstimate(): number
```

##### `comparePerformance()`

```typescript
/**
 * Compares this max log's performance against another.
 *
 * @param {MaxLogModel} otherLog - 
 * @returns {{ differenceKg: number; percentageImprovement: number; }} Performance comparison metrics.
 */
comparePerformance(otherLog: MaxLogModel):
```

##### `calculateBodyweightRatio()`

```typescript
/**
 * Calculates the lift-to-bodyweight ratio.
 *
 * @param {number} bodyweightKg - 
 * @returns {number} The ratio of 1RM to bodyweight.
 */
calculateBodyweightRatio(bodyweightKg: number): number
```

##### `getSummaryString()`

```typescript
/**
 * Generates a human-readable summary of the max log.
 *
 * @returns {string} A formatted summary string.
 */
getSummaryString(): string
```

##### `isOlderThan()`

```typescript
/**
 * Checks if this max log was recorded before a specific date.
 *
 * @param {Date} date - 
 * @returns {boolean} True if this log's date is before the provided date.
 */
isOlderThan(date: Date): boolean
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this MaxLogModel.
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }} The plain MaxLogData object.
 */
toPlainObject(): MaxLogData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against the MaxLog Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }>} Validation result with success flag and potential errors.
 */
validate()
```

---

## File: `src/features/max-log/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/use1RMCalculator.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useCalculateBodyweightRatio.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useCompareMaxLogPerformance.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useCreateMaxLog.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useDeleteMaxLog.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useGetLatestMaxLogsByExercise.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useGetMaxLog.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useGetMaxLogs.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useGetMaxLogSummary.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/usePersonalRecordAlerts.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/useUpdateMaxLog.ts`

_No exported classes found in this file._

## File: `src/features/max-log/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/max-log/query-services/MaxLogQueryService.ts`

### class `MaxLogQueryService`

**Description:**
Query service that acts as an adapter between the Max Log Application Layer and React Query. This service handles the unwrapping of Result objects returned by the MaxLogService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all max log-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {MaxLogService} maxLogService - 
 */
constructor(@inject('MaxLogService') private readonly maxLogService: MaxLogService)
```

#### Public Instance Methods

##### `createMaxLog()`

```typescript
/**
 * Creates a new max log entry for tracking a personal record.
 *
 * @param {Omit<{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }, "id" | "createdAt" | "updatedAt" | "estimated1RM" | "maxBrzycki" | "maxBaechle">} maxLogData - 
 * @returns {Promise<MaxLogModel>} Promise resolving to the created MaxLogModel
 * @throws When the operation fails
 */
async createMaxLog(
    maxLogData: Omit<
      MaxLogData,
      'id' | 'createdAt' | 'updatedAt' | 'estimated1RM' | 'maxBrzycki' | 'maxBaechle'
    >
  ): Promise<MaxLogModel>
```

##### `getMaxLog()`

```typescript
/**
 * Retrieves a max log by its ID.
 *
 * @param {string} maxLogId - 
 * @returns {Promise<MaxLogModel>} Promise resolving to the MaxLogModel
 * @throws When the operation fails
 */
async getMaxLog(maxLogId: string): Promise<MaxLogModel>
```

##### `getAllMaxLogs()`

```typescript
/**
 * Retrieves all max logs for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {default<MaxLog>} Query for MaxLog models for reactive observation
 * @throws When the operation fails
 */
getAllMaxLogs(profileId: string): Query<MaxLog>
```

##### `getLatestMaxLogsByExercise()`

```typescript
/**
 * Retrieves the latest max log for each exercise for a profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Map<string, MaxLogModel>>} Promise resolving to a Map of exercise IDs to their latest MaxLogModel
 * @throws When the operation fails
 */
async getLatestMaxLogsByExercise(profileId: string): Promise<Map<string, MaxLogModel>>
```

##### `updateMaxLog()`

```typescript
/**
 * Updates an existing max log entry.
 *
 * @param {string} maxLogId - 
 * @param {Partial<{ weight: number; reps: number; notes: string; date: Date; }>} updates - 
 * @returns {Promise<MaxLogModel>} Promise resolving to the updated MaxLogModel
 * @throws When the operation fails
 */
async updateMaxLog(
    maxLogId: string,
    updates: Partial<
```

##### `compareMaxLogPerformance()`

```typescript
/**
 * Compares performance between two max log entries.
 *
 * @param {string} maxLogId1 - 
 * @param {string} maxLogId2 - 
 * @returns {Promise<{ differenceKg: number; percentageImprovement: number; }>} Promise resolving to performance comparison metrics
 * @throws When the operation fails
 */
async compareMaxLogPerformance(
    maxLogId1: string,
    maxLogId2: string
  ): Promise<
```

##### `calculateBodyweightRatio()`

```typescript
/**
 * Calculates the lift-to-bodyweight ratio for a max log.
 *
 * @param {string} maxLogId - 
 * @param {number} bodyweightKg - 
 * @returns {Promise<number>} Promise resolving to the bodyweight ratio
 * @throws When the operation fails
 */
async calculateBodyweightRatio(maxLogId: string, bodyweightKg: number): Promise<number>
```

##### `getMaxLogsOlderThan()`

```typescript
/**
 * Retrieves max logs that are older than a specific date.
 *
 * @param {string} profileId - 
 * @param {Date} date - 
 * @returns {default<MaxLog>} Query for MaxLog models for reactive observation
 * @throws When the operation fails
 */
getMaxLogsOlderThan(profileId: string, date: Date): Query<MaxLog>
```

##### `getMaxLogSummary()`

```typescript
/**
 * Generates a summary string for a max log.
 *
 * @param {string} maxLogId - 
 * @returns {Promise<string>} Promise resolving to the summary string
 * @throws When the operation fails
 */
async getMaxLogSummary(maxLogId: string): Promise<string>
```

##### `deleteMaxLog()`

```typescript
/**
 * Permanently deletes a max log from the system.
 *
 * @param {string} maxLogId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteMaxLog(maxLogId: string): Promise<void>
```

---

## File: `src/features/max-log/services/index.ts`

_No exported classes found in this file._

## File: `src/features/max-log/services/MaxLogService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/services/MaxLogService.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/services/MaxLogService.ts`

### class `MaxLogService`

**Description:**
Application service responsible for orchestrating max log operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to personal record tracking and 1-Rep Max calculations.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IMaxLogRepository} maxLogRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `createMaxLog()`

```typescript
/**
 * Creates a new max log entry for tracking a personal record.
 *
 * @param {Omit<{ id: string; profileId: string; exerciseId: string; weightEnteredByUser: number; date: Date; reps: number; estimated1RM: number; createdAt: Date; updatedAt: Date; notes?: string | undefined; maxBrzycki?: number | undefined; maxBaechle?: number | undefined; }, "id" | "createdAt" | "updatedAt" | "estimated1RM" | "maxBrzycki" | "maxBaechle">} maxLogData - 
 * @returns {Promise<Result<MaxLogModel, ApplicationError>>} A Result containing the created MaxLogModel or an error
 */
async createMaxLog(
    maxLogData: Omit<
      MaxLogData,
      'id' | 'createdAt' | 'updatedAt' | 'estimated1RM' | 'maxBrzycki' | 'maxBaechle'
    >
  ): Promise<Result<MaxLogModel, ApplicationError>>
```

##### `getMaxLog()`

```typescript
/**
 * Retrieves a max log by its ID.
 *
 * @param {string} maxLogId - 
 * @returns {Promise<Result<MaxLogModel, ApplicationError>>} A Result containing the MaxLogModel or an error
 */
async getMaxLog(maxLogId: string): Promise<Result<MaxLogModel, ApplicationError>>
```

##### `getAllMaxLogs()`

```typescript
/**
 * Retrieves all max logs for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<MaxLogModel[], ApplicationError>>} A Result containing an array of MaxLogModels or an error
 */
async getAllMaxLogs(profileId: string): Promise<Result<MaxLogModel[], ApplicationError>>
```

##### `getLatestMaxLogsByExercise()`

```typescript
/**
 * Retrieves the latest max log for each exercise for a profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<Map<string, MaxLogModel>, ApplicationError>>} A Result containing a Map of exercise IDs to their latest MaxLogModel or an error
 */
async getLatestMaxLogsByExercise(
    profileId: string
  ): Promise<Result<Map<string, MaxLogModel>, ApplicationError>>
```

##### `updateMaxLog()`

```typescript
/**
 * Updates an existing max log entry.
 *
 * @param {string} maxLogId - 
 * @param {Partial<{ weight: number; reps: number; notes: string; date: Date; }>} updates - 
 * @returns {Promise<Result<MaxLogModel, ApplicationError>>} A Result containing the updated MaxLogModel or an error
 */
async updateMaxLog(
    maxLogId: string,
    updates: Partial<
```

##### `compareMaxLogPerformance()`

```typescript
/**
 * Compares performance between two max log entries.
 *
 * @param {string} maxLogId1 - 
 * @param {string} maxLogId2 - 
 * @returns {Promise<Result<{ differenceKg: number; percentageImprovement: number; }, ApplicationError>>} A Result containing performance comparison metrics or an error
 */
async compareMaxLogPerformance(
    maxLogId1: string,
    maxLogId2: string
  ): Promise<Result<
```

##### `calculateBodyweightRatio()`

```typescript
/**
 * Calculates the lift-to-bodyweight ratio for a max log.
 *
 * @param {string} maxLogId - 
 * @param {number} bodyweightKg - 
 * @returns {Promise<Result<number, ApplicationError>>} A Result containing the bodyweight ratio or an error
 */
async calculateBodyweightRatio(
    maxLogId: string,
    bodyweightKg: number
  ): Promise<Result<number, ApplicationError>>
```

##### `getMaxLogsOlderThan()`

```typescript
/**
 * Retrieves max logs that are older than a specific date.
 *
 * @param {string} profileId - 
 * @param {Date} date - 
 * @returns {Promise<Result<MaxLogModel[], ApplicationError>>} A Result containing an array of older MaxLogModels or an error
 */
async getMaxLogsOlderThan(
    profileId: string,
    date: Date
  ): Promise<Result<MaxLogModel[], ApplicationError>>
```

##### `getMaxLogSummary()`

```typescript
/**
 * Generates a summary string for a max log.
 *
 * @param {string} maxLogId - 
 * @returns {Promise<Result<string, ApplicationError>>} A Result containing the summary string or an error
 */
async getMaxLogSummary(maxLogId: string): Promise<Result<string, ApplicationError>>
```

##### `deleteMaxLog()`

```typescript
/**
 * Permanently deletes a max log from the system.
 *
 * @param {string} maxLogId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteMaxLog(maxLogId: string): Promise<Result<void, ApplicationError>>
```

---

## File: `src/features/profile/data/CustomThemeRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/data/CustomThemeRepository.ts`

### class `CustomThemeRepository`

**Description:**
Concrete implementation of ICustomThemeRepository using WatermelonDB. Handles persistence and retrieval of CustomTheme domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new CustomThemeRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a CustomThemeModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {CustomThemeModel} theme - 
 * @returns {Promise<CustomThemeModel>} Promise resolving to the saved CustomThemeModel
 */
async save(theme: CustomThemeModel): Promise<CustomThemeModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a custom theme by its ID and hydrates it into a CustomThemeModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<CustomThemeModel | undefined>} Promise resolving to CustomThemeModel if found, undefined otherwise
 */
async findById(id: string): Promise<CustomThemeModel | undefined>
```

##### `findByProfileId()`

```typescript
/**
 * Retrieves all custom themes for a profile ID and hydrates them into CustomThemeModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<CustomThemeModel[]>} Promise resolving to array of CustomThemeModels
 */
async findByProfileId(profileId: string): Promise<CustomThemeModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a custom theme by its ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/profile/data/index.ts`

_No exported classes found in this file._

## File: `src/features/profile/data/ProfileRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/data/ProfileRepository.ts`

### class `ProfileRepository`

**Description:**
Concrete implementation of IProfileRepository using WatermelonDB. Handles persistence and retrieval of Profile domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new ProfileRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a ProfileModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {ProfileModel} profile - 
 * @returns {Promise<ProfileModel>} Promise resolving to the saved ProfileModel
 */
async save(profile: ProfileModel): Promise<ProfileModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a profile by its ID and hydrates it into a ProfileModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<ProfileModel | undefined>} Promise resolving to ProfileModel if found, undefined otherwise
 */
async findById(id: string): Promise<ProfileModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple profiles by their IDs and hydrates them into ProfileModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<ProfileModel[]>} Promise resolving to array of ProfileModels
 */
async findByIds(ids: string[]): Promise<ProfileModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all profiles from the database and hydrates them into ProfileModels using the model's static hydrate method.
 *
 * @returns {Promise<ProfileModel[]>} Promise resolving to array of all ProfileModels
 */
async findAll(): Promise<ProfileModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a profile by its ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/profile/data/UserDetailsRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/data/UserDetailsRepository.ts`

### class `UserDetailsRepository`

**Description:**
Concrete implementation of IUserDetailsRepository using WatermelonDB. Handles persistence and retrieval of UserDetails domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new UserDetailsRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a UserDetailsModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {UserDetailsModel} details - 
 * @returns {Promise<UserDetailsModel>} Promise resolving to the saved UserDetailsModel
 */
async save(details: UserDetailsModel): Promise<UserDetailsModel>
```

##### `findByProfileId()`

```typescript
/**
 * Retrieves user details by profile ID and hydrates it into a UserDetailsModel using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<UserDetailsModel | undefined>} Promise resolving to UserDetailsModel if found, undefined otherwise
 */
async findByProfileId(profileId: string): Promise<UserDetailsModel | undefined>
```

---

## File: `src/features/profile/data/UserSettingsRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/data/UserSettingsRepository.ts`

### class `UserSettingsRepository`

**Description:**
Concrete implementation of IUserSettingsRepository using WatermelonDB. Handles persistence and retrieval of UserSettings domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new UserSettingsRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a UserSettingsModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {UserSettingsModel} settings - 
 * @returns {Promise<UserSettingsModel>} Promise resolving to the saved UserSettingsModel
 */
async save(settings: UserSettingsModel): Promise<UserSettingsModel>
```

##### `findByProfileId()`

```typescript
/**
 * Retrieves user settings by profile ID and hydrates it into a UserSettingsModel using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<UserSettingsModel | undefined>} Promise resolving to UserSettingsModel if found, undefined otherwise
 */
async findByProfileId(profileId: string): Promise<UserSettingsModel | undefined>
```

---

## File: `src/features/profile/domain/CustomThemeModel.ts`

### class `CustomThemeModel`

**Description:**
A domain model representing a custom theme configuration. Contains theme name, mode, and color scheme preferences.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; name: string; mode: "light" | "dark"; primaryColor: string; secondaryColor: string; }} props - 
 */
protected constructor(props: CustomThemeData)
```

#### Public Properties

##### `profileId: string`

##### `name: string`

##### `mode: "light" | "dark"`

##### `primaryColor: string`

##### `secondaryColor: string`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new CustomThemeModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; name: string; mode: "light" | "dark"; primaryColor: string; secondaryColor: string; }} props - 
 * @returns {CustomThemeModel} A new CustomThemeModel instance
 */
public static hydrate(props: CustomThemeData): CustomThemeModel
```

#### Public Instance Methods

##### `cloneWithNewName()`

```typescript
/**
 * Creates a new theme instance with an updated name.
 *
 * @param {string} newName - 
 * @returns {CustomThemeModel} A new CustomThemeModel instance with the updated name
 */
cloneWithNewName(newName: string): CustomThemeModel
```

##### `cloneWithNewMode()`

```typescript
/**
 * Creates a new theme instance with an updated mode.
 *
 * @param {"light" | "dark"} newMode - 
 * @returns {CustomThemeModel} A new CustomThemeModel instance with the updated mode
 */
cloneWithNewMode(newMode: 'light' | 'dark'): CustomThemeModel
```

##### `cloneWithNewColors()`

```typescript
/**
 * Creates a new theme instance with updated colors.
 *
 * @param {string} primaryColor - 
 * @param {string} secondaryColor - 
 * @returns {CustomThemeModel} A new CustomThemeModel instance with updated colors
 */
cloneWithNewColors(primaryColor: string, secondaryColor: string): CustomThemeModel
```

##### `cloneWithNewPrimaryColor()`

```typescript
/**
 * Creates a new theme instance with updated primary color only.
 *
 * @param {string} primaryColor - 
 * @returns {CustomThemeModel} A new CustomThemeModel instance with updated primary color
 */
cloneWithNewPrimaryColor(primaryColor: string): CustomThemeModel
```

##### `cloneWithNewSecondaryColor()`

```typescript
/**
 * Creates a new theme instance with updated secondary color only.
 *
 * @param {string} secondaryColor - 
 * @returns {CustomThemeModel} A new CustomThemeModel instance with updated secondary color
 */
cloneWithNewSecondaryColor(secondaryColor: string): CustomThemeModel
```

##### `isDarkMode()`

```typescript
/**
 * Checks if this theme uses dark mode.
 *
 * @returns {boolean} True if the theme mode is 'dark'
 */
isDarkMode(): boolean
```

##### `isLightMode()`

```typescript
/**
 * Checks if this theme uses light mode.
 *
 * @returns {boolean} True if the theme mode is 'light'
 */
isLightMode(): boolean
```

##### `getDisplayName()`

```typescript
/**
 * Gets a readable display string for the theme.
 *
 * @returns {string} A formatted string showing theme name and mode
 */
getDisplayName(): string
```

##### `hasSameColors()`

```typescript
/**
 * Checks if two themes have identical color schemes.
 *
 * @param {CustomThemeModel} other - 
 * @returns {boolean} True if both themes have the same primary and secondary colors
 */
hasSameColors(other: CustomThemeModel): boolean
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this CustomThemeModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; name: string; mode: "light" | "dark"; primaryColor: string; secondaryColor: string; }} The plain CustomThemeData object
 */
toPlainObject(): CustomThemeData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; name: string; mode: "light" | "dark"; primaryColor: string; secondaryColor: string; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/profile/domain/ICustomThemeRepository.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/index.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/IProfileRepository.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/IUserDetailsRepository.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/IUserSettingsRepository.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/ProfileModel.ts`

### class `ProfileModel`

**Description:**
A domain model representing a user profile. Contains basic profile information and provides methods for profile management.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; name: string; createdAt: Date; updatedAt: Date; } & { isActive?: boolean | undefined; }} props - 
 */
protected constructor(props: ProfileData &
```

#### Public Properties

##### `[immerable]: boolean`

##### `name: string`

##### `isActive: boolean`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new ProfileModel instance from plain data.
 *
 * @param {{ id: string; name: string; createdAt: Date; updatedAt: Date; } & { isActive?: boolean | undefined; }} props - 
 * @returns {ProfileModel} A new ProfileModel instance
 */
public static hydrate(props: ProfileData &
```

#### Public Instance Methods

##### `cloneWithNewName()`

```typescript
/**
 * Creates a new profile instance with an updated name.
 *
 * @param {string} newName - 
 * @returns {ProfileModel} A new ProfileModel instance with the updated name
 */
cloneWithNewName(newName: string): ProfileModel
```

##### `getDisplayName()`

```typescript
/**
 * Gets the display name for this profile.
 *
 * @returns {string} The profile's display name
 */
getDisplayName(): string
```

##### `cloneAsDeactivated()`

```typescript
/**
 * Creates a new profile instance marked as deactivated.
 *
 * @returns {ProfileModel} A new ProfileModel instance marked as inactive
 */
cloneAsDeactivated(): ProfileModel
```

##### `cloneAsReactivated()`

```typescript
/**
 * Creates a new profile instance marked as reactivated.
 *
 * @returns {ProfileModel} A new ProfileModel instance marked as active
 */
cloneAsReactivated(): ProfileModel
```

##### `isNew()`

```typescript
/**
 * Checks if this profile was created within the specified number of days.
 *
 * @param {number} days - 
 * @returns {boolean} True if the profile is considered "new"
 */
isNew(days = 1): boolean
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this ProfileModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; name: string; createdAt: Date; updatedAt: Date; }} The plain ProfileData object
 */
toPlainObject(): ProfileData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; name: string; createdAt: Date; updatedAt: Date; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/profile/domain/UserDetailsModel.ts`

### class `UserDetailsModel`

**Description:**
A domain model representing detailed user information. Contains personal details like name, biological sex, and date of birth.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; createdAt: Date; updatedAt: Date; fullName?: string | undefined; biologicalSex?: "male" | "female" | undefined; dateOfBirth?: Date | undefined; }} props - 
 */
protected constructor(props: UserDetailsData)
```

#### Public Properties

##### `profileId: string`

##### `fullName: string | undefined`

##### `biologicalSex: "male" | "female" | undefined`

##### `dateOfBirth: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/shared/domain/value-objects/UserDateOfBirth").UserDateOfBirth | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new UserDetailsModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; createdAt: Date; updatedAt: Date; fullName?: string | undefined; biologicalSex?: "male" | "female" | undefined; dateOfBirth?: Date | undefined; }} props - 
 * @returns {UserDetailsModel} A new UserDetailsModel instance
 */
public static hydrate(props: UserDetailsData): UserDetailsModel
```

#### Public Instance Methods

##### `getAge()`

```typescript
/**
 * Calculates and returns the user's age based on their date of birth.
 *
 * @returns {UserAge | null} The user's age as a UserAge value object, or null if no date of birth is set
 */
getAge(): UserAge | null
```

##### `getName()`

```typescript
/**
 * Gets the user's full name.
 *
 * @returns {string | null} The full name or null if not set
 */
getName(): string | null
```

##### `getInitials()`

```typescript
/**
 * Gets the user's initials from their full name.
 *
 * @returns {string | null} The initials in uppercase, or null if no full name is set
 */
getInitials(): string | null
```

##### `isBirthdayToday()`

```typescript
/**
 * Checks if today is the user's birthday.
 *
 * @returns {boolean} True if today matches the user's date of birth
 */
isBirthdayToday(): boolean
```

##### `getAgeInDays()`

```typescript
/**
 * Gets the user's age in days.
 *
 * @returns {number | null} The number of days since birth, or null if no date of birth is set
 */
getAgeInDays(): number | null
```

##### `cloneWithNewFullName()`

```typescript
/**
 * Creates a new details instance with an updated full name.
 *
 * @param {string} newName - 
 * @returns {UserDetailsModel} A new UserDetailsModel instance with the updated name
 */
cloneWithNewFullName(newName: string): UserDetailsModel
```

##### `cloneWithNewDateOfBirth()`

```typescript
/**
 * Creates a new details instance with an updated date of birth.
 *
 * @param {Date} newDob - 
 * @returns {UserDetailsModel} A new UserDetailsModel instance with the updated date of birth
 */
cloneWithNewDateOfBirth(newDob: Date): UserDetailsModel
```

##### `cloneWithNewBiologicalSex()`

```typescript
/**
 * Creates a new details instance with an updated biological sex.
 *
 * @param {"male" | "female"} newSex - 
 * @returns {UserDetailsModel} A new UserDetailsModel instance with the updated biological sex
 */
cloneWithNewBiologicalSex(newSex: 'male' | 'female'): UserDetailsModel
```

##### `cloneWithMergedDetails()`

```typescript
/**
 * Creates a new details instance with merged partial details.
 *
 * @param {Partial<{ id: string; profileId: string; createdAt: Date; updatedAt: Date; fullName?: string | undefined; biologicalSex?: "male" | "female" | undefined; dateOfBirth?: Date | undefined; }>} details - 
 * @returns {UserDetailsModel} A new UserDetailsModel instance with the merged details
 */
cloneWithMergedDetails(details: Partial<UserDetailsData>): UserDetailsModel
```

##### `cloneWithClearedOptionalFields()`

```typescript
/**
 * Creates a new details instance with all optional fields cleared.
 *
 * @returns {UserDetailsModel} A new UserDetailsModel instance with cleared optional fields
 */
cloneWithClearedOptionalFields(): UserDetailsModel
```

##### `isProfileComplete()`

```typescript
/**
 * Checks if the user profile has all required information for completion.
 *
 * @returns {boolean} True if both full name and date of birth are provided
 */
isProfileComplete(): boolean
```

##### `isAdult()`

```typescript
/**
 * Checks if the user is considered an adult (18 years or older).
 *
 * @returns {boolean} True if the user is 18 years or older, false if under 18 or no date of birth
 */
isAdult(): boolean
```

##### `hasDateOfBirth()`

```typescript
/**
 * Checks if the user has a date of birth set.
 *
 * @returns {boolean} True if date of birth is present
 */
hasDateOfBirth(): boolean
```

##### `getFormattedDateOfBirth()`

```typescript
/**
 * Gets the formatted date of birth string.
 *
 * @param {string} formatString - 
 * @returns {string | null} The formatted date string, or null if no date of birth is set
 */
getFormattedDateOfBirth(formatString: string): string | null
```

##### `hasSameDetails()`

```typescript
/**
 * Compares this user's details with another for equality.
 *
 * @param {UserDetailsModel} other - 
 * @returns {boolean} True if all detail fields match
 */
hasSameDetails(other: UserDetailsModel): boolean
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this UserDetailsModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; createdAt: Date; updatedAt: Date; fullName?: string | undefined; biologicalSex?: "male" | "female" | undefined; dateOfBirth?: Date | undefined; }} The plain UserDetailsData object
 */
toPlainObject(): UserDetailsData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; createdAt: Date; updatedAt: Date; fullName?: string | undefined; biologicalSex?: "male" | "female" | undefined; dateOfBirth?: Date | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/profile/domain/UserSettingsModel.ts`

### class `UserSettingsModel`

**Description:**
A domain model representing user-specific application settings. Contains theme preferences, unit system, training plan configuration, and dashboard layout.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; themeMode: "light" | "dark"; primaryColor: string; secondaryColor: string; unitSystem: "metric"; bmiFormula: "classic" | "new"; activeTrainingPlanId: string | null; autoStartRestTimer: boolean; autoStartShortRestTimer: boolean; liftMappings: Record<"bench" | "backSquat" | "deadlift" | "overheadPress" | "barbellRow" | "legExtension" | "legCurl" | "latPulldown" | "cableRow" | "frontSquat", string>; dashboardLayout: ("nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar")[]; dashboardVisibility: Record<"nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar", boolean>; createdAt: Date; updatedAt: Date; }} props - 
 */
protected constructor(props: UserSettingsData)
```

#### Public Properties

##### `profileId: string`

##### `themeMode: "light" | "dark"`

##### `primaryColor: string`

##### `secondaryColor: string`

##### `unitSystem: "metric"`

##### `bmiFormula: "classic" | "new"`

##### `activeTrainingPlanId: string | null`

##### `autoStartRestTimer: boolean`

##### `autoStartShortRestTimer: boolean`

##### `liftMappings: Record<string, string>`

##### `dashboardLayout: ("nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar")[]`

##### `dashboardVisibility: Record<"nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar", boolean>`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new UserSettingsModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; themeMode: "light" | "dark"; primaryColor: string; secondaryColor: string; unitSystem: "metric"; bmiFormula: "classic" | "new"; activeTrainingPlanId: string | null; autoStartRestTimer: boolean; autoStartShortRestTimer: boolean; liftMappings: Record<"bench" | "backSquat" | "deadlift" | "overheadPress" | "barbellRow" | "legExtension" | "legCurl" | "latPulldown" | "cableRow" | "frontSquat", string>; dashboardLayout: ("nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar")[]; dashboardVisibility: Record<"nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar", boolean>; createdAt: Date; updatedAt: Date; }} props - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance
 */
public static hydrate(props: UserSettingsData): UserSettingsModel
```

#### Public Instance Methods

##### `cloneWithThemeMode()`

```typescript
/**
 * Creates a new settings instance with updated theme mode.
 *
 * @param {"light" | "dark"} themeMode - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance with updated theme mode
 */
cloneWithThemeMode(themeMode: UserSettingsData['themeMode']): UserSettingsModel
```

##### `cloneWithColors()`

```typescript
/**
 * Creates a new settings instance with updated color scheme.
 *
 * @param {string} primaryColor - 
 * @param {string} secondaryColor - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance with updated colors
 */
cloneWithColors(primaryColor: string, secondaryColor: string): UserSettingsModel
```

##### `cloneWithActiveTrainingPlan()`

```typescript
/**
 * Creates a new settings instance with updated active training plan.
 *
 * @param {string | null} planId - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance with updated active training plan
 */
cloneWithActiveTrainingPlan(planId: string | null): UserSettingsModel
```

##### `cloneWithTimerSettings()`

```typescript
/**
 * Creates a new settings instance with updated timer preferences.
 *
 * @param {boolean} autoStartRestTimer - 
 * @param {boolean} autoStartShortRestTimer - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance with updated timer settings
 */
cloneWithTimerSettings(
    autoStartRestTimer: boolean,
    autoStartShortRestTimer: boolean
  ): UserSettingsModel
```

##### `cloneWithLiftMappings()`

```typescript
/**
 * Creates a new settings instance with updated lift mappings.
 *
 * @param {Record<string, string>} liftMappings - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance with updated lift mappings
 */
cloneWithLiftMappings(liftMappings: Record<string, string>): UserSettingsModel
```

##### `cloneWithDashboardSettings()`

```typescript
/**
 * Creates a new settings instance with updated dashboard configuration.
 *
 * @param {("nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar")[]} layout - 
 * @param {Record<"nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar", boolean>} visibility - 
 * @returns {UserSettingsModel} A new UserSettingsModel instance with updated dashboard settings
 */
cloneWithDashboardSettings(
    layout: UserSettingsData['dashboardLayout'],
    visibility: UserSettingsData['dashboardVisibility']
  ): UserSettingsModel
```

##### `hasActiveTrainingPlan()`

```typescript
/**
 * Checks if the user has an active training plan set.
 *
 * @returns {boolean} True if there is an active training plan
 */
hasActiveTrainingPlan(): boolean
```

##### `hasAutoTimersEnabled()`

```typescript
/**
 * Checks if auto-start timers are enabled.
 *
 * @returns {boolean} True if both rest timer types are set to auto-start
 */
hasAutoTimersEnabled(): boolean
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this UserSettingsModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; themeMode: "light" | "dark"; primaryColor: string; secondaryColor: string; unitSystem: "metric"; bmiFormula: "classic" | "new"; activeTrainingPlanId: string | null; autoStartRestTimer: boolean; autoStartShortRestTimer: boolean; liftMappings: Record<"bench" | "backSquat" | "deadlift" | "overheadPress" | "barbellRow" | "legExtension" | "legCurl" | "latPulldown" | "cableRow" | "frontSquat", string>; dashboardLayout: ("nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar")[]; dashboardVisibility: Record<"nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar", boolean>; createdAt: Date; updatedAt: Date; }} The plain UserSettingsData object
 */
toPlainObject(): UserSettingsData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; themeMode: "light" | "dark"; primaryColor: string; secondaryColor: string; unitSystem: "metric"; bmiFormula: "classic" | "new"; activeTrainingPlanId: string | null; autoStartRestTimer: boolean; autoStartShortRestTimer: boolean; liftMappings: Record<"bench" | "backSquat" | "deadlift" | "overheadPress" | "barbellRow" | "legExtension" | "legCurl" | "latPulldown" | "cableRow" | "frontSquat", string>; dashboardLayout: ("nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar")[]; dashboardVisibility: Record<"nextWorkout" | "lastWorkout" | "motivationalQuote" | "bodyweightChart" | "liftRatios" | "todaysEquipment" | "muscleGroupVolume" | "muscleRecovery" | "adherenceCalendar", boolean>; createdAt: Date; updatedAt: Date; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/profile/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useActiveProfileData.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useCreateProfile.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useDeleteProfile.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useGetProfile.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useGetProfiles.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useGetUserDetails.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useGetUserSettings.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useSaveUserDetails.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useSaveUserSettings.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/useUpdateProfile.ts`

_No exported classes found in this file._

## File: `src/features/profile/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/profile/query-services/ProfileQueryService.ts`

### class `ProfileQueryService`

**Description:**
Query service that acts as an adapter between the Application Layer and React Query. This service handles the unwrapping of Result objects returned by application services, allowing React Query hooks to use standard promise-based error handling. It provides methods for all profile-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {ProfileService} profileService - 
 * @param {UserDetailsService} userDetailsService - 
 * @param {UserSettingsService} userSettingsService - 
 */
constructor(
    @inject('ProfileService') private readonly profileService: ProfileService,
    @inject('UserDetailsService') private readonly userDetailsService: UserDetailsService,
    @inject('UserSettingsService') private readonly userSettingsService: UserSettingsService
  )
```

#### Public Instance Methods

##### `getProfiles()`

```typescript
/**
 * Retrieves all profiles from the system.
 *
 * @returns {default<Profile>} Query for Profile models for reactive observation
 * @throws When the operation fails
 */
getProfiles(): Query<Profile>
```

##### `getProfileQuery()`

```typescript
/**
 * Retrieves a reactive query for a specific profile by ID. This method provides reactive observation capabilities for individual profiles, automatically updating when the profile data changes.
 *
 * @param {string} profileId - 
 * @returns {default<Profile>} Query for Profile model for reactive observation
 */
getProfileQuery(profileId: string): Query<Profile>
```

##### `getProfile()`

```typescript
/**
 * Retrieves a specific profile by ID.
 *
 * @param {string} profileId - 
 * @returns {Promise<ProfileModel>} Promise resolving to the ProfileModel
 * @throws When the operation fails
 */
async getProfile(profileId: string): Promise<ProfileModel>
```

##### `createProfile()`

```typescript
/**
 * Creates a new profile with the given name.
 *
 * @param {string} name - 
 * @returns {Promise<ProfileModel>} Promise resolving to the created ProfileModel
 * @throws When the operation fails
 */
async createProfile(name: string): Promise<ProfileModel>
```

##### `updateProfile()`

```typescript
/**
 * Updates a profile's name.
 *
 * @param {string} profileId - 
 * @param {string} newName - 
 * @returns {Promise<ProfileModel>} Promise resolving to the updated ProfileModel
 * @throws When the operation fails
 */
async updateProfile(profileId: string, newName: string): Promise<ProfileModel>
```

##### `deactivateProfile()`

```typescript
/**
 * Deactivates a profile (soft delete).
 *
 * @param {string} profileId - 
 * @returns {Promise<ProfileModel>} Promise resolving to the deactivated ProfileModel
 * @throws When the operation fails
 */
async deactivateProfile(profileId: string): Promise<ProfileModel>
```

##### `deleteProfile()`

```typescript
/**
 * Permanently deletes a profile from the system.
 *
 * @param {string} profileId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteProfile(profileId: string): Promise<void>
```

##### `getUserSettings()`

```typescript
/**
 * Retrieves user settings for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<UserSettingsModel | undefined>} Promise resolving to UserSettingsModel or undefined if not found
 * @throws When the operation fails
 */
async getUserSettings(profileId: string): Promise<UserSettingsModel | undefined>
```

##### `saveUserSettings()`

```typescript
/**
 * Saves user settings for a profile.
 *
 * @param {UserSettingsModel} settings - 
 * @returns {Promise<UserSettingsModel>} Promise resolving to the saved UserSettingsModel
 * @throws When the operation fails
 */
async saveUserSettings(settings: UserSettingsModel): Promise<UserSettingsModel>
```

##### `getUserDetails()`

```typescript
/**
 * Retrieves user details for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<UserDetailsModel | undefined>} Promise resolving to UserDetailsModel or undefined if not found
 * @throws When the operation fails
 */
async getUserDetails(profileId: string): Promise<UserDetailsModel | undefined>
```

##### `saveUserDetails()`

```typescript
/**
 * Saves user details for a profile.
 *
 * @param {UserDetailsModel} details - 
 * @returns {Promise<UserDetailsModel>} Promise resolving to the saved UserDetailsModel
 * @throws When the operation fails
 */
async saveUserDetails(details: UserDetailsModel): Promise<UserDetailsModel>
```

---

## File: `src/features/profile/services/index.ts`

_No exported classes found in this file._

## File: `src/features/profile/services/ProfileService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/services/ProfileService.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/services/ProfileService.ts`

### class `ProfileService`

**Description:**
Application service responsible for orchestrating profile-related operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to user profile management.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IProfileRepository} profileRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `createProfile()`

```typescript
/**
 * Creates a new user profile and dispatches a ProfileCreatedEvent.
 *
 * @param {string} name - 
 * @returns {Promise<Result<ProfileModel, ApplicationError>>} A Result containing the created ProfileModel or an error
 */
async createProfile(name: string): Promise<Result<ProfileModel, ApplicationError>>
```

##### `getProfile()`

```typescript
/**
 * Retrieves a profile by its unique identifier.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<ProfileModel, ApplicationError>>} A Result containing the ProfileModel or an error
 */
async getProfile(profileId: string): Promise<Result<ProfileModel, ApplicationError>>
```

##### `getAllProfiles()`

```typescript
/**
 * Retrieves all profiles from the system.
 *
 * @returns {Promise<Result<ProfileModel[], ApplicationError>>} A Result containing an array of ProfileModels or an error
 */
async getAllProfiles(): Promise<Result<ProfileModel[], ApplicationError>>
```

##### `updateProfileName()`

```typescript
/**
 * Updates a profile's name.
 *
 * @param {string} profileId - 
 * @param {string} newName - 
 * @returns {Promise<Result<ProfileModel, ApplicationError>>} A Result containing the updated ProfileModel or an error
 */
async updateProfileName(
    profileId: string,
    newName: string
  ): Promise<Result<ProfileModel, ApplicationError>>
```

##### `deactivateProfile()`

```typescript
/**
 * Deactivates a profile (soft delete).
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<ProfileModel, ApplicationError>>} A Result containing the deactivated ProfileModel or an error
 */
async deactivateProfile(profileId: string): Promise<Result<ProfileModel, ApplicationError>>
```

##### `deleteProfile()`

```typescript
/**
 * Permanently deletes a profile from the system.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteProfile(profileId: string): Promise<Result<void, ApplicationError>>
```

---

## File: `src/features/profile/services/UserDetailsService.ts`

### class `UserDetailsService`

**Description:**
Application service responsible for orchestrating user details operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to user details management.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IUserDetailsRepository} userDetailsRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IUserDetailsRepository')
    private readonly userDetailsRepository: IUserDetailsRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `getUserDetails()`

```typescript
/**
 * Retrieves user details for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<UserDetailsModel | null, ApplicationError>>} A Result containing the UserDetailsModel or an error
 */
async getUserDetails(
    profileId: string
  ): Promise<Result<UserDetailsModel | null, ApplicationError>>
```

##### `saveUserDetails()`

```typescript
/**
 * Saves user details for a profile.
 *
 * @param {UserDetailsModel} details - 
 * @returns {Promise<Result<UserDetailsModel, ApplicationError>>} A Result containing the saved UserDetailsModel or an error
 */
async saveUserDetails(
    details: UserDetailsModel
  ): Promise<Result<UserDetailsModel, ApplicationError>>
```

---

## File: `src/features/profile/services/UserSettingsService.ts`

### class `UserSettingsService`

**Description:**
Application service responsible for orchestrating user settings operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to user settings management.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IUserSettingsRepository} userSettingsRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IUserSettingsRepository')
    private readonly userSettingsRepository: IUserSettingsRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `getUserSettings()`

```typescript
/**
 * Retrieves user settings for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<UserSettingsModel | null, ApplicationError>>} A Result containing the UserSettingsModel or an error
 */
async getUserSettings(
    profileId: string
  ): Promise<Result<UserSettingsModel | null, ApplicationError>>
```

##### `saveUserSettings()`

```typescript
/**
 * Saves user settings for a profile.
 *
 * @param {UserSettingsModel} settings - 
 * @returns {Promise<Result<UserSettingsModel, ApplicationError>>} A Result containing the saved UserSettingsModel or an error
 */
async saveUserSettings(
    settings: UserSettingsModel
  ): Promise<Result<UserSettingsModel, ApplicationError>>
```

---

## File: `src/features/training-plan/data/AppliedExerciseRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/data/AppliedExerciseRepository.ts`

### class `AppliedExerciseRepository`

**Description:**
Concrete implementation of IAppliedExerciseRepository using WatermelonDB. Handles persistence and retrieval of AppliedExercise domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new AppliedExerciseRepository instance.
 *
 * @param {ExtendedDatabase} database - 
 */
constructor(@inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists an AppliedExerciseModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {AppliedExerciseModel} exercise - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<AppliedExerciseModel>} Promise resolving to the saved AppliedExerciseModel
 */
async save(
    exercise: AppliedExerciseModel,
    inTransaction: boolean = false
  ): Promise<AppliedExerciseModel>
```

##### `findById()`

```typescript
/**
 * Retrieves an applied exercise by ID and hydrates it into an AppliedExerciseModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<AppliedExerciseModel | undefined>} Promise resolving to AppliedExerciseModel if found, undefined otherwise
 */
async findById(id: string): Promise<AppliedExerciseModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple applied exercises by their IDs and hydrates them into AppliedExerciseModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<AppliedExerciseModel[]>} Promise resolving to array of AppliedExerciseModels
 */
async findByIds(ids: string[]): Promise<AppliedExerciseModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all applied exercises for a profile ID and hydrates them into AppliedExerciseModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<AppliedExerciseModel[]>} Promise resolving to array of AppliedExerciseModels
 */
async findAll(profileId: string): Promise<AppliedExerciseModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes an applied exercise by ID from the database.
 *
 * @param {string} id - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string, inTransaction: boolean = false): Promise<void>
```

---

## File: `src/features/training-plan/data/ExerciseGroupRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/data/ExerciseGroupRepository.ts`

### class `ExerciseGroupRepository`

**Description:**
Concrete implementation of IExerciseGroupRepository using WatermelonDB. Handles persistence and retrieval of ExerciseGroup domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject. Self-assembles the full aggregate by injecting child repository interfaces.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new ExerciseGroupRepository instance.
 *
 * @param {IAppliedExerciseRepository} appliedExerciseRepo - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('IAppliedExerciseRepository') private appliedExerciseRepo: IAppliedExerciseRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  )
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists an ExerciseGroupModel to the database by converting it to plain data using the model's toPlainObject method. Also persists all child entities (applied exercises) in an atomic transaction.
 *
 * @param {ExerciseGroupModel} group - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<ExerciseGroupModel>} Promise resolving to the saved ExerciseGroupModel
 */
async save(
    group: ExerciseGroupModel,
    inTransaction: boolean = false
  ): Promise<ExerciseGroupModel>
```

##### `findById()`

```typescript
/**
 * Retrieves an exercise group by ID and hydrates it into an ExerciseGroupModel using the model's static hydrate method. Fetches and assembles all child entities.
 *
 * @param {string} id - 
 * @returns {Promise<ExerciseGroupModel | undefined>} Promise resolving to ExerciseGroupModel if found, undefined otherwise
 */
async findById(id: string): Promise<ExerciseGroupModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple exercise groups by their IDs and hydrates them into ExerciseGroupModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<ExerciseGroupModel[]>} Promise resolving to array of ExerciseGroupModels
 */
async findByIds(ids: string[]): Promise<ExerciseGroupModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all exercise groups for a profile ID and hydrates them into ExerciseGroupModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<ExerciseGroupModel[]>} Promise resolving to array of ExerciseGroupModels
 */
async findAll(profileId: string): Promise<ExerciseGroupModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes an exercise group by ID from the database, along with all its child entities.
 *
 * @param {string} id - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string, inTransaction: boolean = false): Promise<void>
```

---

## File: `src/features/training-plan/data/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/data/TrainingCycleRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/data/TrainingCycleRepository.ts`

### class `TrainingCycleRepository`

**Description:**
Concrete implementation of ITrainingCycleRepository using WatermelonDB. Handles persistence and retrieval of TrainingCycle domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new TrainingCycleRepository instance.
 *
 * @param {default} db - 
 */
constructor(db: Database = database)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a TrainingCycleModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {TrainingCycleModel} cycle - 
 * @returns {Promise<TrainingCycleModel>} Promise resolving to the saved TrainingCycleModel
 */
async save(cycle: TrainingCycleModel): Promise<TrainingCycleModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a training cycle by ID and hydrates it into a TrainingCycleModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<TrainingCycleModel | undefined>} Promise resolving to TrainingCycleModel if found, undefined otherwise
 */
async findById(id: string): Promise<TrainingCycleModel | undefined>
```

##### `findAll()`

```typescript
/**
 * Retrieves all training cycles for a profile ID and hydrates them into TrainingCycleModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<TrainingCycleModel[]>} Promise resolving to array of TrainingCycleModels
 */
async findAll(profileId: string): Promise<TrainingCycleModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a training cycle by ID from the database.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/training-plan/data/TrainingPlanRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/data/TrainingPlanRepository.ts`

### class `TrainingPlanRepository`

**Description:**
Concrete implementation of ITrainingPlanRepository using WatermelonDB. Handles persistence and retrieval of TrainingPlan domain models as aggregate roots. Self-assembles the full aggregate by injecting child repository interfaces and orchestrates the assembly of all child entities (sessions and their hierarchies). This repository acts as a pure data mapper, delegating hydration to the model's static hydrate method and dehydration to toPlainObject. All write operations are wrapped in atomic transactions to ensure data integrity.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new TrainingPlanRepository instance.
 *
 * @param {IWorkoutSessionRepository} sessionRepository - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('IWorkoutSessionRepository') private sessionRepository: IWorkoutSessionRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  )
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a TrainingPlanModel aggregate to the database by dehydrating it to plain data using the model's toPlainObject method. Also persists all child entities (sessions) in an atomic transaction to maintain consistency across the entire aggregate. The dehydration process extracts the core training plan data and session IDs, then delegates the persistence of child sessions to the injected session repository.
 *
 * @param {TrainingPlanModel} plan - 
 * @returns {Promise<TrainingPlanModel>} Promise resolving to the saved TrainingPlanModel aggregate
 */
async save(plan: TrainingPlanModel): Promise<TrainingPlanModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a training plan by ID and hydrates it into a TrainingPlanModel aggregate using the model's static hydrate method. Orchestrates the assembly of the complete domain model by fetching all child entities through injected child repositories. The internal assembly process fetches the top-level training plan data, then uses eager loading to fetch all descendant records (sessions, groups, exercises) for full hydration of the domain model.
 *
 * @param {string} id - 
 * @returns {Promise<TrainingPlanModel | undefined>} Promise resolving to TrainingPlanModel if found, undefined otherwise
 */
async findById(id: string): Promise<TrainingPlanModel | undefined>
```

##### `findAll()`

```typescript
/**
 * Retrieves training plans for a profile with optional filtering and hydrates them into TrainingPlanModel aggregates using the model's static hydrate method. Orchestrates the assembly of multiple complete domain models by batch-fetching child entities through injected repositories for optimal performance. The internal assembly process applies filters to the query, batch-fetches all required sessions with eager loading, and efficiently maps them back to their parent plans.
 *
 * @param {string} profileId - 
 * @param {{ isArchived?: boolean | undefined; cycleId?: string | undefined; } | undefined} filters - 
 * @returns {Promise<TrainingPlanModel[]>} Promise resolving to array of TrainingPlanModel aggregates
 */
async findAll(
    profileId: string,
    filters?:
```

##### `delete()`

```typescript
/**
 * Deletes a training plan by ID from the database along with all its child entities in an atomic transaction. Ensures cascade deletion of all sessions and their hierarchies through the injected child repositories.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/training-plan/data/WorkoutSessionRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/data/WorkoutSessionRepository.ts`

### class `WorkoutSessionRepository`

**Description:**
Concrete implementation of IWorkoutSessionRepository using WatermelonDB. Handles persistence and retrieval of WorkoutSession domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject. Self-assembles the full aggregate by injecting child repository interfaces.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new WorkoutSessionRepository instance.
 *
 * @param {IExerciseGroupRepository} exerciseGroupRepo - 
 * @param {IAppliedExerciseRepository} appliedExerciseRepo - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('IExerciseGroupRepository') private exerciseGroupRepo: IExerciseGroupRepository,
    @inject('IAppliedExerciseRepository') private appliedExerciseRepo: IAppliedExerciseRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  )
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a SessionModel to the database by converting it to plain data using the model's toPlainObject method. Also persists all child entities (groups and applied exercises) in an atomic transaction.
 *
 * @param {SessionModel} session - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<SessionModel>} Promise resolving to the saved SessionModel
 */
async save(session: SessionModel, inTransaction: boolean = false): Promise<SessionModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a workout session by ID and hydrates it into a SessionModel using the model's static hydrate method. Fetches and assembles all child entities.
 *
 * @param {string} id - 
 * @returns {Promise<SessionModel | undefined>} Promise resolving to SessionModel if found, undefined otherwise
 */
async findById(id: string): Promise<SessionModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple workout sessions by their IDs and hydrates them into SessionModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<SessionModel[]>} Promise resolving to array of SessionModels
 */
async findByIds(ids: string[]): Promise<SessionModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all workout sessions for a profile ID and hydrates them into SessionModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<SessionModel[]>} Promise resolving to array of SessionModels
 */
async findAll(profileId: string): Promise<SessionModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a workout session by ID from the database, along with all its child entities.
 *
 * @param {string} id - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string, inTransaction: boolean = false): Promise<void>
```

---

## File: `src/features/training-plan/domain/AppliedExerciseModel.ts`

### class `AppliedExerciseModel`

**Description:**
A domain model representing an applied exercise within a training plan. Contains the exercise reference, set configuration, rest time, and execution tracking.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; exerciseId: string; templateId: string | null; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; executionCount: number; createdAt: Date; updatedAt: Date; restTimeSeconds?: number | undefined; }} props - 
 */
protected constructor(props: AppliedExerciseData)
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `exerciseId: string`

##### `templateId: string | null`

##### `setConfiguration: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/training-plan/domain/sets/SetConfiguration").SetConfiguration`

##### `restTimeSeconds: number | undefined`

##### `executionCount: number`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new AppliedExerciseModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; exerciseId: string; templateId: string | null; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; executionCount: number; createdAt: Date; updatedAt: Date; restTimeSeconds?: number | undefined; }} props - 
 * @returns {AppliedExerciseModel} A new AppliedExerciseModel instance
 */
public static hydrate(props: AppliedExerciseData): AppliedExerciseModel
```

#### Public Instance Methods

##### `cloneWithIncrementedExecutionCount()`

```typescript
/**
 * Creates a new applied exercise instance with incremented execution count.
 *
 * @returns {AppliedExerciseModel} A new AppliedExerciseModel instance with execution count incremented by 1
 */
public cloneWithIncrementedExecutionCount(): AppliedExerciseModel
```

##### `cloneWithNewRestTime()`

```typescript
/**
 * Creates a new applied exercise instance with updated rest time.
 *
 * @param {number | undefined} restTimeSeconds - 
 * @returns {AppliedExerciseModel} A new AppliedExerciseModel instance with updated rest time
 */
cloneWithNewRestTime(restTimeSeconds?: number): AppliedExerciseModel
```

##### `cloneWithNewSetConfiguration()`

```typescript
/**
 * Creates a new applied exercise instance with updated set configuration.
 *
 * @param {SetConfiguration} newSetConfiguration - 
 * @returns {AppliedExerciseModel} A new AppliedExerciseModel instance with updated configuration
 */
cloneWithNewSetConfiguration(newSetConfiguration: SetConfiguration): AppliedExerciseModel
```

##### `getTotalSets()`

```typescript
/**
 * Gets the total number of sets defined in the set configuration.
 *
 * @returns {number} The total number of sets
 */
getTotalSets(): number
```

##### `getSetSummary()`

```typescript
/**
 * Gets a summary of the set configuration.
 *
 * @returns {string} A string summarizing the set structure
 */
getSetSummary(): string
```

##### `hasTemplate()`

```typescript
/**
 * Checks if this applied exercise has a template reference.
 *
 * @returns {boolean} True if templateId is not null
 */
hasTemplate(): boolean
```

##### `hasCustomRestTime()`

```typescript
/**
 * Checks if this applied exercise has custom rest time defined.
 *
 * @returns {boolean} True if restTimeSeconds is defined
 */
hasCustomRestTime(): boolean
```

##### `getExecutionCount()`

```typescript
/**
 * Gets the execution count for this applied exercise.
 *
 * @returns {number} The number of times this exercise has been executed
 */
getExecutionCount(): number
```

##### `hasBeenExecuted()`

```typescript
/**
 * Checks if this applied exercise has been executed before.
 *
 * @returns {boolean} True if execution count is greater than 0
 */
hasBeenExecuted(): boolean
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this AppliedExerciseModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; exerciseId: string; templateId: string | null; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; executionCount: number; createdAt: Date; updatedAt: Date; restTimeSeconds?: number | undefined; }} The plain AppliedExerciseData object
 */
toPlainObject(): AppliedExerciseData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; exerciseId: string; templateId: string | null; setConfiguration: { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }; executionCount: number; createdAt: Date; updatedAt: Date; restTimeSeconds?: number | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/training-plan/domain/ExerciseGroupModel.ts`

### class `ExerciseGroupModel`

**Description:**
A domain model representing a group of exercises in a training plan. Acts as a polymorphic factory for specialized group types (superset, circuit, etc.).

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} props - 
 * @param {AppliedExerciseModel[]} appliedExercises - 
 */
protected constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[])
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `type: "stretching" | "single" | "superset" | "circuit" | "emom" | "amrap" | "warmup"`

##### `appliedExercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/training-plan/domain/AppliedExerciseModel").AppliedExerciseModel[]`

##### `restTimeSeconds: number | undefined`

##### `durationMinutes: number | undefined`

##### `rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new ExerciseGroupModel instance from plain data using polymorphic instantiation.
 *
 * @param {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} props - 
 * @param {AppliedExerciseModel[]} appliedExercises - 
 * @returns {ExerciseGroupModel} A specialized ExerciseGroupModel subclass based on the type
 */
public static hydrate(
    props: ExerciseGroupData,
    appliedExercises: AppliedExerciseModel[]
  ): ExerciseGroupModel
```

#### Public Instance Methods

##### `cloneWithReorderedExercise()`

```typescript
/**
 * Creates a new group instance with a reordered exercise.
 *
 * @param {string} appliedExerciseId - 
 * @param {"up" | "down"} direction - 
 * @returns {ExerciseGroupModel} A new ExerciseGroupModel instance with reordered exercises
 */
cloneWithReorderedExercise(
    appliedExerciseId: string,
    direction: 'up' | 'down'
  ): ExerciseGroupModel
```

##### `cloneWithAddedExercise()`

```typescript
/**
 * Creates a new group instance with an added exercise.
 *
 * @param {AppliedExerciseModel} appliedExercise - 
 * @returns {ExerciseGroupModel} A new ExerciseGroupModel instance with the added exercise
 */
cloneWithAddedExercise(appliedExercise: AppliedExerciseModel): ExerciseGroupModel
```

##### `cloneWithRemovedExercise()`

```typescript
/**
 * Creates a new group instance with a removed exercise.
 *
 * @param {string} appliedExerciseId - 
 * @returns {ExerciseGroupModel} A new ExerciseGroupModel instance with the exercise removed
 */
cloneWithRemovedExercise(appliedExerciseId: string): ExerciseGroupModel
```

##### `cloneWithNewRestTime()`

```typescript
/**
 * Creates a new group instance with updated rest time.
 *
 * @param {number | undefined} restTimeSeconds - 
 * @returns {ExerciseGroupModel} A new ExerciseGroupModel instance with updated rest time
 */
cloneWithNewRestTime(restTimeSeconds?: number): ExerciseGroupModel
```

##### `getExerciseCount()`

```typescript
/**
 * Gets the total number of exercises in this group.
 *
 * @returns {number} The number of applied exercises
 */
getExerciseCount(): number
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * Gets the estimated duration for this group in seconds.
 *
 * @returns {number} Estimated duration based on exercises and rest time
 */
getEstimatedDurationSeconds(): number
```

##### `hasCustomRestTime()`

```typescript
/**
 * Checks if this group has custom rest time defined.
 *
 * @returns {boolean} True if restTimeSeconds is defined
 */
hasCustomRestTime(): boolean
```

##### `hasDuration()`

```typescript
/**
 * Checks if this group has duration-based configuration (EMOM/AMRAP).
 *
 * @returns {boolean} True if durationMinutes is defined
 */
hasDuration(): boolean
```

##### `hasRounds()`

```typescript
/**
 * Checks if this group has rounds configuration.
 *
 * @returns {boolean} True if rounds is defined
 */
hasRounds(): boolean
```

##### `getType()`

```typescript
/**
 * Gets the group type.
 *
 * @returns {string} The exercise group type
 */
getType(): string
```

##### `cloneAsCopy()`

```typescript
/**
 * Creates a complete copy of this group with new IDs.
 *
 * @returns {ExerciseGroupModel} A new ExerciseGroupModel instance with new IDs for all components
 */
cloneAsCopy(): ExerciseGroupModel
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this ExerciseGroupModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} The plain ExerciseGroupData object
 */
toPlainObject(): ExerciseGroupData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/training-plan/domain/hydrateSets.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/IAppliedExerciseRepository.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/IExerciseGroupRepository.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/ITrainingCycleRepository.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/ITrainingPlanRepository.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/IWorkoutSessionRepository.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/SessionModel.ts`

### class `SessionModel`

**Description:**
A domain model representing a workout session in a training plan. Contains groups of exercises, execution tracking, and session metadata.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; name: string; groupIds: string[]; executionCount: number; isDeload: boolean; dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 * @param {ExerciseGroupModel[]} groups - 
 */
protected constructor(props: WorkoutSessionData, groups: ExerciseGroupModel[])
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `name: string`

##### `groups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/training-plan/domain/ExerciseGroupModel").ExerciseGroupModel[]`

##### `notes: string | undefined`

##### `executionCount: number`

##### `isDeload: boolean`

##### `dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new SessionModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; name: string; groupIds: string[]; executionCount: number; isDeload: boolean; dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 * @param {ExerciseGroupModel[]} groups - 
 * @returns {SessionModel} A new SessionModel instance
 */
public static hydrate(props: WorkoutSessionData, groups: ExerciseGroupModel[]): SessionModel
```

#### Public Instance Methods

##### `cloneWithIncrementedExecutionCount()`

```typescript
/**
 * Creates a new session instance with incremented execution count.
 *
 * @returns {SessionModel} A new SessionModel instance with execution count incremented by 1
 */
public cloneWithIncrementedExecutionCount(): SessionModel
```

##### `cloneWithNewName()`

```typescript
/**
 * Creates a new session instance with updated name.
 *
 * @param {string} newName - 
 * @returns {SessionModel} A new SessionModel instance with updated name
 */
cloneWithNewName(newName: string): SessionModel
```

##### `cloneWithNewNotes()`

```typescript
/**
 * Creates a new session instance with updated notes.
 *
 * @param {string | undefined} newNotes - 
 * @returns {SessionModel} A new SessionModel instance with updated notes
 */
cloneWithNewNotes(newNotes?: string): SessionModel
```

##### `cloneWithNewDayOfWeek()`

```typescript
/**
 * Creates a new session instance with updated day of week.
 *
 * @param {"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null} dayOfWeek - 
 * @returns {SessionModel} A new SessionModel instance with updated day of week
 */
cloneWithNewDayOfWeek(dayOfWeek: DayOfWeek | null): SessionModel
```

##### `findExerciseById()`

```typescript
/**
 * Finds an applied exercise by ID within this session.
 *
 * @param {string} appliedExerciseId - 
 * @returns {{ exercise: AppliedExerciseModel; group: ExerciseGroupModel; } | undefined} The exercise and its containing group, or undefined if not found
 */
findExerciseById(
    appliedExerciseId: string
  ):
```

##### `getTotalExerciseCount()`

```typescript
/**
 * Gets the total number of exercises across all groups in this session.
 *
 * @returns {number} The total exercise count
 */
getTotalExerciseCount(): number
```

##### `getTotalGroupCount()`

```typescript
/**
 * Gets the total number of groups in this session.
 *
 * @returns {number} The total group count
 */
getTotalGroupCount(): number
```

##### `cloneAsCopy()`

```typescript
/**
 * Creates a complete copy of this session with new IDs.
 *
 * @param {string} newName - 
 * @returns {SessionModel} A new SessionModel instance with new IDs for all components
 */
cloneAsCopy(newName: string): SessionModel
```

##### `cloneWithReorderedGroup()`

```typescript
/**
 * Creates a new session instance with a reordered group.
 *
 * @param {string} groupId - 
 * @param {"up" | "down"} direction - 
 * @returns {SessionModel} A new SessionModel instance with reordered groups
 */
cloneWithReorderedGroup(groupId: string, direction: 'up' | 'down'): SessionModel
```

##### `cloneWithRemovedExercise()`

```typescript
/**
 * Creates a new session instance with a removed exercise.
 *
 * @param {string} appliedExerciseId - 
 * @returns {SessionModel} A new SessionModel instance with the exercise removed
 */
cloneWithRemovedExercise(appliedExerciseId: string): SessionModel
```

##### `cloneWithAddedGroup()`

```typescript
/**
 * Creates a new session instance with added group.
 *
 * @param {ExerciseGroupModel} group - 
 * @returns {SessionModel} A new SessionModel instance with the added group
 */
cloneWithAddedGroup(group: ExerciseGroupModel): SessionModel
```

##### `cloneWithRemovedGroup()`

```typescript
/**
 * Creates a new session instance with a removed group.
 *
 * @param {string} groupId - 
 * @returns {SessionModel} A new SessionModel instance with the group removed
 */
cloneWithRemovedGroup(groupId: string): SessionModel
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * Gets the estimated total duration for this session in seconds.
 *
 * @returns {number} Estimated duration based on all groups and exercises
 */
getEstimatedDurationSeconds(): number
```

##### `cloneWithToggledDeload()`

```typescript
/**
 * Creates a new session instance with toggled deload status.
 *
 * @returns {SessionModel} A new SessionModel instance with inverted deload status
 */
cloneWithToggledDeload(): SessionModel
```

##### `hasBeenExecuted()`

```typescript
/**
 * Checks if this session has been executed before.
 *
 * @returns {boolean} True if execution count is greater than 0
 */
hasBeenExecuted(): boolean
```

##### `hasScheduledDay()`

```typescript
/**
 * Checks if this session is scheduled for a specific day.
 *
 * @returns {boolean} True if dayOfWeek is not null
 */
hasScheduledDay(): boolean
```

##### `hasNotes()`

```typescript
/**
 * Checks if this session has notes.
 *
 * @returns {boolean} True if notes are present
 */
hasNotes(): boolean
```

##### `getDisplayName()`

```typescript
/**
 * Gets the session display name.
 *
 * @returns {string} The session name
 */
getDisplayName(): string
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this SessionModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; name: string; groupIds: string[]; executionCount: number; isDeload: boolean; dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} The plain WorkoutSessionData object
 */
toPlainObject(): WorkoutSessionData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; name: string; groupIds: string[]; executionCount: number; isDeload: boolean; dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null; createdAt: Date; updatedAt: Date; notes?: string | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/training-plan/domain/SetConfigurationFactory.ts`

### class `SetConfigurationFactory`

**Description:**
Factory class for creating SetConfiguration instances. Placed outside the sets directory to avoid circular dependencies.

#### Public Static Methods

##### `create()`

```typescript
/**
 * Creates the appropriate SetConfiguration subclass based on the data type.
 *
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 * @returns {SetConfiguration} An instance of a concrete SetConfiguration subclass.
 * @throws Error if the set configuration type is unknown.
 */
public static create(data: AnySetConfigurationData): SetConfiguration
```

---

## File: `src/features/training-plan/domain/TrainingCycleModel.ts`

### class `TrainingCycleModel`

**Description:**
A domain model representing a training cycle aggregate root. Contains cycle metadata, manages duration, and tracks progress over time.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; name: string; startDate: Date; endDate: Date; goal: "strength" | "hypertrophy" | "other" | "cutting" | "maintenance"; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 */
protected constructor(props: TrainingCycleData)
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `name: string`

##### `startDate: Date`

##### `endDate: Date`

##### `goal: "strength" | "hypertrophy" | "other" | "cutting" | "maintenance"`

##### `notes: string | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new TrainingCycleModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; name: string; startDate: Date; endDate: Date; goal: "strength" | "hypertrophy" | "other" | "cutting" | "maintenance"; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} props - 
 * @returns {TrainingCycleModel} A new TrainingCycleModel instance
 */
public static hydrate(props: TrainingCycleData): TrainingCycleModel
```

#### Public Instance Methods

##### `getDurationInDays()`

```typescript
/**
 * Gets the total duration of the training cycle in days.
 *
 * @returns {number} The duration in days (inclusive of start and end dates)
 */
getDurationInDays(): number
```

##### `getDurationInWeeks()`

```typescript
/**
 * Gets the approximate duration of the training cycle in weeks.
 *
 * @returns {number} The duration in weeks (rounded)
 */
getDurationInWeeks(): number
```

##### `isActive()`

```typescript
/**
 * Checks if the training cycle is currently active.
 *
 * @param {Date} currentDate - 
 * @returns {boolean} True if the current date falls within the cycle period
 */
isActive(currentDate: Date): boolean
```

##### `isCompleted()`

```typescript
/**
 * Checks if the training cycle has been completed.
 *
 * @param {Date} currentDate - 
 * @returns {boolean} True if the cycle end date has passed
 */
isCompleted(currentDate: Date): boolean
```

##### `isFuture()`

```typescript
/**
 * Checks if the training cycle is scheduled for the future.
 *
 * @param {Date} currentDate - 
 * @returns {boolean} True if the cycle start date is in the future
 */
isFuture(currentDate: Date): boolean
```

##### `getCompletionPercentage()`

```typescript
/**
 * Calculates the completion percentage of the training cycle.
 *
 * @param {Date} currentDate - 
 * @returns {number} The completion percentage (0-100)
 */
getCompletionPercentage(currentDate: Date): number
```

##### `getRemainingDays()`

```typescript
/**
 * Gets the number of days remaining in the training cycle.
 *
 * @param {Date} currentDate - 
 * @returns {number} The number of days remaining (0 if completed)
 */
getRemainingDays(currentDate: Date): number
```

##### `getElapsedDays()`

```typescript
/**
 * Gets the number of days elapsed since the cycle started.
 *
 * @param {Date} currentDate - 
 * @returns {number} The number of days elapsed (0 if not started)
 */
getElapsedDays(currentDate: Date): number
```

##### `cloneWithUpdatedDetails()`

```typescript
/**
 * Creates a new training cycle instance with updated details.
 *
 * @param {{ name?: string | undefined; goal?: "strength" | "hypertrophy" | "other" | "cutting" | "maintenance" | undefined; notes?: string | undefined; }} details - 
 * @returns {TrainingCycleModel} A new TrainingCycleModel instance with updated details
 */
cloneWithUpdatedDetails(details:
```

##### `cloneWithNewDates()`

```typescript
/**
 * Creates a new training cycle instance with new start and end dates.
 *
 * @param {Date} newStartDate - 
 * @param {Date} newEndDate - 
 * @returns {TrainingCycleModel} A new TrainingCycleModel instance with updated dates
 * @throws Error if start date is after end date
 */
cloneWithNewDates(newStartDate: Date, newEndDate: Date): TrainingCycleModel
```

##### `cloneWithExtendedDuration()`

```typescript
/**
 * Creates a new training cycle instance with extended duration.
 *
 * @param {number} daysToAdd - 
 * @returns {TrainingCycleModel} A new TrainingCycleModel instance with extended end date
 */
cloneWithExtendedDuration(daysToAdd: number): TrainingCycleModel
```

##### `cloneWithShiftedDates()`

```typescript
/**
 * Creates a new training cycle instance with shifted dates.
 *
 * @param {number} daysToShift - 
 * @returns {TrainingCycleModel} A new TrainingCycleModel instance with shifted dates
 */
cloneWithShiftedDates(daysToShift: number): TrainingCycleModel
```

##### `getAssociatedPlans()`

```typescript
/**
 * Filters training plans to get those associated with this cycle.
 *
 * @param {TrainingPlanModel[]} allPlansInProfile - 
 * @returns {TrainingPlanModel[]} Training plans that belong to this cycle
 */
getAssociatedPlans(allPlansInProfile: TrainingPlanModel[]): TrainingPlanModel[]
```

##### `getTotalSessionCount()`

```typescript
/**
 * Gets the total number of sessions across all associated training plans.
 *
 * @param {TrainingPlanModel[]} plans - 
 * @returns {number} The total session count
 */
getTotalSessionCount(plans: TrainingPlanModel[]): number
```

##### `getWeeklySessionFrequency()`

```typescript
/**
 * Calculates the average weekly session frequency for the cycle.
 *
 * @param {TrainingPlanModel[]} plans - 
 * @returns {number} The average sessions per week
 */
getWeeklySessionFrequency(plans: TrainingPlanModel[]): number
```

##### `findPlansByDayOfWeek()`

```typescript
/**
 * Finds training plans that have sessions scheduled for a specific day.
 *
 * @param {"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"} day - 
 * @param {TrainingPlanModel[]} plans - 
 * @returns {TrainingPlanModel[]} Training plans with sessions on the specified day
 */
findPlansByDayOfWeek(day: DayOfWeek, plans: TrainingPlanModel[]): TrainingPlanModel[]
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this TrainingCycleModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; name: string; startDate: Date; endDate: Date; goal: "strength" | "hypertrophy" | "other" | "cutting" | "maintenance"; createdAt: Date; updatedAt: Date; notes?: string | undefined; }} The plain TrainingCycleData object
 */
toPlainObject(): TrainingCycleData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; name: string; startDate: Date; endDate: Date; goal: "strength" | "hypertrophy" | "other" | "cutting" | "maintenance"; createdAt: Date; updatedAt: Date; notes?: string | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/training-plan/domain/TrainingPlanModel.ts`

### class `TrainingPlanModel`

**Description:**
A domain model representing a training plan aggregate root. Contains sessions, metadata, and orchestrates the training cycle progression.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; name: string; sessionIds: string[]; isArchived: boolean; currentSessionIndex: number; cycleId: string | null; createdAt: Date; updatedAt: Date; description?: string | undefined; notes?: string | undefined; order?: number | undefined; lastUsed?: Date | undefined; }} props - 
 * @param {SessionModel[]} sessions - 
 */
protected constructor(props: TrainingPlanData, sessions: SessionModel[])
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `name: string`

##### `description: string | undefined`

##### `sessions: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/training-plan/domain/SessionModel").SessionModel[]`

##### `isArchived: boolean`

##### `currentSessionIndex: number`

##### `notes: string | undefined`

##### `cycleId: string | null`

##### `order: number | undefined`

##### `lastUsed: Date | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new TrainingPlanModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; name: string; sessionIds: string[]; isArchived: boolean; currentSessionIndex: number; cycleId: string | null; createdAt: Date; updatedAt: Date; description?: string | undefined; notes?: string | undefined; order?: number | undefined; lastUsed?: Date | undefined; }} props - 
 * @param {SessionModel[]} sessions - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance
 */
public static hydrate(props: TrainingPlanData, sessions: SessionModel[]): TrainingPlanModel
```

#### Public Instance Methods

##### `cloneWithUpdatedDetails()`

```typescript
/**
 * Creates a new training plan instance with updated details.
 *
 * @param {{ name?: string | undefined; description?: string | undefined; notes?: string | undefined; }} details - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with updated details
 */
cloneWithUpdatedDetails(details:
```

##### `cloneWithAddedSession()`

```typescript
/**
 * Creates a new training plan instance with an added session.
 *
 * @param {SessionModel} session - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with the added session
 */
cloneWithAddedSession(session: SessionModel): TrainingPlanModel
```

##### `cloneWithRemovedSession()`

```typescript
/**
 * Creates a new training plan instance with a removed session.
 *
 * @param {string} sessionId - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with the session removed
 */
cloneWithRemovedSession(sessionId: string): TrainingPlanModel
```

##### `cloneWithReorderedSession()`

```typescript
/**
 * Creates a new training plan instance with a reordered session.
 *
 * @param {string} sessionId - 
 * @param {number} newIndex - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with reordered sessions
 */
cloneWithReorderedSession(sessionId: string, newIndex: number): TrainingPlanModel
```

##### `cloneWithReplacedSession()`

```typescript
/**
 * Creates a new training plan instance with a replaced session.
 *
 * @param {string} sessionId - 
 * @param {SessionModel} newSession - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with the replaced session
 */
cloneWithReplacedSession(sessionId: string, newSession: SessionModel): TrainingPlanModel
```

##### `cloneAsArchived()`

```typescript
/**
 * Creates a new training plan instance marked as archived.
 *
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with isArchived set to true
 */
cloneAsArchived(): TrainingPlanModel
```

##### `cloneAsUnarchived()`

```typescript
/**
 * Creates a new training plan instance marked as unarchived.
 *
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with isArchived set to false
 */
cloneAsUnarchived(): TrainingPlanModel
```

##### `cloneWithAssignedCycle()`

```typescript
/**
 * Creates a new training plan instance with assigned training cycle.
 *
 * @param {string} cycleId - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with the assigned cycle
 */
cloneWithAssignedCycle(cycleId: string): TrainingPlanModel
```

##### `cloneWithRemovedCycle()`

```typescript
/**
 * Creates a new training plan instance with removed training cycle.
 *
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with no assigned cycle
 */
cloneWithRemovedCycle(): TrainingPlanModel
```

##### `cloneWithUpdatedOrderInCycle()`

```typescript
/**
 * Creates a new training plan instance with updated order within a cycle.
 *
 * @param {number} newOrder - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with updated order
 */
cloneWithUpdatedOrderInCycle(newOrder: number): TrainingPlanModel
```

##### `cloneWithProgressedSession()`

```typescript
/**
 * Creates a new training plan instance with progressed session index. Cycles to the next session, wrapping around to the first if at the end.
 *
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with progressed session index
 */
cloneWithProgressedSession(): TrainingPlanModel
```

##### `cloneAsUsed()`

```typescript
/**
 * Creates a new training plan instance marked as used at a specific date.
 *
 * @param {Date} date - 
 * @returns {TrainingPlanModel} A new TrainingPlanModel instance with updated lastUsed date
 */
cloneAsUsed(date: Date): TrainingPlanModel
```

##### `findSessionById()`

```typescript
/**
 * Finds a session by its ID within this training plan.
 *
 * @param {string} sessionId - 
 * @returns {SessionModel | undefined} The session model or undefined if not found
 */
findSessionById(sessionId: string): SessionModel | undefined
```

##### `getCurrentSession()`

```typescript
/**
 * Gets the current active session based on the current session index.
 *
 * @returns {SessionModel | undefined} The current session model or undefined if no sessions exist
 */
getCurrentSession(): SessionModel | undefined
```

##### `getTotalSessions()`

```typescript
/**
 * Gets the total number of sessions in this training plan.
 *
 * @returns {number} The total session count
 */
getTotalSessions(): number
```

##### `getDeloadSessionCount()`

```typescript
/**
 * Gets the count of deload sessions in this training plan.
 *
 * @returns {number} The number of deload sessions
 */
getDeloadSessionCount(): number
```

##### `estimateTotalDurationMinutes()`

```typescript
/**
 * Estimates the total duration range for completing all sessions.
 *
 * @returns {{ min: number; max: number; }} An object with min and max duration estimates in minutes
 */
estimateTotalDurationMinutes():
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this TrainingPlanModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; name: string; sessionIds: string[]; isArchived: boolean; currentSessionIndex: number; cycleId: string | null; createdAt: Date; updatedAt: Date; description?: string | undefined; notes?: string | undefined; order?: number | undefined; lastUsed?: Date | undefined; }} The plain TrainingPlanData object
 */
toPlainObject(): TrainingPlanData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; name: string; sessionIds: string[]; isArchived: boolean; currentSessionIndex: number; cycleId: string | null; createdAt: Date; updatedAt: Date; description?: string | undefined; notes?: string | undefined; order?: number | undefined; lastUsed?: Date | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/training-plan/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useArchiveTrainingPlan.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useCreateTrainingCycle.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useCreateTrainingPlan.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useDeleteTrainingCycle.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useDeleteTrainingPlan.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useGetTrainingCycle.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useGetTrainingCycles.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useGetTrainingPlan.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useGetTrainingPlanDetails.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useGetTrainingPlans.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/usePlanEditorData.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useTrainingPlanProgress.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useUpdateTrainingCycle.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/useUpdateTrainingPlan.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/machines/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/machines/sessionEditorMachine.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/machines/SessionEditorProvider.tsx`

_No exported classes found in this file._

## File: `src/features/training-plan/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/query-services/TrainingPlanQueryService.ts`

### class `TrainingPlanQueryService`

**Description:**
Query service that acts as an adapter between the Training Plan Application Layer and React Query. This service handles the unwrapping of Result objects returned by the TrainingPlanService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all training plan and cycle-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {TrainingPlanService} trainingPlanService - 
 */
constructor(
    @inject('TrainingPlanService') private readonly trainingPlanService: TrainingPlanService
  )
```

#### Public Instance Methods

##### `createTrainingPlan()`

```typescript
/**
 * Creates a new training plan for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string} name - 
 * @param {string | undefined} description - 
 * @param {string | undefined} cycleId - 
 * @returns {Promise<TrainingPlanModel>} Promise resolving to the created TrainingPlanModel
 * @throws When the operation fails
 */
async createTrainingPlan(
    profileId: string,
    name: string,
    description?: string,
    cycleId?: string
  ): Promise<TrainingPlanModel>
```

##### `createTrainingCycle()`

```typescript
/**
 * Creates a new training cycle for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string} name - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @param {string} goal - 
 * @param {string | undefined} notes - 
 * @returns {Promise<TrainingCycleModel>} Promise resolving to the created TrainingCycleModel
 * @throws When the operation fails
 */
async createTrainingCycle(
    profileId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    goal: string,
    notes?: string
  ): Promise<TrainingCycleModel>
```

##### `getTrainingPlan()`

```typescript
/**
 * Retrieves a training plan by its unique identifier.
 *
 * @param {string} planId - 
 * @returns {Promise<TrainingPlanModel>} Promise resolving to the TrainingPlanModel
 * @throws When the operation fails
 */
async getTrainingPlan(planId: string): Promise<TrainingPlanModel>
```

##### `getTrainingPlanQuery()`

```typescript
/**
 * Gets a WatermelonDB query for a specific training plan by ID.
 *
 * @param {string} planId - 
 * @returns {default<TrainingPlan>} Query for TrainingPlan model for reactive observation
 */
getTrainingPlanQuery(planId: string): Query<TrainingPlan>
```

##### `getTrainingCycle()`

```typescript
/**
 * Retrieves a training cycle by its unique identifier.
 *
 * @param {string} cycleId - 
 * @returns {Promise<TrainingCycleModel>} Promise resolving to the TrainingCycleModel
 * @throws When the operation fails
 */
async getTrainingCycle(cycleId: string): Promise<TrainingCycleModel>
```

##### `getTrainingCycleQuery()`

```typescript
/**
 * Gets a WatermelonDB query for a specific training cycle by ID.
 *
 * @param {string} cycleId - 
 * @returns {default<TrainingCycle>} Query for TrainingCycle model for reactive observation
 */
getTrainingCycleQuery(cycleId: string): Query<TrainingCycle>
```

##### `getTrainingPlans()`

```typescript
/**
 * Retrieves all training plans for a specific profile.
 *
 * @param {string} profileId - 
 * @param {{ isArchived?: boolean | undefined; cycleId?: string | undefined; } | undefined} filters - 
 * @returns {default<TrainingPlan>} Query for TrainingPlan models for reactive observation
 * @throws When the operation fails
 */
getTrainingPlans(
    profileId: string,
    filters?:
```

##### `getTrainingCycles()`

```typescript
/**
 * Retrieves all training cycles for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {default<TrainingCycle>} Query for TrainingCycle models for reactive observation
 * @throws When the operation fails
 */
getTrainingCycles(profileId: string): Query<TrainingCycle>
```

##### `updateTrainingPlan()`

```typescript
/**
 * Updates a training plan's basic information.
 *
 * @param {string} planId - 
 * @param {{ name?: string | undefined; description?: string | undefined; notes?: string | undefined; cycleId?: string | null | undefined; }} updates - 
 * @returns {Promise<TrainingPlanModel>} Promise resolving to the updated TrainingPlanModel
 * @throws When the operation fails
 */
async updateTrainingPlan(
    planId: string,
    updates:
```

##### `updateTrainingCycle()`

```typescript
/**
 * Updates a training cycle's basic information.
 *
 * @param {string} cycleId - 
 * @param {{ name?: string | undefined; startDate?: Date | undefined; endDate?: Date | undefined; goal?: string | undefined; notes?: string | undefined; }} updates - 
 * @returns {Promise<TrainingCycleModel>} Promise resolving to the updated TrainingCycleModel
 * @throws When the operation fails
 */
async updateTrainingCycle(
    cycleId: string,
    updates:
```

##### `archiveTrainingPlan()`

```typescript
/**
 * Archives a training plan (soft delete).
 *
 * @param {string} planId - 
 * @returns {Promise<TrainingPlanModel>} Promise resolving to the archived TrainingPlanModel
 * @throws When the operation fails
 */
async archiveTrainingPlan(planId: string): Promise<TrainingPlanModel>
```

##### `deleteTrainingPlan()`

```typescript
/**
 * Permanently deletes a training plan from the system. This operation cascades to delete all child entities (sessions, exercise groups, applied exercises).
 *
 * @param {string} planId - 
 * @param {{ deleteChildren: boolean; }} options - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteTrainingPlan(planId: string, options:
```

##### `deleteTrainingCycle()`

```typescript
/**
 * Permanently deletes a training cycle from the system. This operation also removes the cycle association from any related training plans.
 *
 * @param {string} cycleId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteTrainingCycle(cycleId: string): Promise<void>
```

---

## File: `src/features/training-plan/services/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/services/TrainingPlanService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/services/TrainingPlanService.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/services/TrainingPlanService.ts`

### class `TrainingPlanService`

**Description:**
Application service responsible for orchestrating training plan and cycle operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to training plan and cycle management including creation, retrieval, updates, archiving, and cascading deletions.

#### Constructor

##### Constructor

```typescript
/**
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 * @param {ITrainingCycleRepository} trainingCycleRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('ITrainingPlanRepository') private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('ITrainingCycleRepository') private readonly trainingCycleRepository: ITrainingCycleRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `createTrainingPlan()`

```typescript
/**
 * Creates a new training plan for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string} name - 
 * @param {string | undefined} description - 
 * @param {string | undefined} cycleId - 
 * @returns {Promise<Result<TrainingPlanModel, ApplicationError>>} A Result containing the created TrainingPlanModel or an error
 */
async createTrainingPlan(
    profileId: string,
    name: string,
    description?: string,
    cycleId?: string
  ): Promise<Result<TrainingPlanModel, ApplicationError>>
```

##### `createTrainingCycle()`

```typescript
/**
 * Creates a new training cycle for a specific profile.
 *
 * @param {string} profileId - 
 * @param {string} name - 
 * @param {Date} startDate - 
 * @param {Date} endDate - 
 * @param {string} goal - 
 * @param {string | undefined} notes - 
 * @returns {Promise<Result<TrainingCycleModel, ApplicationError>>} A Result containing the created TrainingCycleModel or an error
 */
async createTrainingCycle(
    profileId: string,
    name: string,
    startDate: Date,
    endDate: Date,
    goal: string,
    notes?: string
  ): Promise<Result<TrainingCycleModel, ApplicationError>>
```

##### `getTrainingPlan()`

```typescript
/**
 * Retrieves a training plan by its unique identifier.
 *
 * @param {string} planId - 
 * @returns {Promise<Result<TrainingPlanModel, ApplicationError>>} A Result containing the TrainingPlanModel or an error
 */
async getTrainingPlan(planId: string): Promise<Result<TrainingPlanModel, ApplicationError>>
```

##### `getTrainingCycle()`

```typescript
/**
 * Retrieves a training cycle by its unique identifier.
 *
 * @param {string} cycleId - 
 * @returns {Promise<Result<TrainingCycleModel, ApplicationError>>} A Result containing the TrainingCycleModel or an error
 */
async getTrainingCycle(cycleId: string): Promise<Result<TrainingCycleModel, ApplicationError>>
```

##### `getTrainingPlans()`

```typescript
/**
 * Retrieves all training plans for a specific profile.
 *
 * @param {string} profileId - 
 * @param {{ isArchived?: boolean | undefined; cycleId?: string | undefined; } | undefined} filters - 
 * @returns {Promise<Result<TrainingPlanModel[], ApplicationError>>} A Result containing an array of TrainingPlanModels or an error
 */
async getTrainingPlans(
    profileId: string,
    filters?:
```

##### `getTrainingCycles()`

```typescript
/**
 * Retrieves all training cycles for a specific profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<Result<TrainingCycleModel[], ApplicationError>>} A Result containing an array of TrainingCycleModels or an error
 */
async getTrainingCycles(
    profileId: string
  ): Promise<Result<TrainingCycleModel[], ApplicationError>>
```

##### `updateTrainingPlan()`

```typescript
/**
 * Updates a training plan's basic information.
 *
 * @param {string} planId - 
 * @param {{ name?: string | undefined; description?: string | undefined; notes?: string | undefined; cycleId?: string | null | undefined; }} updates - 
 * @returns {Promise<Result<TrainingPlanModel, ApplicationError>>} A Result containing the updated TrainingPlanModel or an error
 */
async updateTrainingPlan(
    planId: string,
    updates:
```

##### `updateTrainingCycle()`

```typescript
/**
 * Updates a training cycle's basic information.
 *
 * @param {string} cycleId - 
 * @param {{ name?: string | undefined; startDate?: Date | undefined; endDate?: Date | undefined; goal?: string | undefined; notes?: string | undefined; }} updates - 
 * @returns {Promise<Result<TrainingCycleModel, ApplicationError>>} A Result containing the updated TrainingCycleModel or an error
 */
async updateTrainingCycle(
    cycleId: string,
    updates:
```

##### `archiveTrainingPlan()`

```typescript
/**
 * Archives a training plan (soft delete).
 *
 * @param {string} planId - 
 * @returns {Promise<Result<TrainingPlanModel, ApplicationError>>} A Result containing the archived TrainingPlanModel or an error
 */
async archiveTrainingPlan(planId: string): Promise<Result<TrainingPlanModel, ApplicationError>>
```

##### `deleteTrainingPlan()`

```typescript
/**
 * Permanently deletes a training plan from the system. This operation cascades to delete all child entities (sessions, exercise groups, applied exercises).
 *
 * @param {string} planId - 
 * @param {boolean} deleteChildren - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteTrainingPlan(
    planId: string,
    deleteChildren: boolean = true
  ): Promise<Result<void, ApplicationError>>
```

##### `deleteTrainingCycle()`

```typescript
/**
 * Permanently deletes a training cycle from the system. This operation also removes the cycle association from any related training plans.
 *
 * @param {string} cycleId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteTrainingCycle(cycleId: string): Promise<Result<void, ApplicationError>>
```

---

## File: `src/features/training-plan/store/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/store/planEditorStore.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/index.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/PerformedExerciseRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/PerformedExerciseRepository.ts`

### class `PerformedExerciseRepository`

**Description:**
Concrete implementation of IPerformedExerciseRepository using WatermelonDB. Handles persistence and retrieval of PerformedExercise domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject. Self-assembles the full aggregate by injecting child repository interfaces.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new PerformedExerciseRepository instance.
 *
 * @param {IPerformedSetRepository} performedSetRepo - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('IPerformedSetRepository') private performedSetRepo: IPerformedSetRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  )
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a PerformedExerciseLogModel to the database by converting it to plain data using the model's toPlainObject method. Also persists all child entities (performed sets) in an atomic transaction.
 *
 * @param {PerformedExerciseLogModel} exercise - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<PerformedExerciseLogModel>} Promise resolving to the saved PerformedExerciseLogModel
 */
async save(
    exercise: PerformedExerciseLogModel,
    inTransaction: boolean = false
  ): Promise<PerformedExerciseLogModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a performed exercise by ID and hydrates it into a PerformedExerciseLogModel using the model's static hydrate method. Fetches and assembles all child entities.
 *
 * @param {string} id - 
 * @returns {Promise<PerformedExerciseLogModel | undefined>} Promise resolving to PerformedExerciseLogModel if found, undefined otherwise
 */
async findById(id: string): Promise<PerformedExerciseLogModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple performed exercises by their IDs and hydrates them into PerformedExerciseLogModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<PerformedExerciseLogModel[]>} Promise resolving to array of PerformedExerciseLogModels
 */
async findByIds(ids: string[]): Promise<PerformedExerciseLogModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all performed exercises for a profile ID and hydrates them into PerformedExerciseLogModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<PerformedExerciseLogModel[]>} Promise resolving to array of PerformedExerciseLogModels
 */
async findAll(profileId: string): Promise<PerformedExerciseLogModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a performed exercise by ID from the database, along with all its child entities.
 *
 * @param {string} id - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string, inTransaction: boolean = false): Promise<void>
```

---

## File: `src/features/workout/data/PerformedGroupRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/PerformedGroupRepository.ts`

### class `PerformedGroupRepository`

**Description:**
Concrete implementation of IPerformedGroupRepository using WatermelonDB. Handles persistence and retrieval of PerformedGroup domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject. Self-assembles the full aggregate by injecting child repository interfaces.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new PerformedGroupRepository instance.
 *
 * @param {IPerformedExerciseRepository} performedExerciseRepo - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('IPerformedExerciseRepository')
    private performedExerciseRepo: IPerformedExerciseRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  )
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a PerformedGroupLogModel to the database by converting it to plain data using the model's toPlainObject method. Also persists all child entities (performed exercises) in an atomic transaction.
 *
 * @param {PerformedGroupLogModel} group - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<PerformedGroupLogModel>} Promise resolving to the saved PerformedGroupLogModel
 */
async save(
    group: PerformedGroupLogModel,
    inTransaction: boolean = false
  ): Promise<PerformedGroupLogModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a performed group by ID and hydrates it into a PerformedGroupLogModel using the model's static hydrate method. Fetches and assembles all child entities.
 *
 * @param {string} id - 
 * @returns {Promise<PerformedGroupLogModel | undefined>} Promise resolving to PerformedGroupLogModel if found, undefined otherwise
 */
async findById(id: string): Promise<PerformedGroupLogModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple performed groups by their IDs and hydrates them into PerformedGroupLogModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<PerformedGroupLogModel[]>} Promise resolving to array of PerformedGroupLogModels
 */
async findByIds(ids: string[]): Promise<PerformedGroupLogModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all performed groups for a profile ID and hydrates them into PerformedGroupLogModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<PerformedGroupLogModel[]>} Promise resolving to array of PerformedGroupLogModels
 */
async findAll(profileId: string): Promise<PerformedGroupLogModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a performed group by ID from the database, along with all its child entities.
 *
 * @param {string} id - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string, inTransaction: boolean = false): Promise<void>
```

---

## File: `src/features/workout/data/PerformedSetRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/PerformedSetRepository.ts`

### class `PerformedSetRepository`

**Description:**
Concrete implementation of IPerformedSetRepository using WatermelonDB. Handles persistence and retrieval of PerformedSet domain models by delegating hydration to the model's static hydrate method and dehydration to toPlainObject.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new PerformedSetRepository instance.
 *
 * @param {ExtendedDatabase} database - 
 */
constructor(@inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db)
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a PerformedSetModel to the database by converting it to plain data using the model's toPlainObject method, then returns the saved model.
 *
 * @param {PerformedSetModel} set - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<PerformedSetModel>} Promise resolving to the saved PerformedSetModel
 */
async save(set: PerformedSetModel, inTransaction: boolean = false): Promise<PerformedSetModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a performed set by ID and hydrates it into a PerformedSetModel using the model's static hydrate method.
 *
 * @param {string} id - 
 * @returns {Promise<PerformedSetModel | undefined>} Promise resolving to PerformedSetModel if found, undefined otherwise
 */
async findById(id: string): Promise<PerformedSetModel | undefined>
```

##### `findByIds()`

```typescript
/**
 * Retrieves multiple performed sets by their IDs and hydrates them into PerformedSetModels using the model's static hydrate method.
 *
 * @param {string[]} ids - 
 * @returns {Promise<PerformedSetModel[]>} Promise resolving to array of PerformedSetModels
 */
async findByIds(ids: string[]): Promise<PerformedSetModel[]>
```

##### `findAll()`

```typescript
/**
 * Retrieves all performed sets for a profile ID and hydrates them into PerformedSetModels using the model's static hydrate method.
 *
 * @param {string} profileId - 
 * @returns {Promise<PerformedSetModel[]>} Promise resolving to array of PerformedSetModels
 */
async findAll(profileId: string): Promise<PerformedSetModel[]>
```

##### `delete()`

```typescript
/**
 * Deletes a performed set by ID from the database.
 *
 * @param {string} id - 
 * @param {boolean} inTransaction - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string, inTransaction: boolean = false): Promise<void>
```

---

## File: `src/features/workout/data/WatermelonWorkoutStatePersistence.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/WatermelonWorkoutStatePersistence.ts`

### class `WatermelonWorkoutStatePersistence`

**Description:**
WatermelonDB-based implementation of workout state persistence. Stores and retrieves XState machine state using a simple key-value approach in the workoutStates table.

#### Public Instance Methods

##### `saveState()`

```typescript
/**
 * Saves the serialized state of the workout machine for a specific profile. Uses an upsert strategy - creates new record if none exists, updates if found.
 *
 * @param {string} profileId - 
 * @param {string} state - 
 * @returns {Promise<void>} Returns Promise<void>
 */
async saveState(profileId: string, state: string): Promise<void>
```

##### `loadState()`

```typescript
/**
 * Loads the serialized state of the workout machine for a specific profile. Returns null if no state is found for the given profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<string | null>} Returns Promise<string | null>
 */
async loadState(profileId: string): Promise<string | null>
```

##### `clearState()`

```typescript
/**
 * Clears the saved state for a specific profile by deleting the record. No-op if no state exists for the given profile.
 *
 * @param {string} profileId - 
 * @returns {Promise<void>} Returns Promise<void>
 */
async clearState(profileId: string): Promise<void>
```

---

## File: `src/features/workout/data/WorkoutLogRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/WorkoutLogRepository.ts`

### class `WorkoutLogRepository`

**Description:**
Concrete implementation of IWorkoutLogRepository using WatermelonDB. Handles persistence and retrieval of WorkoutLog domain models as aggregate roots. Self-assembles the full aggregate by injecting child repository interfaces and orchestrates the assembly of all child entities (performed groups, exercises, and sets). This repository acts as a pure data mapper, delegating hydration to the model's static hydrate method and dehydration to toPlainObject. All write operations are wrapped in atomic transactions to ensure data integrity.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new WorkoutLogRepository instance.
 *
 * @param {IPerformedGroupRepository} performedGroupRepository - 
 * @param {ExtendedDatabase} database - 
 */
constructor(
    @inject('IPerformedGroupRepository')
    private performedGroupRepository: IPerformedGroupRepository,
    @inject('BlueprintFitnessDB') database: BlueprintFitnessDB = db
  )
```

#### Public Instance Methods

##### `save()`

```typescript
/**
 * Persists a WorkoutLogModel aggregate to the database by dehydrating it to plain data using the model's toPlainObject method. Also persists all child entities (performed groups) in an atomic transaction to maintain consistency across the entire aggregate. The dehydration process extracts the core workout log data and performed group IDs, then delegates the persistence of child groups to the injected performed group repository for deep transactional writes.
 *
 * @param {WorkoutLogModel} log - 
 * @returns {Promise<WorkoutLogModel>} Promise resolving to the saved WorkoutLogModel aggregate
 */
async save(log: WorkoutLogModel): Promise<WorkoutLogModel>
```

##### `findById()`

```typescript
/**
 * Retrieves a workout log by ID and hydrates it into a WorkoutLogModel aggregate using the model's static hydrate method. Orchestrates the assembly of the complete domain model by fetching all child entities through injected child repositories. The internal assembly process fetches the top-level workout log data, then uses eager loading to fetch all descendant records (performed groups -> exercises -> sets) for full hydration of the domain model.
 *
 * @param {string} id - 
 * @returns {Promise<WorkoutLogModel | undefined>} Promise resolving to WorkoutLogModel if found, undefined otherwise
 */
async findById(id: string): Promise<WorkoutLogModel | undefined>
```

##### `findAll()`

```typescript
/**
 * Retrieves workout logs for a profile with optional filtering and hydrates them into WorkoutLogModel aggregates using the model's static hydrate method. Orchestrates the assembly of multiple complete domain models by batch-fetching child entities through injected repositories for optimal performance. The internal assembly process applies date range filters, batch-fetches all required performed groups with eager loading, and efficiently maps them back to their parent workout logs.
 *
 * @param {string} profileId - 
 * @param {{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined} filters - 
 * @returns {Promise<WorkoutLogModel[]>} Promise resolving to array of WorkoutLogModel aggregates
 */
async findAll(
    profileId: string,
    filters?:
```

##### `findLastBySessionId()`

```typescript
/**
 * Retrieves the most recent workout log for a specific session and profile, hydrated into a WorkoutLogModel aggregate. Useful for tracking workout progression and loading previous performance data for a specific session. The internal assembly process queries for the most recent log by session ID, fetches its performed groups with eager loading, and constructs the complete aggregate.
 *
 * @param {string} profileId - 
 * @param {string} sessionId - 
 * @returns {Promise<WorkoutLogModel | undefined>} Promise resolving to the most recent WorkoutLogModel if found, undefined otherwise
 */
async findLastBySessionId(
    profileId: string,
    sessionId: string
  ): Promise<WorkoutLogModel | undefined>
```

##### `delete()`

```typescript
/**
 * Deletes a workout log by ID from the database along with all its child entities in an atomic transaction. Ensures cascade deletion of all performed groups and their hierarchies through the injected child repositories.
 *
 * @param {string} id - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 */
async delete(id: string): Promise<void>
```

---

## File: `src/features/workout/domain/index.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/IPerformedExerciseRepository.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/IPerformedGroupRepository.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/IPerformedSetRepository.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/IWorkoutLogRepository.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/IWorkoutStatePersistence.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/PerformedExerciseLogModel.ts`

### class `PerformedExerciseLogModel`

**Description:**
A domain model representing a performed exercise log in a workout. Contains sets, performance metrics, and comparison data.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; exerciseId: string; setIds: string[]; isSkipped: boolean; exerciseName: string; exerciseCategory: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; plannedExerciseId?: string | undefined; notes?: string | undefined; totalSets?: number | undefined; totalCounts?: number | undefined; totalVolume?: number | undefined; repCategoryDistribution?: Record<"strength" | "hypertrophy" | "endurance", number> | undefined; comparisonTrend?: "maintenance" | "improvement" | "deterioration" | "stagnation" | undefined; comparisonSetsChange?: number | undefined; comparisonCountsChange?: number | undefined; comparisonVolumeChange?: number | undefined; comparisonVolume?: number | undefined; comparisonAvgWeight?: number | undefined; comparisonMaxWeight?: number | undefined; comparisonTotalReps?: number | undefined; rpeEffort?: "optimal" | "poor" | "excessive" | undefined; estimated1RM?: number | undefined; }} props - 
 * @param {PerformedSetModel[]} sets - 
 */
protected constructor(props: PerformedExerciseLogData, sets: PerformedSetModel[])
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `exerciseId: string`

##### `plannedExerciseId: string | undefined`

##### `sets: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/domain/PerformedSetModel").PerformedSetModel[]`

##### `notes: string | undefined`

##### `isSkipped: boolean`

##### `exerciseName: string`

##### `exerciseCategory: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"`

##### `muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>`

##### `totalSets: number | undefined`

##### `totalCounts: number | undefined`

##### `totalVolume: number | undefined`

##### `repCategoryDistribution: Record<"strength" | "hypertrophy" | "endurance", number> | undefined`

##### `comparisonTrend: "maintenance" | "improvement" | "deterioration" | "stagnation" | undefined`

##### `comparisonSetsChange: number | undefined`

##### `comparisonCountsChange: number | undefined`

##### `comparisonVolumeChange: number | undefined`

##### `comparisonVolume: number | undefined`

##### `comparisonAvgWeight: number | undefined`

##### `comparisonMaxWeight: number | undefined`

##### `comparisonTotalReps: number | undefined`

##### `rpeEffort: "optimal" | "poor" | "excessive" | undefined`

##### `estimated1RM: number | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new PerformedExerciseLogModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; exerciseId: string; setIds: string[]; isSkipped: boolean; exerciseName: string; exerciseCategory: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; plannedExerciseId?: string | undefined; notes?: string | undefined; totalSets?: number | undefined; totalCounts?: number | undefined; totalVolume?: number | undefined; repCategoryDistribution?: Record<"strength" | "hypertrophy" | "endurance", number> | undefined; comparisonTrend?: "maintenance" | "improvement" | "deterioration" | "stagnation" | undefined; comparisonSetsChange?: number | undefined; comparisonCountsChange?: number | undefined; comparisonVolumeChange?: number | undefined; comparisonVolume?: number | undefined; comparisonAvgWeight?: number | undefined; comparisonMaxWeight?: number | undefined; comparisonTotalReps?: number | undefined; rpeEffort?: "optimal" | "poor" | "excessive" | undefined; estimated1RM?: number | undefined; }} props - 
 * @param {PerformedSetModel[]} sets - 
 * @returns {PerformedExerciseLogModel} A new PerformedExerciseLogModel instance
 */
public static hydrate(
    props: PerformedExerciseLogData,
    sets: PerformedSetModel[]
  ): PerformedExerciseLogModel
```

#### Public Instance Methods

##### `getTotalVolume()`

```typescript
/**
 * Calculates the total volume for all completed sets.
 *
 * @returns {number} The total volume (weight × reps) for all completed sets
 */
getTotalVolume(): number
```

##### `getTotalCounts()`

```typescript
/**
 * Calculates the total rep count for all completed sets.
 *
 * @returns {number} The total number of repetitions performed
 */
getTotalCounts(): number
```

##### `getTotalSets()`

```typescript
/**
 * Gets the total number of completed sets.
 *
 * @returns {number} The count of completed sets
 */
getTotalSets(): number
```

##### `getPlannedSetsCount()`

```typescript
/**
 * Gets the total number of planned sets for this exercise.
 *
 * @returns {number} The total count of all sets (completed and planned)
 */
getPlannedSetsCount(): number
```

##### `getPlannedCountsTotal()`

```typescript
/**
 * Gets the total number of planned repetitions for this exercise.
 *
 * @returns {number} The total planned rep count across all sets
 */
getPlannedCountsTotal(): number
```

##### `getAverageWeight()`

```typescript
/**
 * Calculates the average weight across all completed sets.
 *
 * @returns {number} The average weight used across completed sets
 */
getAverageWeight(): number
```

##### `getAverageRPE()`

```typescript
/**
 * Calculates the average RPE across all completed sets with RPE data.
 *
 * @returns {number} The average RPE across completed sets
 */
getAverageRPE(): number
```

##### `getLastRPE()`

```typescript
/**
 * Gets the RPE of the last completed set with RPE data.
 *
 * @returns {number} The RPE of the last set, or 0 if no sets have RPE
 */
getLastRPE(): number
```

##### `getHeaviestSet()`

```typescript
/**
 * Finds the set with the highest weight.
 *
 * @returns {PerformedSetModel | undefined} The heaviest completed set, or undefined if no sets are completed
 */
getHeaviestSet(): PerformedSetModel | undefined
```

##### `getEffectiveSetsCount()`

```typescript
/**
 * Counts sets above a minimum RPE threshold (considered "effective").
 *
 * @param {number} minRPE - 
 * @returns {number} The number of sets with RPE above the threshold
 */
getEffectiveSetsCount(minRPE: number): number
```

##### `getRepCategoryDistribution()`

```typescript
/**
 * Analyzes the distribution of sets across rep range categories.
 *
 * @returns {Record<"strength" | "hypertrophy" | "endurance", number>} An object with counts for each rep range category
 */
getRepCategoryDistribution(): Record<RepRangeCategory, number>
```

##### `getVolumeByMuscleGroup()`

```typescript
/**
 * Calculates volume distribution across muscle groups.
 *
 * @returns {Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>} An object with volume per muscle group based on activation percentages
 */
getVolumeByMuscleGroup(): Record<MuscleGroup, number>
```

##### `cloneWithCalculatedProgression()`

```typescript
/**
 * Creates a new exercise log with calculated progression compared to a previous session.
 *
 * @param {PerformedExerciseLogModel} previousLog - 
 * @returns {PerformedExerciseLogModel} A new PerformedExerciseLogModel instance with updated comparison data
 */
cloneWithCalculatedProgression(
    previousLog: PerformedExerciseLogModel
  ): PerformedExerciseLogModel
```

##### `getPerformanceTrend()`

```typescript
/**
 * Analyzes performance trend compared to a previous session.
 *
 * @param {PerformedExerciseLogModel} previousLog - 
 * @returns {ComparisonTrend} The performance trend classification
 */
getPerformanceTrend(previousLog: PerformedExerciseLogModel): ComparisonTrend
```

##### `cloneWithUpdatedSet()`

```typescript
/**
 * Creates a new exercise log with an updated set.
 *
 * @param {PerformedSetModel} updatedSet - 
 * @returns {PerformedExerciseLogModel} A new PerformedExerciseLogModel instance with the updated set
 */
cloneWithUpdatedSet(updatedSet: PerformedSetModel): PerformedExerciseLogModel
```

##### `cloneWithAddedSet()`

```typescript
/**
 * Creates a new exercise log with an added set.
 *
 * @param {PerformedSetModel} newSet - 
 * @returns {PerformedExerciseLogModel} A new PerformedExerciseLogModel instance with the added set
 */
cloneWithAddedSet(newSet: PerformedSetModel): PerformedExerciseLogModel
```

##### `cloneWithToggledSkip()`

```typescript
/**
 * Creates a new exercise log with toggled skip status.
 *
 * @returns {PerformedExerciseLogModel} A new PerformedExerciseLogModel instance with inverted skip status
 */
cloneWithToggledSkip(): PerformedExerciseLogModel
```

##### `getSummaryString()`

```typescript
/**
 * Generates a human-readable summary of the exercise performance.
 *
 * @returns {string} A formatted string describing the exercise performance
 */
getSummaryString(): string
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this PerformedExerciseLogModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; exerciseId: string; setIds: string[]; isSkipped: boolean; exerciseName: string; exerciseCategory: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; plannedExerciseId?: string | undefined; notes?: string | undefined; totalSets?: number | undefined; totalCounts?: number | undefined; totalVolume?: number | undefined; repCategoryDistribution?: Record<"strength" | "hypertrophy" | "endurance", number> | undefined; comparisonTrend?: "maintenance" | "improvement" | "deterioration" | "stagnation" | undefined; comparisonSetsChange?: number | undefined; comparisonCountsChange?: number | undefined; comparisonVolumeChange?: number | undefined; comparisonVolume?: number | undefined; comparisonAvgWeight?: number | undefined; comparisonMaxWeight?: number | undefined; comparisonTotalReps?: number | undefined; rpeEffort?: "optimal" | "poor" | "excessive" | undefined; estimated1RM?: number | undefined; }} The plain PerformedExerciseLogData object
 */
toPlainObject(): PerformedExerciseLogData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; exerciseId: string; setIds: string[]; isSkipped: boolean; exerciseName: string; exerciseCategory: "strength" | "cardio" | "stretching" | "hypertrophy" | "mobility" | "other"; muscleActivation: Record<"chest" | "lats" | "upper_back" | "lower_back" | "shoulders" | "biceps" | "triceps" | "forearms" | "quadriceps" | "hamstrings" | "calves" | "abdominals" | "glutes", number>; plannedExerciseId?: string | undefined; notes?: string | undefined; totalSets?: number | undefined; totalCounts?: number | undefined; totalVolume?: number | undefined; repCategoryDistribution?: Record<"strength" | "hypertrophy" | "endurance", number> | undefined; comparisonTrend?: "maintenance" | "improvement" | "deterioration" | "stagnation" | undefined; comparisonSetsChange?: number | undefined; comparisonCountsChange?: number | undefined; comparisonVolumeChange?: number | undefined; comparisonVolume?: number | undefined; comparisonAvgWeight?: number | undefined; comparisonMaxWeight?: number | undefined; comparisonTotalReps?: number | undefined; rpeEffort?: "optimal" | "poor" | "excessive" | undefined; estimated1RM?: number | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/workout/domain/PerformedGroupLogModel.ts`

### class `PerformedGroupLogModel`

**Description:**
A domain model representing a performed group of exercises in a workout log. Groups exercises that were executed together (e.g., supersets, circuits).

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; type: "stretching" | "single" | "superset" | "circuit" | "emom" | "amrap" | "warmup"; performedExerciseLogIds: string[]; plannedGroupId?: string | undefined; actualRestSeconds?: number | undefined; }} props - 
 * @param {PerformedExerciseLogModel[]} exercises - 
 */
protected constructor(props: PerformedGroupData, exercises: PerformedExerciseLogModel[])
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `plannedGroupId: string | undefined`

##### `type: "stretching" | "single" | "superset" | "circuit" | "emom" | "amrap" | "warmup"`

##### `performedExercises: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/domain/PerformedExerciseLogModel").PerformedExerciseLogModel[]`

##### `actualRestSeconds: number | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new PerformedGroupLogModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; type: "stretching" | "single" | "superset" | "circuit" | "emom" | "amrap" | "warmup"; performedExerciseLogIds: string[]; plannedGroupId?: string | undefined; actualRestSeconds?: number | undefined; }} props - 
 * @param {PerformedExerciseLogModel[]} exercises - 
 * @returns {PerformedGroupLogModel} A new PerformedGroupLogModel instance
 */
public static hydrate(
    props: PerformedGroupData,
    exercises: PerformedExerciseLogModel[]
  ): PerformedGroupLogModel
```

#### Public Instance Methods

##### `getTotalVolume()`

```typescript
/**
 * Calculates the total volume for all exercises in this group.
 *
 * @returns {number} The combined volume of all exercises in the group
 */
getTotalVolume(): number
```

##### `getTotalSets()`

```typescript
/**
 * Calculates the total number of sets across all exercises in this group.
 *
 * @returns {number} The total set count for the group
 */
getTotalSets(): number
```

##### `getTotalCounts()`

```typescript
/**
 * Calculates the total repetition count across all exercises in this group.
 *
 * @returns {number} The total rep count for the group
 */
getTotalCounts(): number
```

##### `getPlannedSetsCount()`

```typescript
/**
 * Calculates the total number of planned sets across all exercises in this group.
 *
 * @returns {number} The total planned set count for the group
 */
getPlannedSetsCount(): number
```

##### `getPlannedCountsTotal()`

```typescript
/**
 * Calculates the total planned repetition count across all exercises in this group.
 *
 * @returns {number} The total planned rep count for the group
 */
getPlannedCountsTotal(): number
```

##### `getAverageRPE()`

```typescript
/**
 * Gets the average RPE across all exercises in this group.
 *
 * @returns {number} The average RPE for the group, or 0 if no RPE data exists
 */
getAverageRPE(): number
```

##### `findExerciseById()`

```typescript
/**
 * Finds an exercise within this group by its exercise ID.
 *
 * @param {string} exerciseId - 
 * @returns {PerformedExerciseLogModel | undefined} The performed exercise log or undefined if not found
 */
findExerciseById(exerciseId: string): PerformedExerciseLogModel | undefined
```

##### `isCompletelySkipped()`

```typescript
/**
 * Checks if all exercises in the group were skipped.
 *
 * @returns {boolean} True if all exercises in the group are marked as skipped
 */
isCompletelySkipped(): boolean
```

##### `getCompletedExerciseCount()`

```typescript
/**
 * Gets the number of exercises that were actually performed (not skipped).
 *
 * @returns {number} The count of non-skipped exercises
 */
getCompletedExerciseCount(): number
```

##### `cloneWithUpdatedRest()`

```typescript
/**
 * Creates a new group log with updated rest time.
 *
 * @param {number} restSeconds - 
 * @returns {PerformedGroupLogModel} A new PerformedGroupLogModel instance with updated rest time
 */
cloneWithUpdatedRest(restSeconds: number): PerformedGroupLogModel
```

##### `cloneWithUpdatedExercise()`

```typescript
/**
 * Creates a new group log with an updated exercise.
 *
 * @param {PerformedExerciseLogModel} updatedExercise - 
 * @returns {PerformedGroupLogModel} A new PerformedGroupLogModel instance with the updated exercise
 */
cloneWithUpdatedExercise(updatedExercise: PerformedExerciseLogModel): PerformedGroupLogModel
```

##### `getSummaryString()`

```typescript
/**
 * Generates a human-readable summary of the group performance.
 *
 * @returns {string} A formatted string describing the group performance
 */
getSummaryString(): string
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this PerformedGroupLogModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; type: "stretching" | "single" | "superset" | "circuit" | "emom" | "amrap" | "warmup"; performedExerciseLogIds: string[]; plannedGroupId?: string | undefined; actualRestSeconds?: number | undefined; }} The plain PerformedGroupData object
 */
toPlainObject(): PerformedGroupData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; type: "stretching" | "single" | "superset" | "circuit" | "emom" | "amrap" | "warmup"; performedExerciseLogIds: string[]; plannedGroupId?: string | undefined; actualRestSeconds?: number | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/workout/domain/PerformedSetModel.ts`

### class `PerformedSetModel`

**Description:**
A domain model representing a performed set in a workout log. Contains set data, completion status, and performance metrics.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} props - 
 */
protected constructor(props: PerformedSetData)
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `counterType: "reps" | "mins" | "secs"`

##### `counts: number`

##### `weight: number | undefined`

##### `completed: boolean`

##### `notes: string | undefined`

##### `rpe: number | undefined`

##### `percentage: number | undefined`

##### `plannedLoad: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

##### `plannedRpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

##### `plannedCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new PerformedSetModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} props - 
 * @returns {PerformedSetModel} A new PerformedSetModel instance
 */
public static hydrate(props: PerformedSetData): PerformedSetModel
```

#### Public Instance Methods

##### `getRepRangeCategory()`

```typescript
/**
 * Classifies the set's repetition count into a strength category.
 *
 * @returns {"strength" | "hypertrophy" | "endurance"} The rep range category (strength, hypertrophy, endurance)
 */
getRepRangeCategory(): RepRangeCategory
```

##### `isCompleted()`

```typescript
/**
 * Checks if the set was completed.
 *
 * @returns {boolean} True if the set was marked as completed
 */
isCompleted(): boolean
```

##### `getCountsDeviation()`

```typescript
/**
 * Calculates deviation from planned rep count.
 *
 * @returns {number} The difference between actual and planned minimum counts
 */
getCountsDeviation(): number
```

##### `getLoadDeviation()`

```typescript
/**
 * Calculates deviation from planned load.
 *
 * @returns {number} The difference between actual and planned minimum load
 */
getLoadDeviation(): number
```

##### `getRPEEffort()`

```typescript
/**
 * Evaluates RPE effort level based on performance.
 *
 * @returns {RpeEffort} The RPE effort classification
 */
getRPEEffort(): RpeEffort
```

##### `cloneWithUpdates()`

```typescript
/**
 * Creates a new set instance with updated data.
 *
 * @param {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>} newData - 
 * @returns {PerformedSetModel} A new PerformedSetModel instance with updated data
 */
cloneWithUpdates(newData: Partial<PerformedSetData>): PerformedSetModel
```

##### `cloneWithToggledCompletion()`

```typescript
/**
 * Creates a new set instance with toggled completion status.
 *
 * @returns {PerformedSetModel} A new PerformedSetModel instance with inverted completion status
 */
cloneWithToggledCompletion(): PerformedSetModel
```

##### `getSummaryString()`

```typescript
/**
 * Generates a human-readable summary of the set.
 *
 * @returns {string} A formatted string describing the set performance
 */
getSummaryString(): string
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this PerformedSetModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} The plain PerformedSetData object
 */
toPlainObject(): PerformedSetData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/workout/domain/WorkoutLogModel.ts`

### class `WorkoutLogModel`

**Description:**
A domain model representing a complete workout log aggregate root. Contains all performed groups, exercises, and sets with performance analytics.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ id: string; profileId: string; trainingPlanName: string; sessionName: string; performedGroupIds: string[]; startTime: Date; createdAt: Date; updatedAt: Date; trainingPlanId?: string | undefined; sessionId?: string | undefined; endTime?: Date | undefined; durationSeconds?: number | undefined; totalVolume?: number | undefined; notes?: string | undefined; userRating?: number | undefined; }} props - 
 * @param {PerformedGroupLogModel[]} groups - 
 */
protected constructor(props: WorkoutLogData, groups: PerformedGroupLogModel[])
```

#### Public Properties

##### `[immerable]: boolean`

##### `profileId: string`

##### `trainingPlanId: string | undefined`

##### `trainingPlanName: string`

##### `sessionId: string | undefined`

##### `sessionName: string`

##### `performedGroups: import("/home/giulio/Scrivania/BUEPRINT FITNESS/APP/src/features/workout/domain/PerformedGroupLogModel").PerformedGroupLogModel[]`

##### `startTime: Date`

##### `endTime: Date | undefined`

##### `durationSeconds: number | undefined`

##### `totalVolume: number | undefined`

##### `notes: string | undefined`

##### `userRating: number | undefined`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Creates a new WorkoutLogModel instance from plain data.
 *
 * @param {{ id: string; profileId: string; trainingPlanName: string; sessionName: string; performedGroupIds: string[]; startTime: Date; createdAt: Date; updatedAt: Date; trainingPlanId?: string | undefined; sessionId?: string | undefined; endTime?: Date | undefined; durationSeconds?: number | undefined; totalVolume?: number | undefined; notes?: string | undefined; userRating?: number | undefined; }} props - 
 * @param {PerformedGroupLogModel[]} groups - 
 * @returns {WorkoutLogModel} A new WorkoutLogModel instance
 */
public static hydrate(props: WorkoutLogData, groups: PerformedGroupLogModel[]): WorkoutLogModel
```

#### Public Instance Methods

##### `getAllSets()`

```typescript
/**
 * Gets all performed sets from all exercises in the workout.
 *
 * @returns {PerformedSetModel[]} A flat array of all performed sets in the workout
 */
getAllSets(): PerformedSetModel[]
```

##### `getAllExercises()`

```typescript
/**
 * Gets all performed exercises from all groups in the workout.
 *
 * @returns {PerformedExerciseLogModel[]} A flat array of all performed exercises in the workout
 */
getAllExercises(): PerformedExerciseLogModel[]
```

##### `getDurationInMinutes()`

```typescript
/**
 * Calculates the workout duration in minutes.
 *
 * @returns {number | undefined} The duration in minutes, or undefined if workout is not finished
 */
getDurationInMinutes(): number | undefined
```

##### `getPersonalBests()`

```typescript
/**
 * Finds personal bests achieved during this workout session.
 *
 * @returns {Map<string, PerformedSetModel>} A map of exercise IDs to their heaviest sets in this workout
 */
getPersonalBests(): Map<string, PerformedSetModel>
```

##### `cloneWithUpdatedSet()`

```typescript
/**
 * Creates a new workout log with an updated set across all exercises.
 *
 * @param {PerformedSetModel} updatedSet - 
 * @returns {WorkoutLogModel} A new WorkoutLogModel instance with the updated set
 */
cloneWithUpdatedSet(updatedSet: PerformedSetModel): WorkoutLogModel
```

##### `calculateTotalVolume()`

```typescript
/**
 * Calculates the total volume for the entire workout.
 *
 * @returns {number} The total volume (weight × reps) for all exercises
 */
calculateTotalVolume(): number
```

##### `getTotalSets()`

```typescript
/**
 * Calculates the total number of sets performed in the workout.
 *
 * @returns {number} The total set count across all exercises
 */
getTotalSets(): number
```

##### `getTotalCounts()`

```typescript
/**
 * Calculates the total number of repetitions performed in the workout.
 *
 * @returns {number} The total rep count across all exercises
 */
getTotalCounts(): number
```

##### `getPlannedSetsCount()`

```typescript
/**
 * Calculates the total number of planned sets in the workout.
 *
 * @returns {number} The total planned set count across all exercises
 */
getPlannedSetsCount(): number
```

##### `getPlannedCountsTotal()`

```typescript
/**
 * Calculates the total number of planned repetitions in the workout.
 *
 * @returns {number} The total planned rep count across all exercises
 */
getPlannedCountsTotal(): number
```

##### `getAverageRPE()`

```typescript
/**
 * Calculates the average RPE across all completed sets with RPE data.
 *
 * @returns {number | undefined} The average RPE for the workout, or undefined if no RPE data exists
 */
getAverageRPE(): number | undefined
```

##### `getAverageLastRPE()`

```typescript
/**
 * Calculates the average of the last RPE from each exercise.
 *
 * @returns {number | undefined} The average last RPE across exercises, or undefined if no RPE data
 */
getAverageLastRPE(): number | undefined
```

##### `getSetCountByRepRange()`

```typescript
/**
 * Analyzes the distribution of completed sets across rep range categories.
 *
 * @returns {Record<"strength" | "hypertrophy" | "endurance", number>} An object with counts for each rep range category
 */
getSetCountByRepRange(): Record<RepRangeCategory, number>
```

##### `findExerciseLog()`

```typescript
/**
 * Finds a specific exercise log by exercise ID.
 *
 * @param {string} exerciseId - 
 * @returns {PerformedExerciseLogModel | undefined} The performed exercise log or undefined if not found
 */
findExerciseLog(exerciseId: string): PerformedExerciseLogModel | undefined
```

##### `getPerformanceScore()`

```typescript
/**
 * Calculates a performance score for the workout.
 *
 * @returns {number} A performance score based on volume, RPE, and completion
 */
getPerformanceScore(): number
```

##### `getSetQualityMetrics()`

```typescript
/**
 * Analyzes set quality metrics for workout assessment.
 *
 * @returns {{ highEffortSets: number; junkVolumeSets: number; }} An object with high effort and junk volume set counts
 */
getSetQualityMetrics():
```

##### `cloneAsEnded()`

```typescript
/**
 * Creates a new workout log marked as ended with calculated totals.
 *
 * @returns {WorkoutLogModel} A new WorkoutLogModel instance with end time and calculated metrics
 */
cloneAsEnded(): WorkoutLogModel
```

##### `cloneWithUpdatedMetadata()`

```typescript
/**
 * Creates a new workout log with updated metadata.
 *
 * @param {{ notes?: string | undefined; userRating?: number | undefined; }} details - 
 * @returns {WorkoutLogModel} A new WorkoutLogModel instance with updated metadata
 */
cloneWithUpdatedMetadata(details:
```

##### `isInProgress()`

```typescript
/**
 * Checks if the workout is currently in progress.
 *
 * @returns {boolean} True if the workout has started but not ended
 */
isInProgress(): boolean
```

##### `isCompleted()`

```typescript
/**
 * Checks if the workout has been completed.
 *
 * @returns {boolean} True if the workout has an end time
 */
isCompleted(): boolean
```

##### `getDisplayName()`

```typescript
/**
 * Gets the workout display name combining plan and session names.
 *
 * @returns {string} A formatted display name for the workout
 */
getDisplayName(): string
```

##### `clone()`

```typescript
/**
 * Creates a deep, structurally-shared clone of the model instance.
 *
 * @returns {this} A cloned instance of this WorkoutLogModel
 */
clone(): this
```

##### `toPlainObject()`

```typescript
/**
 * Converts the rich domain model back into a plain, serializable object.
 *
 * @returns {{ id: string; profileId: string; trainingPlanName: string; sessionName: string; performedGroupIds: string[]; startTime: Date; createdAt: Date; updatedAt: Date; trainingPlanId?: string | undefined; sessionId?: string | undefined; endTime?: Date | undefined; durationSeconds?: number | undefined; totalVolume?: number | undefined; notes?: string | undefined; userRating?: number | undefined; }} The plain WorkoutLogData object
 */
toPlainObject(): WorkoutLogData
```

##### `validate()`

```typescript
/**
 * Validates the model's data against its corresponding Zod schema.
 *
 * @returns {ZodSafeParseResult<{ id: string; profileId: string; trainingPlanName: string; sessionName: string; performedGroupIds: string[]; startTime: Date; createdAt: Date; updatedAt: Date; trainingPlanId?: string | undefined; sessionId?: string | undefined; endTime?: Date | undefined; durationSeconds?: number | undefined; totalVolume?: number | undefined; notes?: string | undefined; userRating?: number | undefined; }>} Validation result with success status and potential errors
 */
validate()
```

---

## File: `src/features/workout/hooks/index.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useDeleteWorkout.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useEndWorkout.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useGetLastWorkoutSummary.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useGetWorkoutHistory.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useGetWorkoutLog.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useGetWorkoutLogs.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useInfiniteWorkoutHistory.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useQuickActions.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useRestTimer.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useStartWorkoutFromPlan.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useUpdateWorkoutMetadata.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutBackup.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutCalendar.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutFormState.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutHistory.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutInitializationData.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutProgress.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/useWorkoutTimer.ts`

_No exported classes found in this file._

## File: `src/features/workout/machines/index.ts`

_No exported classes found in this file._

## File: `src/features/workout/machines/workoutMachine.ts`

_No exported classes found in this file._

## File: `src/features/workout/machines/WorkoutProvider.tsx`

_No exported classes found in this file._

## File: `src/features/workout/query-services/index.ts`

_No exported classes found in this file._

## File: `src/features/workout/query-services/WorkoutQueryService.ts`

### class `WorkoutQueryService`

**Description:**
Query service that acts as an adapter between the Application Layer and React Query. This service handles the unwrapping of Result objects returned by the WorkoutService, allowing React Query hooks to use standard promise-based error handling. It provides methods for all workout-related data operations that components need through hooks. The service throws errors on failure instead of returning Result objects, which integrates seamlessly with React Query's error handling mechanisms.

#### Constructor

##### Constructor

```typescript
/**
 * @param {WorkoutService} workoutService - 
 */
constructor(@inject('WorkoutService') private readonly workoutService: WorkoutService)
```

#### Public Instance Methods

##### `startWorkoutFromPlan()`

```typescript
/**
 * Starts a new workout from a planned session.
 *
 * @param {string} profileId - 
 * @param {string} sessionId - 
 * @param {string | undefined} trainingPlanId - 
 * @param {string | undefined} trainingPlanName - 
 * @returns {Promise<WorkoutLogModel>} Promise resolving to the created WorkoutLogModel
 * @throws When the operation fails
 */
async startWorkoutFromPlan(
    profileId: string,
    sessionId: string,
    trainingPlanId?: string,
    trainingPlanName?: string
  ): Promise<WorkoutLogModel>
```

##### `getWorkoutLog()`

```typescript
/**
 * Retrieves a workout log by its unique identifier.
 *
 * @param {string} workoutLogId - 
 * @returns {Promise<WorkoutLogModel>} Promise resolving to the WorkoutLogModel
 * @throws When the operation fails
 */
async getWorkoutLog(workoutLogId: string): Promise<WorkoutLogModel>
```

##### `getWorkoutLogQuery()`

```typescript
/**
 * Gets a WatermelonDB query for a specific workout log by ID.
 *
 * @param {string} workoutLogId - 
 * @returns {default<WorkoutLog>} Query for WorkoutLog model for reactive observation
 */
getWorkoutLogQuery(workoutLogId: string): Query<WorkoutLog>
```

##### `getWorkoutLogs()`

```typescript
/**
 * Retrieves all workout logs for a profile with optional filtering.
 *
 * @param {string} profileId - 
 * @param {{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined} filters - 
 * @returns {default<WorkoutLog>} Query for WorkoutLog models for reactive observation
 * @throws When the operation fails
 */
getWorkoutLogs(
    profileId: string,
    filters?:
```

##### `getWorkoutHistory()`

```typescript
/**
 * Retrieves paginated workout history for a profile. Note: This method remains async as it returns complex pagination metadata needed by UI components. For reactive data, use getWorkoutLogs() instead.
 *
 * @param {string} profileId - 
 * @param {number} limit - 
 * @param {number} offset - 
 * @param {{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined} filters - 
 * @returns {Promise<{ logs: WorkoutLogModel[]; hasMore: boolean; total: number; }>} Promise resolving to paginated workout history
 * @throws When the operation fails
 */
async getWorkoutHistory(
    profileId: string,
    limit: number,
    offset: number,
    filters?:
```

##### `getLastWorkoutForSession()`

```typescript
/**
 * Finds the last workout log for a specific session.
 *
 * @param {string} profileId - 
 * @param {string} sessionId - 
 * @returns {Promise<WorkoutLogModel | undefined>} Promise resolving to the WorkoutLogModel or undefined if not found
 * @throws When the operation fails
 */
async getLastWorkoutForSession(
    profileId: string,
    sessionId: string
  ): Promise<WorkoutLogModel | undefined>
```

##### `getLastWorkoutForSessionQuery()`

```typescript
/**
 * Gets a WatermelonDB query for the last workout of a specific session.
 *
 * @param {string} profileId - 
 * @param {string} sessionId - 
 * @returns {default<WorkoutLog>} Query for WorkoutLog models for reactive observation
 */
getLastWorkoutForSessionQuery(profileId: string, sessionId: string): Query<WorkoutLog>
```

##### `endWorkout()`

```typescript
/**
 * Ends a workout by marking it as completed and calculating final metrics.
 *
 * @param {string} workoutLogId - 
 * @returns {Promise<WorkoutLogModel>} Promise resolving to the updated WorkoutLogModel
 * @throws When the operation fails
 */
async endWorkout(workoutLogId: string): Promise<WorkoutLogModel>
```

##### `updateWorkoutMetadata()`

```typescript
/**
 * Updates workout metadata such as notes and user rating.
 *
 * @param {string} workoutLogId - 
 * @param {{ notes?: string | undefined; userRating?: number | undefined; }} metadata - 
 * @returns {Promise<WorkoutLogModel>} Promise resolving to the updated WorkoutLogModel
 * @throws When the operation fails
 */
async updateWorkoutMetadata(
    workoutLogId: string,
    metadata:
```

##### `deleteWorkout()`

```typescript
/**
 * Deletes a workout log permanently.
 *
 * @param {string} workoutLogId - 
 * @returns {Promise<void>} Promise resolving when deletion is complete
 * @throws When the operation fails
 */
async deleteWorkout(workoutLogId: string): Promise<void>
```

---

## File: `src/features/workout/services/index.ts`

_No exported classes found in this file._

## File: `src/features/workout/services/WorkoutService.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/services/WorkoutService.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/services/WorkoutService.ts`

### class `WorkoutService`

**Description:**
Application service responsible for orchestrating workout-related operations. This service acts as a stateless coordinator between the domain layer and persistence layer, handling all use cases related to workout execution and logging.

#### Constructor

##### Constructor

```typescript
/**
 * @param {IWorkoutLogRepository} workoutLogRepository - 
 * @param {IWorkoutSessionRepository} workoutSessionRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IWorkoutSessionRepository') private readonly workoutSessionRepository: IWorkoutSessionRepository,
    @inject('ILogger') private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `startWorkoutFromPlan()`

```typescript
/**
 * Starts a new workout from a planned session, creating an immutable snapshot. Fetches historical data and creates a complete WorkoutLog aggregate for logging. This is the critical workflow for workout execution.
 *
 * @param {string} profileId - 
 * @param {string} sessionId - 
 * @param {string | undefined} trainingPlanId - 
 * @param {string | undefined} trainingPlanName - 
 * @returns {Promise<Result<WorkoutLogModel, ApplicationError>>} A Result containing the created WorkoutLog or an error
 */
async startWorkoutFromPlan(
    profileId: string,
    sessionId: string,
    trainingPlanId?: string,
    trainingPlanName?: string
  ): Promise<Result<WorkoutLogModel, ApplicationError>>
```

##### `getWorkoutLog()`

```typescript
/**
 * Retrieves a workout log by its unique identifier.
 *
 * @param {string} workoutLogId - 
 * @returns {Promise<Result<WorkoutLogModel, ApplicationError>>} A Result containing the WorkoutLogModel or an error
 */
async getWorkoutLog(workoutLogId: string): Promise<Result<WorkoutLogModel, ApplicationError>>
```

##### `getWorkoutLogs()`

```typescript
/**
 * Retrieves all workout logs for a profile with optional filtering.
 *
 * @param {string} profileId - 
 * @param {{ dateRange?: { from: Date; to: Date; } | undefined; } | undefined} filters - 
 * @returns {Promise<Result<WorkoutLogModel[], ApplicationError>>} A Result containing an array of WorkoutLogModels or an error
 */
async getWorkoutLogs(
    profileId: string,
    filters?:
```

##### `getLastWorkoutForSession()`

```typescript
/**
 * Finds the last workout log for a specific session.
 *
 * @param {string} profileId - 
 * @param {string} sessionId - 
 * @returns {Promise<Result<WorkoutLogModel | undefined, ApplicationError>>} A Result containing the WorkoutLogModel or an error
 */
async getLastWorkoutForSession(
    profileId: string,
    sessionId: string
  ): Promise<Result<WorkoutLogModel | undefined, ApplicationError>>
```

##### `endWorkout()`

```typescript
/**
 * Ends a workout by marking it as completed and calculating final metrics.
 *
 * @param {string} workoutLogId - 
 * @returns {Promise<Result<WorkoutLogModel, ApplicationError>>} A Result containing the updated WorkoutLogModel or an error
 */
async endWorkout(workoutLogId: string): Promise<Result<WorkoutLogModel, ApplicationError>>
```

##### `updateWorkoutMetadata()`

```typescript
/**
 * Updates workout metadata such as notes and user rating.
 *
 * @param {string} workoutLogId - 
 * @param {{ notes?: string | undefined; userRating?: number | undefined; }} metadata - 
 * @returns {Promise<Result<WorkoutLogModel, ApplicationError>>} A Result containing the updated WorkoutLogModel or an error
 */
async updateWorkoutMetadata(
    workoutLogId: string,
    metadata:
```

##### `deleteWorkout()`

```typescript
/**
 * Deletes a workout log permanently.
 *
 * @param {string} workoutLogId - 
 * @returns {Promise<Result<void, ApplicationError>>} A Result indicating success or failure
 */
async deleteWorkout(workoutLogId: string): Promise<Result<void, ApplicationError>>
```

---

## File: `src/shared/application/events/index.ts`

_No exported classes found in this file._

## File: `src/shared/domain/events/DataImportCompletedEvent.ts`

### class `DataImportCompletedEvent`

#### Constructor

##### Constructor

```typescript
/**
 * @param {string} profileId - 
 */
constructor(public readonly profileId: string)
```

#### Public Properties

##### `dateTimeOccurred: Date`

#### Public Instance Methods

##### `getAggregateId()`

```typescript
/**
 * @returns {string} Returns string
 */
getAggregateId(): string
```

---

## File: `src/shared/domain/events/DomainEvents.ts`

### class `DomainEvents`

**Description:**
A static class for dispatching and registering domain events. This enables a decoupled, event-driven architecture.

#### Public Static Methods

##### `register()`

```typescript
/**
 * Registers a handler for a specific event.
 *
 * @param {HandlerCallback} callback - 
 * @param {string} eventClassName - 
 */
public static register(callback: HandlerCallback, eventClassName: string): void
```

##### `dispatch()`

```typescript
/**
 * Dispatches an event to all registered handlers.
 *
 * @param {IDomainEvent} event - 
 */
public static dispatch(event: IDomainEvent): void
```

##### `clearHandlers()`

```typescript
/**
 * Clears all registered handlers. Crucial for test isolation.
 *
 */
public static clearHandlers(): void
```

##### `hasSubscription()`

```typescript
/**
 * A helper for integration testing to ensure handlers are registered.
 *
 * @param {string} eventClassName - 
 * @returns {boolean} `true` if at least one handler is subscribed, `false` otherwise.
 */
public static hasSubscription(eventClassName: string): boolean
```

---

## File: `src/shared/domain/events/IDomainEvent.ts`

_No exported classes found in this file._

## File: `src/shared/domain/events/IHandle.ts`

_No exported classes found in this file._

## File: `src/shared/domain/events/index.ts`

_No exported classes found in this file._

## File: `src/shared/domain/events/NewPersonalRecordEvent.ts`

### class `NewPersonalRecordEvent`

#### Constructor

##### Constructor

```typescript
/**
 * @param {MaxLogModel} maxLog - 
 */
constructor(public readonly maxLog: MaxLogModel)
```

#### Public Properties

##### `dateTimeOccurred: Date`

#### Public Instance Methods

##### `getAggregateId()`

```typescript
/**
 * @returns {string} Returns string
 */
getAggregateId(): string
```

---

## File: `src/shared/domain/events/ProfileCreatedEvent.ts`

### class `ProfileCreatedEvent`

#### Constructor

##### Constructor

```typescript
/**
 * @param {ProfileModel} profile - 
 */
constructor(public readonly profile: ProfileModel)
```

#### Public Properties

##### `dateTimeOccurred: Date`

#### Public Instance Methods

##### `getAggregateId()`

```typescript
/**
 * @returns {string} Returns string
 */
getAggregateId(): string
```

---

## File: `src/shared/domain/events/ProfileDeletedEvent.ts`

### class `ProfileDeletedEvent`

#### Constructor

##### Constructor

```typescript
/**
 * @param {string} profileId - 
 */
constructor(public readonly profileId: string)
```

#### Public Properties

##### `dateTimeOccurred: Date`

#### Public Instance Methods

##### `getAggregateId()`

```typescript
/**
 * @returns {string} Returns string
 */
getAggregateId(): string
```

---

## File: `src/shared/domain/events/WorkoutFinishedEvent.ts`

### class `WorkoutFinishedEvent`

#### Constructor

##### Constructor

```typescript
/**
 * @param {WorkoutLogModel} log - 
 */
constructor(public readonly log: WorkoutLogModel)
```

#### Public Properties

##### `dateTimeOccurred: Date`

#### Public Instance Methods

##### `getAggregateId()`

```typescript
/**
 * @returns {string} Returns string
 */
getAggregateId(): string
```

---

## File: `src/shared/domain/value-objects/Counter.ts`

### class `Counter`

**Description:**
Base class for exercise counters (reps, seconds, minutes).

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(public readonly value: number)
```

#### Public Properties

##### `type: "reps" | "mins" | "secs"`

#### Public Static Methods

##### `create()`

```typescript
/**
 * @param {number} value - 
 * @param {"reps" | "mins" | "secs"} type - 
 * @returns {Counter} Returns Counter
 */
public static create(value: number, type: ExerciseCounter): Counter
```

---

### class `RepsCounter`

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(value: number)
```

#### Public Properties

##### `type: "reps"`

---

### class `SecondsCounter`

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(value: number)
```

#### Public Properties

##### `type: "secs"`

---

### class `MinutesCounter`

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(value: number)
```

#### Public Properties

##### `type: "mins"`

---

## File: `src/shared/domain/value-objects/Duration.ts`

### class `Duration`

**Description:**
A Value Object representing a duration of time, stored in seconds.

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} seconds - 
 */
private constructor(private readonly seconds: number)
```

#### Public Static Methods

##### `fromSeconds()`

```typescript
/**
 * @param {number} seconds - 
 * @returns {Duration} Returns Duration
 */
public static fromSeconds(seconds: number): Duration
```

##### `fromMinutes()`

```typescript
/**
 * @param {number} minutes - 
 * @returns {Duration} Returns Duration
 */
public static fromMinutes(minutes: number): Duration
```

#### Public Instance Methods

##### `asSeconds()`

```typescript
/**
 * @returns {number} Returns number
 */
public asSeconds(): number
```

##### `asMinutes()`

```typescript
/**
 * @returns {number} Returns number
 */
public asMinutes(): number
```

##### `format()`

```typescript
/**
 * Formats the duration into a string like 'mm:ss'.
 *
 * @returns {string} The formatted duration string.
 */
public format(): string
```

---

## File: `src/shared/domain/value-objects/ExerciseSubstitution.ts`

### class `ExerciseSubstitution`

**Description:**
A Value Object representing a prioritized exercise substitution.

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ exerciseId: string; priority: number; reason?: string | undefined; }} data - 
 */
constructor(data: ExerciseSubstitutionData)
```

#### Public Properties

##### `exerciseId: string`

##### `priority: number`

##### `reason: string | undefined`

#### Public Instance Methods

##### `toPlainObject()`

```typescript
/**
 * @returns {{ exerciseId: string; priority: number; reason?: string | undefined; }} Returns { exerciseId: string; priority: number; reason?: string | undefined; }
 */
public toPlainObject(): ExerciseSubstitutionData
```

---

## File: `src/shared/domain/value-objects/index.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/Notes.ts`

### class `Notes`

**Description:**
A Value Object for notes, enforcing a character limit.

#### Constructor

##### Constructor

```typescript
/**
 * @param {string} value - 
 */
constructor(public readonly value: string)
```

---

## File: `src/shared/domain/value-objects/Percentage.ts`

### class `Percentage`

**Description:**
A Value Object representing a percentage.

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(public readonly value: number)
```

---

## File: `src/shared/domain/value-objects/RPE.ts`

### class `RPE`

**Description:**
A Value Object representing Rate of Perceived Exertion.

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(public readonly value: number)
```

---

## File: `src/shared/domain/value-objects/UserAge.ts`

### class `UserAge`

**Description:**
A Value Object representing a user's age in years.

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 */
constructor(public readonly value: number)
```

---

## File: `src/shared/domain/value-objects/UserDateOfBirth.ts`

### class `UserDateOfBirth`

**Description:**
A Value Object representing a user's date of birth.

#### Constructor

##### Constructor

```typescript
/**
 * @param {Date} value - 
 */
constructor(public readonly value: Date)
```

#### Public Instance Methods

##### `calculateAge()`

```typescript
/**
 * @returns {UserAge} Returns UserAge
 */
public calculateAge(): UserAge
```

---

## File: `src/shared/domain/value-objects/Weight.ts`

### class `Weight`

**Description:**
A Value Object representing weight with a value and a unit.

#### Constructor

##### Constructor

```typescript
/**
 * @param {number} value - 
 * @param {"kg" | "lbs"} unit - 
 */
constructor(
    public readonly value: number,
    public readonly unit: 'kg' | 'lbs'
  )
```

#### Public Instance Methods

##### `equals()`

```typescript
/**
 * @param {Weight} other - 
 * @returns {boolean} Returns boolean
 */
public equals(other: Weight): boolean
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ value: number; unit: "kg" | "lbs"; }} Returns { value: number; unit: "kg" | "lbs"; }
 */
public toPlainObject():
```

---

## File: `src/shared/errors/__tests__/guards.test.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/__tests__/useActiveProfileId.test.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/__tests__/useDebouncedValue.test.ts`

_No exported classes found in this file._

## File: `src/shared/hooks/__tests__/useObserveQuery.test.tsx`

_No exported classes found in this file._

## File: `src/shared/hooks/__tests__/useProgressCalculations.test.ts`

_No exported classes found in this file._

## File: `src/shared/locales/en/common.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/domain.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/errors.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/forms.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/common.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/domain.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/errors.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/forms.json`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useAnalysisPageData.test.tsx`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useDataExport.test.ts`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useGenerateFullReport.test.tsx`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useGetFrequencyAnalysis.test.tsx`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useGetStrengthProgress.test.tsx`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useGetVolumeAnalysis.test.tsx`

_No exported classes found in this file._

## File: `src/features/analysis/hooks/__tests__/useGetWeightProgress.test.tsx`

_No exported classes found in this file._

## File: `src/features/analysis/query-services/__tests__/AnalysisQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/analysis/query-services/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/data/__tests__/BodyMetricsRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/domain/__tests__/HeightRecordModel.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/domain/__tests__/WeightRecordModel.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useAddHeightRecord.test.tsx`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useAddWeightRecord.test.tsx`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useDeleteHeightRecord.test.tsx`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useDeleteWeightRecord.test.tsx`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useGetHeightHistory.test.tsx`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useGetLatestWeight.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useGetWeightHistory.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useMetricConversions.test.ts`

_No exported classes found in this file._

## File: `src/features/body-metrics/hooks/__tests__/useUpdateWeightRecord.test.tsx`

_No exported classes found in this file._

## File: `src/features/body-metrics/query-services/__tests__/BodyMetricsQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/__tests__/useDashboardData.test.tsx`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/__tests__/useGetDashboardData.test.tsx`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/__tests__/useWorkoutStreak.test.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/hooks/__tests__/useWorkoutSummaryCard.test.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/query-services/__tests__/DashboardQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/dashboard/query-services/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/__tests__/AdvancedFlows.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/__tests__/useDataIntegrityChecker.test.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/__tests__/useExportData.test.tsx`

_No exported classes found in this file._

## File: `src/features/data-sync/hooks/__tests__/useImportData.test.tsx`

_No exported classes found in this file._

## File: `src/features/data-sync/query-services/__tests__/DataSyncQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/data-sync/query-services/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/exercise/domain/__tests__/ExerciseModel.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/domain/__tests__/ExerciseTemplateModel.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useAddSubstitution.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useCachedExerciseData.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useCreateExercise.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useDeleteExercise.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useExerciseInstructions.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useExercisePerformanceOverview.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useExerciseSearch.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useExerciseWizard.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useGetExercise.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useGetExercises.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useGetExercisesByIds.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useRecentExercises.test.ts`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useRemoveSubstitution.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useSaveBulkExercises.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/hooks/__tests__/useUpdateExercise.test.tsx`

_No exported classes found in this file._

## File: `src/features/exercise/query-services/__tests__/ExerciseQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/__tests__/useBulkDelete.test.tsx`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/__tests__/useOptimizeDatabase.test.tsx`

_No exported classes found in this file._

## File: `src/features/maintenance/hooks/__tests__/useValidateDataIntegrity.test.tsx`

_No exported classes found in this file._

## File: `src/features/maintenance/query-services/__tests__/index.ts`

_No exported classes found in this file._

## File: `src/features/maintenance/query-services/__tests__/MaintenanceQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/data/__tests__/MaxLogRepository.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/domain/__tests__/IOneRepMaxFormula.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/domain/__tests__/MaxLogModel.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/use1RMCalculator.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useCalculateBodyweightRatio.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useCompareMaxLogPerformance.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useCreateMaxLog.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useDeleteMaxLog.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useGetLatestMaxLogsByExercise.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useGetMaxLog.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useGetMaxLogs.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useGetMaxLogSummary.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/usePersonalRecordAlerts.test.ts`

_No exported classes found in this file._

## File: `src/features/max-log/hooks/__tests__/useUpdateMaxLog.test.tsx`

_No exported classes found in this file._

## File: `src/features/max-log/query-services/__tests__/MaxLogQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/__tests__/CustomThemeModel.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/__tests__/ProfileModel.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/__tests__/UserDetailsModel.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/domain/__tests__/UserSettingsModel.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/__tests__/ProfileFlows.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/hooks/__tests__/useActiveProfileData.test.ts`

_No exported classes found in this file._

## File: `src/features/profile/query-services/__tests__/ProfileQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/__tests__/AppliedExerciseModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/__tests__/ExerciseGroupModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/__tests__/SessionModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/__tests__/TrainingCycleModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/__tests__/TrainingPlanModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/builders/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/builders/TrainingPlanBuilder.ts`

### class `TrainingPlanBuilder`

**Description:**
A builder for constructing a TrainingPlanModel from scratch. Provides a fluent API for step-by-step creation of a valid training plan.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new TrainingPlanBuilder instance.
 *
 * @param {TrainingPlanModel} initialPlan - 
 */
constructor(initialPlan: TrainingPlanModel)
```

#### Public Instance Methods

##### `addSession()`

```typescript
/**
 * Adds a new session to the training plan and selects it as the current session.
 *
 * @param {string} name - 
 * @returns {this} This builder instance for method chaining
 */
addSession(name: string): this
```

##### `removeSession()`

```typescript
/**
 * Removes a session from the training plan. If the removed session was the current session, selects the first available session.
 *
 * @param {string} sessionId - 
 * @returns {this} This builder instance for method chaining
 */
removeSession(sessionId: string): this
```

##### `selectSession()`

```typescript
/**
 * Selects a session as the current working session.
 *
 * @param {string} sessionId - 
 * @returns {this} This builder instance for method chaining
 */
selectSession(sessionId: string): this
```

##### `updateCurrentSessionDetails()`

```typescript
/**
 * Updates the details of the currently selected session.
 *
 * @param {{ name: string; }} details - 
 * @returns {this} This builder instance for method chaining
 */
updateCurrentSessionDetails(details:
```

##### `addExerciseToCurrentSession()`

```typescript
/**
 * Adds a single exercise to the currently selected session. This method creates a 'single' type ExerciseGroupData object. It then uses the ExerciseGroupModel.hydrate static method to instantiate a new ExerciseGroupModel containing the provided AppliedExerciseModel. Finally, it immutably adds this new group to the currently selected SessionModel within the plan.
 *
 * @param {AppliedExerciseModel} exercise - 
 * @returns {this} This builder instance for method chaining
 */
addExerciseToCurrentSession(exercise: AppliedExerciseModel): this
```

##### `addSupersetToCurrentSession()`

```typescript
/**
 * Adds a superset of two exercises to the currently selected session. This method creates a 'superset' type ExerciseGroupData object. It then uses the ExerciseGroupModel.hydrate static method to instantiate a new SupersetGroupModel, which will throw an error if the provided exercises array does not contain exactly two items. Finally, it immutably adds this new group to the currently selected SessionModel.
 *
 * @param {AppliedExerciseModel[]} exercises - 
 * @returns {this} This builder instance for method chaining
 */
addSupersetToCurrentSession(exercises: AppliedExerciseModel[]): this
```

##### `build()`

```typescript
/**
 * Finalizes and returns the constructed TrainingPlanModel. Performs final validation to ensure the plan is in a valid state.
 *
 * @returns {TrainingPlanModel} The constructed TrainingPlanModel
 * @throws If the plan contains no sessions
 */
build(): TrainingPlanModel
```

---

## File: `src/features/training-plan/domain/groups/AMRAPGroupModel.ts`

### class `AMRAPGroupModel`

**Description:**
A specialized exercise group model for As Many Rounds As Possible (AMRAP) training. Extends the base ExerciseGroupModel with AMRAP-specific functionality.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new AMRAPGroupModel instance.
 *
 * @param {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} props - 
 * @param {AppliedExerciseModel[]} appliedExercises - 
 * @throws If the duration is not defined or is less than 1
 */
constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[])
```

---

## File: `src/features/training-plan/domain/groups/CircuitGroupModel.ts`

### class `CircuitGroupModel`

**Description:**
A specialized exercise group model for circuit training. Extends the base ExerciseGroupModel with circuit-specific functionality.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new CircuitGroupModel instance.
 *
 * @param {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} props - 
 * @param {AppliedExerciseModel[]} appliedExercises - 
 * @throws If the number of exercises is less than 2
 */
constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[])
```

---

## File: `src/features/training-plan/domain/groups/EMOMGroupModel.ts`

### class `EMOMGroupModel`

**Description:**
A specialized exercise group model for Every Minute On the Minute (EMOM) training. Extends the base ExerciseGroupModel with EMOM-specific functionality.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new EMOMGroupModel instance.
 *
 * @param {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} props - 
 * @param {AppliedExerciseModel[]} appliedExercises - 
 * @throws If the duration is not defined or is less than 1
 */
constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[])
```

---

## File: `src/features/training-plan/domain/groups/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/groups/SupersetGroupModel.ts`

### class `SupersetGroupModel`

**Description:**
A specialized exercise group model for superset training. Extends the base ExerciseGroupModel with superset-specific functionality.

#### Constructor

##### Constructor

```typescript
/**
 * Creates a new SupersetGroupModel instance.
 *
 * @param {{ id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "single"; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "superset"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "circuit"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "emom"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "amrap"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; durationMinutes: number; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "warmup"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; } | { id: string; profileId: string; appliedExerciseIds: string[]; createdAt: Date; updatedAt: Date; type: "stretching"; rounds: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; restTimeSeconds?: number | undefined; }} props - 
 * @param {AppliedExerciseModel[]} appliedExercises - 
 * @throws If the number of exercises is not exactly 2
 */
constructor(props: ExerciseGroupData, appliedExercises: AppliedExerciseModel[])
```

---

## File: `src/features/training-plan/domain/sets/domain-utils.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/DropSetConfiguration.ts`

### class `DropSetConfiguration`

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
constructor(data: DropSetParamsData)
```

#### Public Properties

##### `startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `rpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * @returns {number} Returns number
 */
getTotalSets(): number
```

##### `getSummary()`

```typescript
/**
 * @returns {string} Returns string
 */
getSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * @param {DurationParams} {
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  } - 
 * @returns {number} Returns number
 */
getEstimatedDurationSeconds(
```

##### `generateEmptySets()`

```typescript
/**
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Returns Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]
 */
generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[]
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * @returns {number[]} Returns number[]
 */
getEstimatedRPECurve(): number[]
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Returns { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }
 */
toPlainObject(): DropSetParamsData
```

##### `clone()`

```typescript
/**
 * @returns {DropSetConfiguration} Returns DropSetConfiguration
 */
clone(): DropSetConfiguration
```

---

## File: `src/features/training-plan/domain/sets/index.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/MavSetConfiguration.ts`

### class `MavSetConfiguration`

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
constructor(data: MavSetParamsData)
```

#### Public Properties

##### `sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `rpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * @returns {number} Returns number
 */
getTotalSets(): number
```

##### `getSummary()`

```typescript
/**
 * @returns {string} Returns string
 */
getSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * @param {DurationParams} {
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  } - 
 * @returns {number} Returns number
 */
getEstimatedDurationSeconds(
```

##### `generateEmptySets()`

```typescript
/**
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Returns Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]
 */
generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[]
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * @returns {number[]} Returns number[]
 */
getEstimatedRPECurve(): number[]
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Returns { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }
 */
toPlainObject(): MavSetParamsData
```

##### `clone()`

```typescript
/**
 * @returns {MavSetConfiguration} Returns MavSetConfiguration
 */
clone(): MavSetConfiguration
```

---

## File: `src/features/training-plan/domain/sets/MyoRepsSetConfiguration.ts`

### class `MyoRepsSetConfiguration`

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
constructor(data: MyoRepsParamsData)
```

#### Public Properties

##### `activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `rpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * @returns {number} Returns number
 */
getTotalSets(): number
```

##### `getSummary()`

```typescript
/**
 * @returns {string} Returns string
 */
getSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * @param {DurationParams} {
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  } - 
 * @returns {number} Returns number
 */
getEstimatedDurationSeconds(
```

##### `generateEmptySets()`

```typescript
/**
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Returns Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]
 */
generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[]
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * @returns {number[]} Returns number[]
 */
getEstimatedRPECurve(): number[]
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Returns { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }
 */
toPlainObject(): MyoRepsParamsData
```

##### `clone()`

```typescript
/**
 * @returns {MyoRepsSetConfiguration} Returns MyoRepsSetConfiguration
 */
clone(): MyoRepsSetConfiguration
```

---

## File: `src/features/training-plan/domain/sets/PyramidalSetConfiguration.ts`

### class `PyramidalSetConfiguration`

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
constructor(data: PyramidalSetParamsData)
```

#### Public Properties

##### `startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `mode: "ascending" | "descending" | "bothAscendingDescending"`

##### `rpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * @returns {number} Returns number
 */
getTotalSets(): number
```

##### `getSummary()`

```typescript
/**
 * @returns {string} Returns string
 */
getSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * @param {DurationParams} {
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  } - 
 * @returns {number} Returns number
 */
getEstimatedDurationSeconds(
```

##### `generateEmptySets()`

```typescript
/**
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Returns Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]
 */
generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[]
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * @returns {number[]} Returns number[]
 */
getEstimatedRPECurve(): number[]
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Returns { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }
 */
toPlainObject(): PyramidalSetParamsData
```

##### `clone()`

```typescript
/**
 * @returns {PyramidalSetConfiguration} Returns PyramidalSetConfiguration
 */
clone(): PyramidalSetConfiguration
```

---

## File: `src/features/training-plan/domain/sets/RestPauseSetConfiguration.ts`

### class `RestPauseSetConfiguration`

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
constructor(data: RestPauseSetParamsData)
```

#### Public Properties

##### `counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `rpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * @returns {number} Returns number
 */
getTotalSets(): number
```

##### `getSummary()`

```typescript
/**
 * @returns {string} Returns string
 */
getSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * @param {DurationParams} {
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  } - 
 * @returns {number} Returns number
 */
getEstimatedDurationSeconds(
```

##### `generateEmptySets()`

```typescript
/**
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Returns Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]
 */
generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[]
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * @returns {number[]} Returns number[]
 */
getEstimatedRPECurve(): number[]
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Returns { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }
 */
toPlainObject(): RestPauseSetParamsData
```

##### `clone()`

```typescript
/**
 * @returns {RestPauseSetConfiguration} Returns RestPauseSetConfiguration
 */
clone(): RestPauseSetConfiguration
```

---

## File: `src/features/training-plan/domain/sets/SetConfiguration.ts`

### class `SetConfiguration`

**Description:**
Abstract base class for all set configurations in the training plan domain. This class uses the Template Method pattern to define a common interface for all set configuration types while allowing each concrete implementation to provide specific behavior. The static hydrate method acts as a polymorphic factory, eliminating the need for a separate factory class. All set configurations are immutable - methods that modify state return new instances.

#### Constructor

##### Constructor

```typescript
/**
 * Protected constructor to enforce the use of the hydrate factory method.
 *
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
protected constructor(data: AnySetConfigurationData)
```

#### Public Properties

##### `[immerable]: boolean`

##### `type: "standard" | "drop" | "myoReps" | "pyramidal" | "restPause" | "mav"`

#### Public Static Methods

##### `hydrate()`

```typescript
/**
 * Acts as a polymorphic factory to create the correct SetConfiguration subclass. This is the only public entry point for creating SetConfiguration instances.
 *
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 * @returns {SetConfiguration} An instance of a concrete SetConfiguration subclass.
 * @throws Error if the set configuration type is unknown.
 */
public static hydrate(data: AnySetConfigurationData): SetConfiguration
```

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * Calculates the total number of sets this configuration will generate.
 *
 * @returns {number} The total number of sets.
 */
abstract getTotalSets(): number;
```

##### `getSummary()`

```typescript
/**
 * Generates a human-readable summary of this set configuration.
 *
 * @returns {string} A string summarizing the set structure (e.g., "3x8-12").
 */
abstract getSummary(): string;
```

##### `generateEmptySets()`

```typescript
/**
 * Generates empty performed set data templates for workout execution. These serve as placeholders that will be filled during workout performance.
 *
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Array of partial PerformedSetData objects ready for completion.
 */
abstract generateEmptySets(
    profileId: string,
    counterType: ExerciseCounter
  ): Partial<PerformedSetData>[];
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * Estimates the total duration this set configuration will take to complete.
 *
 * @param {DurationParams | undefined} params - 
 * @returns {number} Estimated duration in seconds.
 */
abstract getEstimatedDurationSeconds(params?: DurationParams): number;
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * Generates an estimated RPE (Rate of Perceived Exertion) curve for this set configuration. The curve represents how RPE is expected to change across sets.
 *
 * @returns {number[]} Array of RPE values, one for each set in the configuration.
 */
abstract getEstimatedRPECurve(): number[];
```

##### `toPlainObject()`

```typescript
/**
 * Converts this domain model back to a plain data object. Used for serialization and persistence.
 *
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "drop"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; drops: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "myoReps"; activationCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; miniSetCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "pyramidal"; startCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; endCounts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; step: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; mode: "ascending" | "descending" | "bothAscendingDescending"; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "restPause"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; pauses: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; } | { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "mav"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Plain object representation of this set configuration.
 */
abstract toPlainObject(): AnySetConfigurationData;
```

##### `clone()`

```typescript
/**
 * Creates a deep copy of this set configuration. Maintains immutability by returning a new instance.
 *
 * @returns {SetConfiguration} A new SetConfiguration instance with identical data.
 */
abstract clone(): SetConfiguration;
```

---

## File: `src/features/training-plan/domain/sets/StandardSetConfiguration.ts`

### class `StandardSetConfiguration`

#### Constructor

##### Constructor

```typescript
/**
 * @param {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} data - 
 */
constructor(data: StandardSetParamsData)
```

#### Public Properties

##### `sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }`

##### `load: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

##### `percentage: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

##### `rpe: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined`

#### Public Instance Methods

##### `getTotalSets()`

```typescript
/**
 * @returns {number} Returns number
 */
getTotalSets(): number
```

##### `getSummary()`

```typescript
/**
 * @returns {string} Returns string
 */
getSummary(): string
```

##### `getEstimatedDurationSeconds()`

```typescript
/**
 * @param {DurationParams} {
    timePerRep = SECONDS_PER_REP,
    baseTimePerSet = BASE_SECONDS_PER_SET,
  } - 
 * @returns {number} Returns number
 */
getEstimatedDurationSeconds(
```

##### `generateEmptySets()`

```typescript
/**
 * @param {string} profileId - 
 * @param {"reps" | "mins" | "secs"} counterType - 
 * @returns {Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]} Returns Partial<{ id: string; profileId: string; counterType: "reps" | "mins" | "secs"; counts: number; completed: boolean; weight?: number | undefined; notes?: string | undefined; rpe?: number | undefined; percentage?: number | undefined; plannedLoad?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedRpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; plannedCounts?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }>[]
 */
generateEmptySets(profileId: string, counterType: ExerciseCounter): Partial<PerformedSetData>[]
```

##### `getEstimatedRPECurve()`

```typescript
/**
 * @returns {number[]} Returns number[]
 */
getEstimatedRPECurve(): number[]
```

##### `toPlainObject()`

```typescript
/**
 * @returns {{ sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }} Returns { sets: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; type: "standard"; counts: { min: number; direction: "asc" | "desc"; max?: number | undefined; }; load?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; percentage?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; rpe?: { min: number; direction: "asc" | "desc"; max?: number | undefined; } | undefined; }
 */
toPlainObject(): StandardSetParamsData
```

##### `clone()`

```typescript
/**
 * @returns {StandardSetConfiguration} Returns StandardSetConfiguration
 */
clone(): StandardSetConfiguration
```

---

## File: `src/features/training-plan/hooks/__tests__/PlanEditorFlows.integration.test.tsx`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/TrainingPlanFlows.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/useGetTrainingCycle.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/useGetTrainingCycles.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/useGetTrainingPlan.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/useGetTrainingPlans.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/usePlanEditorData.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/hooks/__tests__/useTrainingPlanProgress.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/machines/__tests__/sessionEditorMachine.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/query-services/__tests__/TrainingPlanQueryService.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/store/__tests__/planEditorStore.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/data/__tests__/transaction-handling.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/__tests__/PerformedExerciseLogModel.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/__tests__/PerformedGroupLogModel.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/__tests__/PerformedSetModel.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/domain/__tests__/WorkoutLogModel.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useGetLastWorkoutSummary.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useGetWorkoutLog.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useGetWorkoutLogs.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useInfiniteWorkoutHistory.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useRestTimer.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useWorkoutBackup.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useWorkoutCalendar.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useWorkoutFormState.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useWorkoutInitializationData.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useWorkoutProgress.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/useWorkoutTimer.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/WorkoutFlows.integration.test.tsx`

_No exported classes found in this file._

## File: `src/features/workout/hooks/__tests__/WorkoutHistoryFlows.integration.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/machines/__tests__/workoutMachine.test.ts`

_No exported classes found in this file._

## File: `src/features/workout/query-services/__tests__/WorkoutQueryService.test.ts`

_No exported classes found in this file._

## File: `src/shared/application/events/handlers/index.ts`

_No exported classes found in this file._

## File: `src/shared/application/events/handlers/NewPersonalRecordHandler.ts`

### class `NewPersonalRecordHandler`

**Description:**
Application layer event handler that manages actions triggered when a new personal record is achieved. This handler can trigger analysis updates, notifications, and achievement tracking when a user sets a new personal best in any exercise. Located in the application layer because it orchestrates application services to fulfill complex business workflows spanning multiple bounded contexts.

#### Constructor

##### Constructor

```typescript
/**
 * @param {AnalysisService} analysisService - 
 * @param {ILogger} logger - 
 */
constructor(
    private readonly analysisService: AnalysisService,
    private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `setupSubscriptions()`

```typescript
/**
 * Sets up the subscription for NewPersonalRecordEvent. This method is called at application startup to register the handler.
 *
 * @param {NewPersonalRecordEvent | undefined} event - 
 */
setupSubscriptions(event?: NewPersonalRecordEvent): void
```

---

## File: `src/shared/application/events/handlers/SampleDataPopulationHandler.ts`

### class `SampleDataPopulationHandler`

**Description:**
Application layer event handler that populates new profiles with sample training data. This handler automatically creates a basic training plan with common exercises when a new profile is created, providing users with an example to get started. Located in the application layer because it orchestrates multiple services and repositories to fulfill complex business workflows.

#### Constructor

##### Constructor

```typescript
/**
 * @param {ExerciseService} exerciseService - 
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 * @param {ILogger} logger - 
 */
constructor(
    private readonly exerciseService: ExerciseService,
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    private readonly logger: ILogger
  )
```

#### Public Instance Methods

##### `setupSubscriptions()`

```typescript
/**
 * Sets up the subscription for ProfileCreatedEvent. This method is called at application startup to register the handler.
 *
 * @param {ProfileCreatedEvent | undefined} event - 
 */
setupSubscriptions(event?: ProfileCreatedEvent): void
```

---

## File: `src/shared/domain/events/handlers/DataImportCompletedHandler.ts`

### class `DataImportCompletedHandler`

**Description:**
Domain event handler that manages post-import cleanup and notifications. This handler performs necessary cleanup operations and sends notifications after a data import operation has been completed for a profile.

#### Constructor

##### Constructor

```typescript
/**
 */
constructor()
```

#### Public Instance Methods

##### `setupSubscriptions()`

```typescript
/**
 * Sets up the subscription for DataImportCompletedEvent. This method is called at application startup to register the handler.
 *
 * @param {DataImportCompletedEvent | undefined} event - 
 */
setupSubscriptions(event?: DataImportCompletedEvent): void
```

---

## File: `src/shared/domain/events/handlers/index.ts`

_No exported classes found in this file._

## File: `src/shared/domain/events/handlers/WorkoutFinishedPlanProgressionHandler.ts`

### class `WorkoutFinishedPlanProgressionHandler`

**Description:**
Domain event handler that manages training plan progression when a workout is completed. This handler automatically advances the current session index in a training plan when a workout is finished, ensuring smooth progression through the plan. Located in the domain layer because it only depends on domain models and repository interfaces, performing pure domain logic without orchestrating application services.

#### Constructor

##### Constructor

```typescript
/**
 * @param {ITrainingPlanRepository} trainingPlanRepository - 
 */
constructor(private readonly trainingPlanRepository: ITrainingPlanRepository)
```

#### Public Instance Methods

##### `setupSubscriptions()`

```typescript
/**
 * Sets up the subscription for WorkoutFinishedEvent. This method is called at application startup to register the handler.
 *
 * @param {WorkoutFinishedEvent | undefined} event - 
 */
setupSubscriptions(event?: WorkoutFinishedEvent): void
```

---

## File: `src/shared/domain/value-objects/__tests__/Counter.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/Duration.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/ExerciseSubstitution.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/Notes.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/Percentage.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/RPE.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/UserAge.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/UserDateOfBirth.test.ts`

_No exported classes found in this file._

## File: `src/shared/domain/value-objects/__tests__/Weight.test.ts`

_No exported classes found in this file._

## File: `src/shared/locales/en/features/dashboard.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/features/onboarding.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/features/plan-editor.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/features/settings.json`

_No exported classes found in this file._

## File: `src/shared/locales/en/features/workout.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/features/dashboard.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/features/onboarding.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/features/plan-editor.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/features/settings.json`

_No exported classes found in this file._

## File: `src/shared/locales/it/features/workout.json`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/builders/__tests__/TrainingPlanBuilder.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/groups/__tests__/AMRAPGroupModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/groups/__tests__/CircuitGroupModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/groups/__tests__/EMOMGroupModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/groups/__tests__/SupersetGroupModel.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/__tests__/DropSetConfiguration.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/__tests__/MyoRepsSetConfiguration.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/__tests__/PyramidalSetConfiguration.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/__tests__/RestPauseSetConfiguration.test.ts`

_No exported classes found in this file._

## File: `src/features/training-plan/domain/sets/__tests__/StandardSetConfiguration.test.ts`

_No exported classes found in this file._

