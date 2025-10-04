/**
 * Centralized route definitions and i18n title keys for consistent navigation.
 * This file defines all application paths and their corresponding translation keys.
 */

/**
 * Route configuration interface defining path and title key.
 */
interface RouteConfig {
  /** The URL path for the route */
  path: string;
  /** The i18n key for the page title */
  titleKey: string;
}

/**
 * Centralized routes configuration object.
 * Maps route names to their path and i18n title key.
 */
export const ROUTES = {
  // Authentication and onboarding
  onboarding: {
    path: '/',
    titleKey: 'pageTitles.onboarding',
  } as RouteConfig,

  // Dashboard
  dashboard: {
    path: '/dashboard',
    titleKey: 'pageTitles.dashboard',
  } as RouteConfig,

  // Profile management
  profiles: {
    path: '/profiles',
    titleKey: 'pageTitles.profiles',
  } as RouteConfig,

  profileCreate: {
    path: '/profiles/create',
    titleKey: 'pageTitles.profileCreate',
  } as RouteConfig,

  profileEdit: {
    path: '/profiles/:id/edit',
    titleKey: 'pageTitles.profileEdit',
  } as RouteConfig,

  // Training plans
  trainingPlans: {
    path: '/training-plans',
    titleKey: 'pageTitles.trainingPlans',
  } as RouteConfig,

  trainingPlanCreate: {
    path: '/training-plans/create',
    titleKey: 'pageTitles.trainingPlanCreate',
  } as RouteConfig,

  trainingPlanEdit: {
    path: '/training-plans/:id/edit',
    titleKey: 'pageTitles.trainingPlanEdit',
  } as RouteConfig,

  planEditor: {
    path: '/plan-editor/:id?',
    titleKey: 'pageTitles.planEditor',
  } as RouteConfig,

  // Workouts
  workouts: {
    path: '/workouts',
    titleKey: 'pageTitles.workouts',
  } as RouteConfig,

  workoutActive: {
    path: '/workout/:planId/:sessionId',
    titleKey: 'pageTitles.workoutActive',
  } as RouteConfig,

  workoutHistory: {
    path: '/workout-history',
    titleKey: 'pageTitles.workoutHistory',
  } as RouteConfig,

  // Exercises
  exercises: {
    path: '/exercises',
    titleKey: 'pageTitles.exercises',
  } as RouteConfig,

  exerciseLibrary: {
    path: '/exercise-library',
    titleKey: 'pageTitles.exerciseLibrary',
  } as RouteConfig,

  exerciseCreate: {
    path: '/exercises/create',
    titleKey: 'pageTitles.exerciseCreate',
  } as RouteConfig,

  exerciseEdit: {
    path: '/exercises/:id/edit',
    titleKey: 'pageTitles.exerciseEdit',
  } as RouteConfig,

  // Progress and analytics
  progress: {
    path: '/progress',
    titleKey: 'pageTitles.progress',
  } as RouteConfig,

  analytics: {
    path: '/analytics',
    titleKey: 'pageTitles.analytics',
  } as RouteConfig,

  maxLog: {
    path: '/max-log',
    titleKey: 'pageTitles.maxLog',
  } as RouteConfig,

  bodyMetrics: {
    path: '/body-metrics',
    titleKey: 'pageTitles.bodyMetrics',
  } as RouteConfig,

  // Settings
  settings: {
    path: '/settings',
    titleKey: 'pageTitles.settings',
  } as RouteConfig,

  settingsProfile: {
    path: '/settings/profile',
    titleKey: 'pageTitles.settingsProfile',
  } as RouteConfig,

  settingsPreferences: {
    path: '/settings/preferences',
    titleKey: 'pageTitles.settingsPreferences',
  } as RouteConfig,

  settingsData: {
    path: '/settings/data',
    titleKey: 'pageTitles.settingsData',
  } as RouteConfig,

  settingsAbout: {
    path: '/settings/about',
    titleKey: 'pageTitles.settingsAbout',
  } as RouteConfig,

  // Error pages
  notFound: {
    path: '*',
    titleKey: 'pageTitles.notFound',
  } as RouteConfig,
} as const;

/**
 * Route path constants for type-safe routing.
 */
export const ROUTE_PATHS = {
  onboarding: ROUTES.onboarding.path,
  dashboard: ROUTES.dashboard.path,
  profiles: ROUTES.profiles.path,
  profileCreate: ROUTES.profileCreate.path,
  profileEdit: ROUTES.profileEdit.path,
  trainingPlans: ROUTES.trainingPlans.path,
  trainingPlanCreate: ROUTES.trainingPlanCreate.path,
  trainingPlanEdit: ROUTES.trainingPlanEdit.path,
  planEditor: ROUTES.planEditor.path,
  workouts: ROUTES.workouts.path,
  workoutActive: ROUTES.workoutActive.path,
  workoutHistory: ROUTES.workoutHistory.path,
  exercises: ROUTES.exercises.path,
  exerciseLibrary: ROUTES.exerciseLibrary.path,
  exerciseCreate: ROUTES.exerciseCreate.path,
  exerciseEdit: ROUTES.exerciseEdit.path,
  progress: ROUTES.progress.path,
  analytics: ROUTES.analytics.path,
  maxLog: ROUTES.maxLog.path,
  bodyMetrics: ROUTES.bodyMetrics.path,
  settings: ROUTES.settings.path,
  settingsProfile: ROUTES.settingsProfile.path,
  settingsPreferences: ROUTES.settingsPreferences.path,
  settingsData: ROUTES.settingsData.path,
  settingsAbout: ROUTES.settingsAbout.path,
  notFound: ROUTES.notFound.path,
} as const;

/**
 * Helper function to generate a route path with parameters.
 *
 * @param routePath - The route path template (e.g., '/users/:id')
 * @param params - Object containing parameter values (e.g., { id: '123' })
 * @returns The generated path with parameters substituted
 *
 * @example
 * ```typescript
 * const path = generatePath(ROUTE_PATHS.profileEdit, { id: '123' });
 * // Returns: '/profiles/123/edit'
 * ```
 */
export function generatePath(routePath: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    routePath
  );
}

/**
 * Type-safe route parameter extraction for commonly used routes.
 */
export type RouteParams = {
  profileEdit: { id: string };
  trainingPlanEdit: { id: string };
  planEditor: { id?: string };
  workoutActive: { planId: string; sessionId: string };
  exerciseEdit: { id: string };
};

/**
 * Route group definitions for navigation organization.
 */
export const ROUTE_GROUPS = {
  main: [
    ROUTES.dashboard,
    ROUTES.workouts,
    ROUTES.trainingPlans,
    ROUTES.exercises,
    ROUTES.progress,
  ],
  settings: [
    ROUTES.settings,
    ROUTES.settingsProfile,
    ROUTES.settingsPreferences,
    ROUTES.settingsData,
    ROUTES.settingsAbout,
  ],
  profile: [ROUTES.profiles, ROUTES.profileCreate, ROUTES.profileEdit],
} as const;
