// Exercise Hook Exports - Specialized Aggregates Architecture
// === FOCUSED AGGREGATES ===
export {
  type ExerciseStatistics,
  type TrendingExercise,
  type UsageAnalytics,
  useExerciseAnalytics,
  type UseExerciseAnalyticsResult,
} from './useExerciseAnalytics';
export { useExerciseCRUD, type UseExerciseCRUDResult } from './useExerciseCRUD';
export {
  type ExerciseFilters,
  useExerciseSearch,
  type UseExerciseSearchResult,
} from './useExerciseSearch';
