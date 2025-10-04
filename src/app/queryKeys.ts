/**
 * Centralized factory for all React Query keys.
 * Provides a structured, tag-based system for type-safe keys,
 * enabling efficient, scope-based cache invalidation.
 */
export const queryKeys = {
  profiles: {
    all: () => ['profiles'] as const,
    lists: () => [...queryKeys.profiles.all(), 'list'] as const,
    details: () => [...queryKeys.profiles.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.profiles.details(), id] as const,
  },
  userSettings: (profileId: string) => ['userSettings', profileId] as const,
  userDetails: (profileId: string) => ['userDetails', profileId] as const,
  customThemes: (profileId: string) => ['customThemes', profileId] as const,
  exercises: {
    all: (profileId: string) => ['exercises', profileId] as const,
    lists: (profileId: string) => [...queryKeys.exercises.all(profileId), 'list'] as const,
    list: (profileId: string, filters: object) =>
      [...queryKeys.exercises.lists(profileId), filters] as const,
    details: (profileId: string) => [...queryKeys.exercises.all(profileId), 'detail'] as const,
    detail: (profileId: string, id: string) =>
      [...queryKeys.exercises.details(profileId), id] as const,
  },
  trainingPlans: {
    all: (profileId: string) => ['trainingPlans', profileId] as const,
    lists: (profileId: string) => [...queryKeys.trainingPlans.all(profileId), 'list'] as const,
    list: (profileId: string, filters: object) =>
      [...queryKeys.trainingPlans.lists(profileId), filters] as const,
    details: (profileId: string) => [...queryKeys.trainingPlans.all(profileId), 'detail'] as const,
    detail: (profileId: string, id: string) =>
      [...queryKeys.trainingPlans.details(profileId), id] as const,
  },
  trainingCycles: {
    all: (profileId: string) => ['trainingCycles', profileId] as const,
    lists: (profileId: string) => [...queryKeys.trainingCycles.all(profileId), 'list'] as const,
    details: (profileId: string) => [...queryKeys.trainingCycles.all(profileId), 'detail'] as const,
    detail: (profileId: string, id: string) =>
      [...queryKeys.trainingCycles.details(profileId), id] as const,
  },
  workoutHistory: {
    all: (profileId: string) => ['workoutHistory', profileId] as const,
    lists: (profileId: string) => [...queryKeys.workoutHistory.all(profileId), 'list'] as const,
    list: (profileId: string, filters: object) =>
      [...queryKeys.workoutHistory.lists(profileId), filters] as const,
  },
  maxLogs: {
    all: (profileId: string) => ['maxLogs', profileId] as const,
    byExercise: (profileId: string, exerciseId: string) =>
      [...queryKeys.maxLogs.all(profileId), exerciseId] as const,
  },
  bodyMetrics: {
    all: (profileId: string) => ['bodyMetrics', profileId] as const,
    weight: (profileId: string) => [...queryKeys.bodyMetrics.all(profileId), 'weight'] as const,
    height: (profileId: string) => [...queryKeys.bodyMetrics.all(profileId), 'height'] as const,
  },
  analysis: {
    all: (profileId: string) => ['analysis', profileId] as const,
    report: (profileId: string, filters: object) =>
      [...queryKeys.analysis.all(profileId), 'report', filters] as const,
  },
  dashboard: {
    all: (profileId: string) => ['dashboard', profileId] as const,
    todaysEquipment: (profileId: string) =>
      [...queryKeys.dashboard.all(profileId), 'todaysEquipment'] as const,
  },
};
