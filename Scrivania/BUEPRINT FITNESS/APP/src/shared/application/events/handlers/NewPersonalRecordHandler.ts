import { injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { AnalysisService } from '@/features/analysis/services/AnalysisService';
import { DomainEvents } from '@/shared/domain/events/DomainEvents';
import { IHandle } from '@/shared/domain/events/IHandle';
import { NewPersonalRecordEvent } from '@/shared/domain/events/NewPersonalRecordEvent';

/**
 * Application layer event handler that manages actions triggered when a new personal record is achieved.
 * This handler can trigger analysis updates, notifications, and achievement tracking
 * when a user sets a new personal best in any exercise.
 *
 * Located in the application layer because it orchestrates application services
 * to fulfill complex business workflows spanning multiple bounded contexts.
 */
@injectable()
export class NewPersonalRecordHandler implements IHandle<NewPersonalRecordEvent> {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly logger: ILogger
  ) {}

  /**
   * Sets up the subscription for NewPersonalRecordEvent.
   * This method is called at application startup to register the handler.
   * @param event The event instance for type inference.
   */
  setupSubscriptions(event?: NewPersonalRecordEvent): void {
    DomainEvents.register(
      (event: NewPersonalRecordEvent) => this.handle(event),
      NewPersonalRecordEvent.name
    );
  }

  /**
   * Handles the new personal record event by triggering analysis updates.
   * @param event The new personal record event containing the max log.
   */
  private async handle(event: NewPersonalRecordEvent): Promise<void> {
    try {
      this.logger.info('Handling new personal record event', {
        maxLogId: event.maxLog.id,
        profileId: event.maxLog.profileId,
        exerciseId: event.maxLog.exerciseId,
        oneRepMax: event.maxLog.oneRepMax,
      });

      // Trigger analysis recalculation for the affected exercise
      await this.triggerAnalysisUpdate(event.maxLog.profileId, event.maxLog.exerciseId);

      // Log achievement details
      await this.logPersonalRecordAchievement(event);

      this.logger.info('Personal record handling completed successfully', {
        maxLogId: event.maxLog.id,
        profileId: event.maxLog.profileId,
      });
    } catch (_error) {
      this.logger.error('Failed to handle new personal record event', _error as Error, {
        maxLogId: event.maxLog.id,
        profileId: event.maxLog.profileId,
      });
      // Don't rethrow - event handlers should not break the main flow
    }
  }

  /**
   * Triggers analysis update for the exercise that achieved a new personal record.
   * @param profileId The profile ID
   * @param exerciseId The exercise ID that achieved the new record
   */
  private async triggerAnalysisUpdate(profileId: string, exerciseId: string): Promise<void> {
    this.logger.info('Triggering analysis update for new personal record', {
      profileId,
      exerciseId,
    });

    try {
      // Generate fresh analysis data for the exercise
      const analysisResult = await this.analysisService.generateAnalysis(profileId, exerciseId);

      if (analysisResult.success) {
        this.logger.info('Analysis updated successfully for new personal record', {
          profileId,
          exerciseId,
          analysisId: analysisResult.data.id,
        });
      } else {
        this.logger.warn('Failed to update analysis for new personal record', {
          profileId,
          exerciseId,
          error: analysisResult.error.message,
        });
      }
    } catch (_error) {
      this.logger.error('Error during analysis update for personal record', _error as Error, {
        profileId,
        exerciseId,
      });
    }
  }

  /**
   * Logs personal record achievement details for potential future use.
   * @param event The new personal record event
   */
  private async logPersonalRecordAchievement(event: NewPersonalRecordEvent): Promise<void> {
    // Log the achievement with structured data for potential analytics
    this.logger.info('Personal record achievement logged', {
      achievement: 'new_personal_record',
      profileId: event.maxLog.profileId,
      exerciseId: event.maxLog.exerciseId,
      oneRepMax: event.maxLog.oneRepMax,
      weight: event.maxLog.weight,
      reps: event.maxLog.reps,
      achievedAt: event.dateTimeOccurred,
      maxLogId: event.maxLog.id,
    });

    // Placeholder for future features:
    // - Send achievement notification to user
    // - Update achievement/badge system
    // - Trigger social sharing options
    // - Update user statistics dashboard
    // - Send congratulatory message
  }
}
