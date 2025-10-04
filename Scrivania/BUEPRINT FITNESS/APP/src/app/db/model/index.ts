/**
 * WatermelonDB Models Index
 *
 * Exports all WatermelonDB models for the Blueprint Fitness application.
 * These models handle only data persistence - business logic remains in the Domain layer.
 */

// Profile and user-related models
export { CustomTheme } from './CustomTheme';
export { Profile } from './Profile';
export { UserDetails } from './UserDetails';
export { UserSettings } from './UserSettings';

// Exercise-related models
export { Exercise } from './Exercise';
export { ExerciseTemplate } from './ExerciseTemplate';

// Training plan related models
export { AppliedExercise } from './AppliedExercise';
export { ExerciseGroup } from './ExerciseGroup';
export { TrainingCycle } from './TrainingCycle';
export { TrainingPlan } from './TrainingPlan';
export { WorkoutSession } from './WorkoutSession';

// Workout log related models
export { PerformedExerciseLog } from './PerformedExerciseLog';
export { PerformedGroup } from './PerformedGroup';
export { PerformedSet } from './PerformedSet';
export { WorkoutLog } from './WorkoutLog';

// Body metrics models
export { HeightRecord } from './HeightRecord';
export { WeightRecord } from './WeightRecord';

// Max log model
export { MaxLog } from './MaxLog';

// Workout state model
export { WorkoutState } from './WorkoutState';
