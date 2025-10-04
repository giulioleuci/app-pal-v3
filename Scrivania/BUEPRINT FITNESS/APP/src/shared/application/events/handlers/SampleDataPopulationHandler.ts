import { injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { ExerciseService } from '@/features/exercise/services/ExerciseService';
import { AppliedExerciseModel } from '@/features/training-plan/domain/AppliedExerciseModel';
import { TrainingPlanBuilder } from '@/features/training-plan/domain/builders/TrainingPlanBuilder';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { generateId } from '@/lib';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { IHandle } from '@/shared/domain/events/IHandle';
import { ProfileCreatedEvent } from '@/shared/domain/events/ProfileCreatedEvent';
import { type AppliedExerciseData } from '@/shared/types';

/**
 * Application layer event handler that populates new profiles with sample training data.
 * This handler automatically creates a basic training plan with common exercises
 * when a new profile is created, providing users with an example to get started.
 *
 * Located in the application layer because it orchestrates multiple services
 * and repositories to fulfill complex business workflows.
 */
@injectable()
export class SampleDataPopulationHandler implements IHandle<ProfileCreatedEvent> {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Sets up the subscription for ProfileCreatedEvent.
   * This method is called at application startup to register the handler.
   * @param event The event instance for type inference.
   */
  setupSubscriptions(event?: ProfileCreatedEvent): void {
    DomainEvents.register(
      (event: ProfileCreatedEvent) => this.handle(event),
      ProfileCreatedEvent.name
    );
  }

  /**
   * Handles the profile created event by populating sample training data.
   * @param event The profile created event containing the new profile.
   */
  private async handle(event: ProfileCreatedEvent): Promise<void> {
    try {
      this.logger.info('Handling profile created event for sample data population', {
        profileId: event.profile.id,
        profileName: event.profile.name,
      });

      // Create sample exercises
      const sampleExercises = await this.createSampleExercises(event.profile.id);

      // Create sample training plan with the exercises
      await this.createSampleTrainingPlan(event.profile.id, sampleExercises);

      this.logger.info('Sample data population completed successfully', {
        profileId: event.profile.id,
        exerciseCount: sampleExercises.length,
      });
    } catch (_error) {
      this.logger.error('Failed to populate sample data for new profile', _error as Error, {
        profileId: event.profile.id,
      });
      // Don't rethrow - event handlers should not break the main flow
    }
  }

  /**
   * Creates sample exercises for the new profile.
   * @param profileId The ID of the profile to create exercises for
   * @returns Array of created exercise IDs
   */
  private async createSampleExercises(profileId: string): Promise<string[]> {
    const sampleExerciseData = [
      {
        profileId,
        name: 'Push-ups',
        category: 'chest',
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        equipment: null,
        instructions: 'Standard push-up exercise',
        notes: 'Sample exercise for demonstration',
      },
      {
        profileId,
        name: 'Squats',
        category: 'legs',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: null,
        instructions: 'Bodyweight squats',
        notes: 'Sample exercise for demonstration',
      },
      {
        profileId,
        name: 'Plank',
        category: 'core',
        muscleGroups: ['core', 'shoulders'],
        equipment: null,
        instructions: 'Hold plank position',
        notes: 'Sample exercise for demonstration',
      },
    ];

    const createdExerciseIds: string[] = [];

    for (const exerciseData of sampleExerciseData) {
      const result = await this.exerciseService.createExercise(exerciseData);
      if (result.success) {
        createdExerciseIds.push(result.data.id);
      } else {
        this.logger.warn('Failed to create sample exercise', {
          profileId,
          exerciseName: exerciseData.name,
          error: result.error.message,
        });
      }
    }

    return createdExerciseIds;
  }

  /**
   * Creates a sample training plan with the provided exercises.
   * @param profileId The ID of the profile to create the plan for
   * @param exerciseIds The IDs of exercises to include in the plan
   */
  private async createSampleTrainingPlan(profileId: string, exerciseIds: string[]): Promise<void> {
    if (exerciseIds.length === 0) {
      this.logger.warn('No sample exercises available for training plan creation', { profileId });
      return;
    }

    const now = new Date();
    const planData = {
      id: generateId(),
      profileId,
      name: 'Sample Training Plan',
      description: 'A basic training plan to get you started',
      sessionIds: [],
      isArchived: false,
      currentSessionIndex: 0,
      cycleId: null,
      createdAt: now,
      updatedAt: now,
    };

    const initialPlan = TrainingPlanModel.hydrate(planData, []);
    const builder = new TrainingPlanBuilder(initialPlan);

    // Create applied exercises for the sample exercises
    const appliedExercises = exerciseIds.slice(0, 3).map((exerciseId, index) => {
      const appliedExerciseData: AppliedExerciseData = {
        id: generateId(),
        profileId,
        exerciseId,
        setConfiguration: {
          type: 'standard',
          sets: 3,
          reps: { min: 8, max: 12 },
          weight: null,
          restPeriod: 60,
        },
        substitutions: [],
        notes: 'Sample applied exercise',
        createdAt: now,
        updatedAt: now,
      };
      return AppliedExerciseModel.hydrate(appliedExerciseData);
    });

    // Build the training plan with sample sessions
    const completePlan = builder
      .addSession('Full Body Workout')
      .addExerciseToCurrentSession(appliedExercises[0])
      .addExerciseToCurrentSession(appliedExercises[1])
      .addExerciseToCurrentSession(appliedExercises[2])
      .build();

    await this.trainingPlanRepository.save(completePlan);

    this.logger.info('Sample training plan created successfully', {
      profileId,
      planId: completePlan.id,
      sessionCount: completePlan.sessions.length,
    });
  }
}
