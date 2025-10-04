import { Q } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import type { Database } from '@/app/db';
import type { ILogger } from '@/app/services/ILogger';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

import type { AdvancedSetExecutionSession } from '../store/advancedSetExecutionStore';

/**
 * Interface for persisting advanced set execution state
 */
export interface IAdvancedSetStatePersistence {
  /**
   * Saves the state of an advanced set execution session to persistent storage
   * @param session The execution session to save
   * @returns Result indicating success or failure
   */
  saveSession(session: AdvancedSetExecutionSession): Promise<Result<void, ApplicationError>>;

  /**
   * Loads a saved advanced set execution session from persistent storage
   * @param sessionId The ID of the session to load
   * @returns Result containing the session or null if not found
   */
  loadSession(
    sessionId: string
  ): Promise<Result<AdvancedSetExecutionSession | null, ApplicationError>>;

  /**
   * Loads all saved advanced set execution sessions for a profile
   * @param profileId The profile ID to load sessions for
   * @returns Result containing an array of sessions
   */
  loadSessionsForProfile(
    profileId: string
  ): Promise<Result<AdvancedSetExecutionSession[], ApplicationError>>;

  /**
   * Loads all saved advanced set execution sessions for a workout
   * @param workoutLogId The workout log ID to load sessions for
   * @returns Result containing an array of sessions
   */
  loadSessionsForWorkout(
    workoutLogId: string
  ): Promise<Result<AdvancedSetExecutionSession[], ApplicationError>>;

  /**
   * Deletes a saved advanced set execution session
   * @param sessionId The ID of the session to delete
   * @returns Result indicating success or failure
   */
  deleteSession(sessionId: string): Promise<Result<void, ApplicationError>>;

  /**
   * Deletes all sessions older than the specified timestamp
   * @param olderThan Timestamp in milliseconds
   * @returns Result indicating success or failure
   */
  deleteExpiredSessions(olderThan: number): Promise<Result<void, ApplicationError>>;

  /**
   * Clears all saved advanced set execution sessions for a profile
   * @param profileId The profile ID to clear sessions for
   * @returns Result indicating success or failure
   */
  clearSessionsForProfile(profileId: string): Promise<Result<void, ApplicationError>>;
}

/**
 * WatermelonDB implementation of advanced set state persistence.
 *
 * This service handles the persistence of advanced set execution state to the local
 * WatermelonDB database, allowing sessions to survive app restarts and crashes.
 * It stores the execution state as JSON in a dedicated table for advanced set sessions.
 */
