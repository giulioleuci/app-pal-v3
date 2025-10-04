import React, { createContext, useContext } from 'react';
import { container } from 'tsyringe';

import { configureContainer } from '@/app/container';
import { ProfileService } from '@/features/profile/services/ProfileService';
import { BodyMetricsService } from '@/features/body-metrics/services/BodyMetricsService';
import { ExerciseService } from '@/features/exercise/services/ExerciseService';
import { MaxLogService } from '@/features/max-log/services/MaxLogService';
import { TrainingPlanService } from '@/features/training-plan/services/TrainingPlanService';
import { WorkoutService } from '@/features/workout/services/WorkoutService';
import { AnalysisService } from '@/features/analysis/services/AnalysisService';
import { DashboardService } from '@/features/dashboard/services/DashboardService';
import { DataSyncService } from '@/features/data-sync/services/DataSyncService';
import { MaintenanceService } from '@/features/maintenance/services/MaintenanceService';

/**
 * Application services container interface
 *
 * This interface defines the shape of all available application services.
 * The actual service instances are resolved from the DI container at runtime.
 */
interface AppServices {
  profileService: ProfileService;
  bodyMetricsService: BodyMetricsService;
  exerciseService: ExerciseService;
  maxLogService: MaxLogService;
  trainingPlanService: TrainingPlanService;
  workoutService: WorkoutService;
  analysisService: AnalysisService;
  dashboardService: DashboardService;
  dataSyncService: DataSyncService;
  maintenanceService: MaintenanceService;
}

const AppServicesContext = createContext<AppServices | null>(null);

/**
 * Props for the AppServicesProvider component
 */
interface AppServicesProviderProps {
  children: React.ReactNode;
}

/**
 * React provider that resolves and provides all application services from the DI container.
 *
 * This provider configures the dependency injection container on first render and
 * resolves all application services, making them available to the entire component tree
 * through the useAppServices hook. This ensures proper service lifecycle management
 * and dependency injection throughout the React application.
 */
export function AppServicesProvider({ children }: AppServicesProviderProps) {
  const [services] = React.useState<AppServices>(() => {
    // Configure the DI container on first render
    configureContainer();

    // Resolve all services from the container by their class references
    return {
      profileService: container.resolve(ProfileService),
      bodyMetricsService: container.resolve(BodyMetricsService),
      exerciseService: container.resolve(ExerciseService),
      maxLogService: container.resolve(MaxLogService),
      trainingPlanService: container.resolve(TrainingPlanService),
      workoutService: container.resolve(WorkoutService),
      analysisService: container.resolve(AnalysisService),
      dashboardService: container.resolve(DashboardService),
      dataSyncService: container.resolve(DataSyncService),
      maintenanceService: container.resolve(MaintenanceService),
    };
  });

  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}

/**
 * Hook to access application services from the DI container.
 *
 * @throws {Error} If used outside of AppServicesProvider
 * @returns All application services resolved from the DI container
 */
export function useAppServices(): AppServices {
  const context = useContext(AppServicesContext);

  if (!context) {
    throw new Error('useAppServices must be used within an AppServicesProvider');
  }

  return context;
}
