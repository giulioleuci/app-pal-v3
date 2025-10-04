export { ExerciseService } from './ExerciseService';

// Re-export domain models for use by upper layers (Query Services and Hooks)
// This maintains proper architectural boundaries while allowing type access
export { ExerciseModel } from '../domain/ExerciseModel';