@injectable()
export class WatermelonAdvancedSetStatePersistence implements IAdvancedSetStatePersistence {
  constructor(
    @inject('BlueprintFitnessDB') private readonly database: Database,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  async saveSession(session: AdvancedSetExecutionSession): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.debug('Saving advanced set execution session', {
        sessionId: session.id,
        setType: session.setType,
        profileId: session.profileId,
      });

      await this.database.write(async () => {
        const existingRecord = await this.database
          .get('advanced_set_sessions')
          .find(session.id)
          .catch(() => null);

        if (existingRecord) {
          // Update existing record
          await existingRecord.update((record: any) => {
            record.sessionData = JSON.stringify(session);
            record.updatedAt = new Date(session.metadata.updatedAt);
          });
        } else {
          // Create new record
          await this.database.get('advanced_set_sessions').create((record: any) => {
            record._raw.id = session.id;
            record.profileId = session.profileId;
            record.workoutLogId = session.workoutLogId;
            record.exerciseId = session.exerciseId;
            record.setType = session.setType;
            record.sessionData = JSON.stringify(session);
            record.createdAt = new Date(session.metadata.createdAt);
            record.updatedAt = new Date(session.metadata.updatedAt);
            record.lastActiveAt = new Date(session.metadata.lastActiveAt);
          });
        }
      });

      this.logger.debug('Advanced set execution session saved successfully', {
        sessionId: session.id,
      });

      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to save advanced set execution session', _error as Error, {
        sessionId: session.id,
        setType: session.setType,
      });
      return Result.failure(
        new ApplicationError('Failed to save advanced set execution session', _error)
      );
    }
  }

  async loadSession(
    sessionId: string
  ): Promise<Result<AdvancedSetExecutionSession | null, ApplicationError>> {
    try {
      this.logger.debug('Loading advanced set execution session', { sessionId });

      const record = await this.database
        .get('advanced_set_sessions')
        .find(sessionId)
        .catch(() => null);

      if (!record) {
        return Result.success(null);
      }

      const session = JSON.parse((record as any).sessionData) as AdvancedSetExecutionSession;

      this.logger.debug('Advanced set execution session loaded successfully', {
        sessionId,
        setType: session.setType,
      });

      return Result.success(session);
    } catch (_error) {
      this.logger.error('Failed to load advanced set execution session', _error as Error, {
        sessionId,
      });
      return Result.failure(
        new ApplicationError('Failed to load advanced set execution session', _error)
      );
    }
  }

  async loadSessionsForProfile(
    profileId: string
  ): Promise<Result<AdvancedSetExecutionSession[], ApplicationError>> {
    try {
      this.logger.debug('Loading advanced set execution sessions for profile', { profileId });

      const records = await this.database
        .get('advanced_set_sessions')
        .query(Q.where('profile_id', profileId))
        .fetch();

      const sessions = records.map(
        (record) => JSON.parse((record as any).sessionData) as AdvancedSetExecutionSession
      );

      this.logger.debug('Advanced set execution sessions loaded for profile', {
        profileId,
        sessionCount: sessions.length,
      });

      return Result.success(sessions);
    } catch (_error) {
      this.logger.error(
        'Failed to load advanced set execution sessions for profile',
        error as Error,
        {
          profileId,
        }
      );
      return Result.failure(
        new ApplicationError('Failed to load advanced set execution sessions for profile', _error)
      );
    }
  }

  async loadSessionsForWorkout(
    workoutLogId: string
  ): Promise<Result<AdvancedSetExecutionSession[], ApplicationError>> {
    try {
      this.logger.debug('Loading advanced set execution sessions for workout', { workoutLogId });

      const records = await this.database
        .get('advanced_set_sessions')
        .query(Q.where('workout_log_id', workoutLogId))
        .fetch();

      const sessions = records.map(
        (record) => JSON.parse((record as any).sessionData) as AdvancedSetExecutionSession
      );

      this.logger.debug('Advanced set execution sessions loaded for workout', {
        workoutLogId,
        sessionCount: sessions.length,
      });

      return Result.success(sessions);
    } catch (_error) {
      this.logger.error(
        'Failed to load advanced set execution sessions for workout',
        error as Error,
        {
          workoutLogId,
        }
      );
      return Result.failure(
        new ApplicationError('Failed to load advanced set execution sessions for workout', _error)
      );
    }
  }

  async deleteSession(sessionId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.debug('Deleting advanced set execution session', { sessionId });

      await this.database.write(async () => {
        const record = await this.database
          .get('advanced_set_sessions')
          .find(sessionId)
          .catch(() => null);

        if (record) {
          await record.destroyPermanently();
        }
      });

      this.logger.debug('Advanced set execution session deleted successfully', { sessionId });

      return Result.success(undefined);
    } catch (_error) {
      this.logger.error('Failed to delete advanced set execution session', _error as Error, {
        sessionId,
      });
      return Result.failure(
        new ApplicationError('Failed to delete advanced set execution session', _error)
      );
    }
  }

  async deleteExpiredSessions(olderThan: number): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.debug('Deleting expired advanced set execution sessions', { olderThan });

      await this.database.write(async () => {
        const records = await this.database
          .get('advanced_set_sessions')
          .query(Q.where('last_active_at', Q.lt(olderThan)))
          .fetch();

        for (const record of records) {
          await record.destroyPermanently();
        }
      });

      this.logger.debug('Expired advanced set execution sessions deleted successfully', {
        olderThan,
      });

      return Result.success(undefined);
    } catch (_error) {
      this.logger.error(
        'Failed to delete expired advanced set execution sessions',
        error as Error,
        {
          olderThan,
        }
      );
      return Result.failure(
        new ApplicationError('Failed to delete expired advanced set execution sessions', _error)
      );
    }
  }

  async clearSessionsForProfile(profileId: string): Promise<Result<void, ApplicationError>> {
    try {
      this.logger.debug('Clearing advanced set execution sessions for profile', { profileId });

      await this.database.write(async () => {
        const records = await this.database
          .get('advanced_set_sessions')
          .query(Q.where('profile_id', profileId))
          .fetch();

        for (const record of records) {
          await record.destroyPermanently();
        }
      });

      this.logger.debug('Advanced set execution sessions cleared for profile', { profileId });

      return Result.success(undefined);
    } catch (_error) {
      this.logger.error(
        'Failed to clear advanced set execution sessions for profile',
        error as Error,
        {
          profileId,
        }
      );
      return Result.failure(
        new ApplicationError('Failed to clear advanced set execution sessions for profile', _error)
      );
    }
  }
}
