/**
 * @fileoverview Barrel file for domain event handlers.
 * Exports domain event handlers that work only with domain models and repository interfaces.
 * Application-level handlers that orchestrate services are in shared/application/events/handlers.
 */

export { DataImportCompletedHandler } from './DataImportCompletedHandler';
export { WorkoutFinishedPlanProgressionHandler } from './WorkoutFinishedPlanProgressionHandler';
