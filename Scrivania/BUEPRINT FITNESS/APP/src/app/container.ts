import 'reflect-metadata';

import { container, Lifecycle } from 'tsyringe';

// Manual imports for services (glob imports not working properly in all environments)
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
import { UserSettingsService } from '@/features/profile/services/UserSettingsService';
import { UserDetailsService } from '@/features/profile/services/UserDetailsService';

import { database } from './db/database';
import { ConsoleLogger } from './services/ConsoleLogger';

/**
 * Configures the dependency injection container for the application.
 * This function should be called once at application startup.
 * It uses Vite's glob import feature to automatically discover and register
 * all repositories, services, and handlers based on file naming conventions.
 * This eliminates the need for manual registration of each dependency.
 */
export function configureContainer(): void {
  // --- Manual & Special Registrations ---
  // Register the logger implementation against the interface token.
  container.register('ILogger', { useClass: ConsoleLogger });

  // Register the database instance
  container.register('BlueprintFitnessDB', { useValue: database });

  // --- Manual Service Registrations (fallback for glob import issues) ---
  container.registerSingleton(ProfileService);
  container.registerSingleton(UserSettingsService);
  container.registerSingleton(UserDetailsService);
  container.registerSingleton(BodyMetricsService);
  container.registerSingleton(ExerciseService);
  container.registerSingleton(MaxLogService);
  container.registerSingleton(TrainingPlanService);
  container.registerSingleton(WorkoutService);
  container.registerSingleton(AnalysisService);
  container.registerSingleton(DashboardService);
  container.registerSingleton(DataSyncService);
  container.registerSingleton(MaintenanceService);

  // --- Auto-register all Repositories ---
  // Convention: Files ending in *Repository.ts are registered with a token like 'IProfileRepository'.
  const repoModules = (import.meta as any).glob('../features/**/data/*Repository.ts', {
    eager: true,
  });
  for (const path in repoModules) {
    const module = repoModules[path] as Record<string, unknown>;
    for (const key in module) {
      const exported = module[key];
      if (typeof exported === 'function' && exported.name.endsWith('Repository')) {
        const tokenName = `I${exported.name}`;
        container.register(tokenName, { useClass: exported }, { lifecycle: Lifecycle.Singleton });
      }
    }
  }

  // --- Auto-register all Services ---
  // Convention: Files ending in *Service.ts are registered as singletons by their class name.
  const serviceModules = (import.meta as any).glob(
    ['../features/**/services/*Service.ts', './services/*Service.ts'],
    { eager: true }
  );
  for (const path in serviceModules) {
    const module = serviceModules[path] as Record<string, unknown>;
    for (const key in module) {
      const exported = module[key];
      if (typeof exported === 'function' && exported.name.endsWith('Service')) {
        container.registerSingleton(exported);
      }
    }
  }

  // --- Auto-register all Event Handlers ---
  // Convention: Files ending in *Handler.ts are registered as singletons.
  const handlerModules = (import.meta as any).glob('../features/**/handlers/*Handler.ts', {
    eager: true,
  });
  const handlerClasses: unknown[] = [];
  for (const path in handlerModules) {
    const module = handlerModules[path] as Record<string, unknown>;
    for (const key in module) {
      const exported = module[key];
      if (typeof exported === 'function' && exported.name.endsWith('Handler')) {
        container.registerSingleton(exported);
        handlerClasses.push(exported);
      }
    }
  }

  // --- Setup Event Subscriptions ---
  // This section resolves all event handlers and calls their setup method
  // to subscribe them to the domain event system. This must run last.
  for (const handlerClass of handlerClasses) {
    const handlerInstance = container.resolve(handlerClass);
    if (
      handlerInstance &&
      typeof (handlerInstance as Record<string, unknown>).setupSubscriptions === 'function'
    ) {
      (handlerInstance as Record<string, unknown>).setupSubscriptions();
    }
  }
}
