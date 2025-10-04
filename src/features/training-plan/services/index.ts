export { TrainingPlanService } from './TrainingPlanService';

// Re-export domain models for use by upper layers (Query Services and Hooks)
// This maintains proper architectural boundaries while allowing type access
export { TrainingCycleModel } from '../domain/TrainingCycleModel';
export { TrainingPlanModel } from '../domain/TrainingPlanModel';
