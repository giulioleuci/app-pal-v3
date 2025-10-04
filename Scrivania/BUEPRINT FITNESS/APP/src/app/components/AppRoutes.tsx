/**
 * Centralized routing configuration with lazy loading and animated transitions.
 *
 * This component defines all application routes using the centralized ROUTES object.
 * All page components are lazy-loaded for optimal bundle splitting.
 * Page transitions are animated using framer-motion.
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { animations } from '@/app/animations';
import { ROUTES } from '@/app/routes';

import { MainLayout } from './MainLayout';
import { ProfileRequiredRoute } from './ProfileRequiredRoute';

// Lazy load all page components
const WelcomePage = lazy(() =>
  import('@/app/pages/WelcomePage').then((m) => ({ default: m.WelcomePage }))
);
const DashboardPage = lazy(() =>
  import('@/app/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const PlansPage = lazy(() =>
  import('@/app/pages/PlansPage').then((m) => ({ default: m.PlansPage }))
);
const PlanEditorPage = lazy(() =>
  import('@/app/pages/PlanEditorPage').then((m) => ({ default: m.PlanEditorPage }))
);
const SessionEditorPage = lazy(() =>
  import('@/app/pages/SessionEditorPage').then((m) => ({ default: m.SessionEditorPage }))
);
const WorkoutPage = lazy(() =>
  import('@/app/pages/WorkoutPage').then((m) => ({ default: m.WorkoutPage }))
);
const HistoryPage = lazy(() =>
  import('@/app/pages/HistoryPage').then((m) => ({ default: m.HistoryPage }))
);
const ExercisesPage = lazy(() =>
  import('@/app/pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage }))
);
const ExerciseDeepDivePage = lazy(() =>
  import('@/app/pages/ExerciseDeepDivePage').then((m) => ({ default: m.ExerciseDeepDivePage }))
);
const MaxLogPage = lazy(() =>
  import('@/app/pages/MaxLogPage').then((m) => ({ default: m.MaxLogPage }))
);
const BodyMetricsPage = lazy(() =>
  import('@/app/pages/BodyMetricsPage').then((m) => ({ default: m.BodyMetricsPage }))
);
const AnalysisPage = lazy(() =>
  import('@/app/pages/AnalysisPage').then((m) => ({ default: m.AnalysisPage }))
);
const SettingsAdvancedPage = lazy(() =>
  import('@/app/pages/SettingsAdvancedPage').then((m) => ({ default: m.SettingsAdvancedPage }))
);
const ConflictResolutionPage = lazy(() =>
  import('@/app/pages/ConflictResolutionPage').then((m) => ({
    default: m.ConflictResolutionPage,
  }))
);

/**
 * Loading fallback component for lazy-loaded routes.
 */
function RouteLoadingFallback() {
  return (
    <div
      data-testid='route-loading'
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}
    >
      Loading...
    </div>
  );
}

/**
 * Wrapper component that applies page transition animations.
 */
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial='initial'
      animate='animate'
      exit='exit'
      variants={animations.pageTransition}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AppRoutes component.
 *
 * Defines all application routes with lazy loading and animated transitions.
 * Protected routes are wrapped in ProfileRequiredRoute guard.
 *
 * @returns The complete routing configuration
 */
export function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route
          path={ROUTES.onboarding.path}
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AnimatedPage>
                <WelcomePage />
              </AnimatedPage>
            </Suspense>
          }
        />

        {/* Protected Routes - Require Active Profile */}
        <Route element={<ProfileRequiredRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}
            <Route
              path={ROUTES.dashboard.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <DashboardPage />
                  </AnimatedPage>
                </Suspense>
              }
            />

            {/* Training Plans */}
            <Route
              path={ROUTES.trainingPlans.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <PlansPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
            <Route
              path={ROUTES.planEditor.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <PlanEditorPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
            <Route
              path={`${ROUTES.planEditor.path}/session/:sessionId`}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <SessionEditorPage />
                  </AnimatedPage>
                </Suspense>
              }
            />

            {/* Workouts */}
            <Route
              path={ROUTES.workouts.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <WorkoutPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
            <Route
              path={ROUTES.workoutHistory.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <HistoryPage />
                  </AnimatedPage>
                </Suspense>
              }
            />

            {/* Exercises */}
            <Route
              path={ROUTES.exercises.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <ExercisesPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
            <Route
              path={`${ROUTES.exercises.path}/:exerciseId`}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <ExerciseDeepDivePage />
                  </AnimatedPage>
                </Suspense>
              }
            />

            {/* Progress & Analytics */}
            <Route
              path={ROUTES.progress.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <AnalysisPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
            <Route
              path={ROUTES.maxLog.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <MaxLogPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
            <Route
              path={ROUTES.bodyMetrics.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <BodyMetricsPage />
                  </AnimatedPage>
                </Suspense>
              }
            />

            {/* Settings */}
            <Route
              path={ROUTES.settings.path}
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <SettingsAdvancedPage />
                  </AnimatedPage>
                </Suspense>
              }
            />

            {/* Conflict Resolution */}
            <Route
              path='/conflict-resolution'
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <AnimatedPage>
                    <ConflictResolutionPage />
                  </AnimatedPage>
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* Fallback - 404 */}
        <Route
          path='*'
          element={
            <AnimatedPage>
              <div>404 - Page Not Found</div>
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
