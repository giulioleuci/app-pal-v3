import { injectable } from 'tsyringe';

import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';

import { DomainEvents } from '../DomainEvents';
import { IHandle } from '../IHandle';
import { WorkoutFinishedEvent } from '../WorkoutFinishedEvent';

/**
 * Domain event handler that manages training plan progression when a workout is completed.
 * This handler automatically advances the current session index in a training plan
 * when a workout is finished, ensuring smooth progression through the plan.
 *
 * Located in the domain layer because it only depends on domain models and repository interfaces,
 * performing pure domain logic without orchestrating application services.
 */
@injectable()
export class WorkoutFinishedPlanProgressionHandler implements IHandle<WorkoutFinishedEvent> {
  constructor(private readonly trainingPlanRepository: ITrainingPlanRepository) {}

  /**
   * Sets up the subscription for WorkoutFinishedEvent.
   * This method is called at application startup to register the handler.
   * @param event The event instance for type inference.
   */
  setupSubscriptions(event?: WorkoutFinishedEvent): void {
    DomainEvents.register(
      (event: WorkoutFinishedEvent) => this.handle(event),
      WorkoutFinishedEvent.name
    );
  }

  /**
   * Handles the workout finished event by advancing the training plan progression.
   * @param event The workout finished event containing the workout log.
   */
  private async handle(event: WorkoutFinishedEvent): Promise<void> {
    try {
      // Only process if the workout has an associated training plan
      if (!event.log.trainingPlanId) {
        return;
      }

      const plan = await this.trainingPlanRepository.findById(event.log.trainingPlanId);
      if (!plan) {
        return;
      }

      // Advance to next session in the plan
      const updatedPlan = plan.cloneWithProgressedSession();
      await this.trainingPlanRepository.save(updatedPlan);
    } catch (_error) {
      // Don't rethrow - event handlers should not break the main flow
      console.error('Failed to handle workout finished event for plan progression', error, {
        workoutLogId: event.log.id,
        trainingPlanId: event.log.trainingPlanId,
      });
    }
  }
}
