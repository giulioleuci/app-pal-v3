import { Database } from '@nozbe/watermelondb';
import { inject, injectable } from 'tsyringe';

import { database } from '@/app/db/database';
import { ILogger } from '@/app/services/ILogger';
import { IBodyMetricsRepository } from '@/features/body-metrics/domain/IBodyMetricsRepository';
import { ExerciseModel } from '@/features/exercise/domain/ExerciseModel';
import { ExerciseTemplateModel } from '@/features/exercise/domain/ExerciseTemplateModel';
import { IExerciseRepository } from '@/features/exercise/domain/IExerciseRepository';
import { IExerciseTemplateRepository } from '@/features/exercise/domain/IExerciseTemplateRepository';
import { IMaxLogRepository } from '@/features/max-log/domain/IMaxLogRepository';
import { MaxLogModel } from '@/features/max-log/domain/MaxLogModel';
import { IProfileRepository } from '@/features/profile/domain/IProfileRepository';
import { ProfileModel } from '@/features/profile/domain/ProfileModel';
import { ITrainingPlanRepository } from '@/features/training-plan/domain/ITrainingPlanRepository';
import { TrainingPlanModel } from '@/features/training-plan/domain/TrainingPlanModel';
import { IWorkoutLogRepository } from '@/features/workout/domain/IWorkoutLogRepository';
import { WorkoutLogModel } from '@/features/workout/domain/WorkoutLogModel';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { ConflictError } from '@/shared/errors/ConflictError';
import { Result } from '@/shared/utils/Result';

/**
 * Represents the status of a data export operation.
 */
export interface ExportStatus {
  totalRecords: number;
  processedRecords: number;
  isComplete: boolean;
  errors: string[];
}

/**
 * Represents the status of a data import operation.
 */
export interface ImportStatus {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  isComplete: boolean;
  errors: string[];
}

/**
 * Represents data to be exported or imported.
 */
export interface ExportData {
  profiles: any[];
  exercises: any[];
  exerciseTemplates: any[];
  trainingPlans: any[];
  workoutLogs: any[];
  maxLogs: any[];
  bodyMetrics: any[];
  exportedAt: Date;
  version: string;
}

/**
 * Service responsible for data synchronization operations including import and export.
 * Implements chunking techniques for long-running operations to prevent UI freezing.
 * This service handles bulk operations across multiple domains.
 */
@injectable()
export class DataSyncService {
  private readonly CHUNK_SIZE = 100;
  private readonly EXPORT_VERSION = '1.0.0';

  constructor(
    @inject('IProfileRepository') private readonly profileRepository: IProfileRepository,
    @inject('IExerciseRepository') private readonly exerciseRepository: IExerciseRepository,
    @inject('IExerciseTemplateRepository')
    private readonly exerciseTemplateRepository: IExerciseTemplateRepository,
    @inject('ITrainingPlanRepository')
    private readonly trainingPlanRepository: ITrainingPlanRepository,
    @inject('IWorkoutLogRepository') private readonly workoutLogRepository: IWorkoutLogRepository,
    @inject('IMaxLogRepository') private readonly maxLogRepository: IMaxLogRepository,
    @inject('IBodyMetricsRepository')
    private readonly bodyMetricsRepository: IBodyMetricsRepository,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('BlueprintFitnessDB') private readonly database: Database
  ) {}

  /**
   * Exports all user data to a structured format.
   * Uses chunking to prevent UI blocking during large exports.
   * @param profileId The profile ID to export data for
   * @param onProgress Optional callback for progress updates
   * @returns Result containing export data or an error
   */
  async exportData(
    profileId: string,
    onProgress?: (status: ExportStatus) => void
  ): Promise<Result<ExportData, ApplicationError>> {
    try {
      this.logger.info('Starting data export', { profileId });

      const exportData: ExportData = {
        profiles: [],
        exercises: [],
        exerciseTemplates: [],
        trainingPlans: [],
        workoutLogs: [],
        maxLogs: [],
        bodyMetrics: [],
        exportedAt: new Date(),
        version: this.EXPORT_VERSION,
      };

      const status: ExportStatus = {
        totalRecords: 0,
        processedRecords: 0,
        isComplete: false,
        errors: [],
      };

      // Calculate total records for progress tracking
      const [
        profiles,
        exercises,
        exerciseTemplates,
        trainingPlans,
        workoutLogs,
        maxLogs,
        weightRecords,
        heightRecords,
      ] = await Promise.all([
        this.profileRepository.findById(profileId).then((p) => (p ? [p] : [])),
        this.exerciseRepository.findAll(profileId),
        this.exerciseTemplateRepository.findAll(profileId),
        this.trainingPlanRepository.findAll(profileId),
        this.workoutLogRepository.findAll(profileId),
        this.maxLogRepository.findAll(profileId),
        this.bodyMetricsRepository.findWeightHistory(profileId),
        this.bodyMetricsRepository.findHeightHistory(profileId),
      ]);

      status.totalRecords =
        profiles.length +
        exercises.length +
        exerciseTemplates.length +
        trainingPlans.length +
        workoutLogs.length +
        maxLogs.length +
        weightRecords.length +
        heightRecords.length;

      // Export data in chunks to prevent blocking
      await this.exportChunked(exportData, 'profiles', profiles, status, onProgress);
      await this.exportChunked(exportData, 'exercises', exercises, status, onProgress);
      await this.exportChunked(
        exportData,
        'exerciseTemplates',
        exerciseTemplates,
        status,
        onProgress
      );
      await this.exportChunked(exportData, 'trainingPlans', trainingPlans, status, onProgress);
      await this.exportChunked(exportData, 'workoutLogs', workoutLogs, status, onProgress);
      await this.exportChunked(exportData, 'maxLogs', maxLogs, status, onProgress);

      // Combine body metrics
      const bodyMetrics = [...weightRecords, ...heightRecords];
      await this.exportChunked(exportData, 'bodyMetrics', bodyMetrics, status, onProgress);

      status.isComplete = true;
      onProgress?.(status);

      this.logger.info('Data export completed successfully', {
        profileId,
        totalRecords: status.totalRecords,
        errors: status.errors.length,
      });

      return Result.success(exportData);
    } catch (_error) {
      this.logger.error('Failed to export data', _error as Error, { profileId });
      return Result.failure(new ApplicationError('Failed to export data', _error));
    }
  }

  /**
   * Imports data from an export file.
   * Uses chunking to prevent UI blocking during large imports.
   * @param importData The data to import
   * @param onProgress Optional callback for progress updates
   * @returns Result containing import status or an error
   */
  async importData(
    importData: ExportData,
    onProgress?: (status: ImportStatus) => void
  ): Promise<Result<ImportStatus, ApplicationError>> {
    try {
      this.logger.info('Starting data import', {
        version: importData.version,
        totalRecords: this.getTotalRecordsCount(importData),
      });

      const status: ImportStatus = {
        totalRecords: this.getTotalRecordsCount(importData),
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        isComplete: false,
        errors: [],
      };

      // Validate import data version compatibility
      if (!this.isCompatibleVersion(importData.version)) {
        const errorMsg = `Incompatible data version: ${importData.version}. Expected: ${this.EXPORT_VERSION}`;
        status.errors.push(errorMsg);
        this.logger.warn('Import version mismatch', {
          importVersion: importData.version,
          supportedVersion: this.EXPORT_VERSION,
        });
        // Continue with import but log the warning
      }

      // Import data in dependency order and chunks
      await this.importChunked(
        'profiles',
        importData.profiles,
        this.profileRepository,
        status,
        onProgress
      );
      await this.importChunked(
        'exercises',
        importData.exercises,
        this.exerciseRepository,
        status,
        onProgress
      );
      await this.importChunked(
        'exerciseTemplates',
        importData.exerciseTemplates,
        this.exerciseTemplateRepository,
        status,
        onProgress
      );
      await this.importChunked(
        'trainingPlans',
        importData.trainingPlans,
        this.trainingPlanRepository,
        status,
        onProgress
      );
      await this.importChunked(
        'workoutLogs',
        importData.workoutLogs,
        this.workoutLogRepository,
        status,
        onProgress
      );
      await this.importChunked(
        'maxLogs',
        importData.maxLogs,
        this.maxLogRepository,
        status,
        onProgress
      );

      // Body metrics require special handling
      await this.importBodyMetricsChunked(importData.bodyMetrics, status, onProgress);

      status.isComplete = true;
      onProgress?.(status);

      this.logger.info('Data import completed', {
        totalRecords: status.totalRecords,
        successfulRecords: status.successfulRecords,
        failedRecords: status.failedRecords,
        errors: status.errors.length,
      });

      // Check if we should treat this as a conflict error
      // If 50% or more of records failed, consider it a conflict scenario
      const failureRate = status.totalRecords > 0 ? status.failedRecords / status.totalRecords : 0;
      if (failureRate >= 0.5 && status.failedRecords > 0) {
        const conflictError = new ConflictError('import.conflicts.detected' as any);
        // Add conflicts info as a custom property for debugging (not part of the base ConflictError interface)
        (conflictError as any).conflicts = status.errors.map((error, index) => ({
          message: error,
          type: 'import_failure',
          index,
        }));
        return Result.failure(conflictError);
      }

      return Result.success(status);
    } catch (_error) {
      this.logger.error('Failed to import data', _error as Error);
      return Result.failure(new ApplicationError('Failed to import data', _error));
    }
  }

  /**
   * Exports data in chunks to prevent blocking.
   * @private
   */
  private async exportChunked<T>(
    exportData: ExportData,
    key: keyof ExportData,
    data: T[],
    status: ExportStatus,
    onProgress?: (status: ExportStatus) => void
  ): Promise<void> {
    if (key === 'exportedAt' || key === 'version') {
      return; // Skip metadata fields
    }

    const chunks = this.chunkArray(data, this.CHUNK_SIZE);

    for (const chunk of chunks) {
      try {
        // Simulate processing time and allow UI updates
        await this.sleep(10);

        (exportData[key] as any[]).push(...chunk);
        status.processedRecords += chunk.length;

        onProgress?.(status);
      } catch (_error) {
        const errorMsg = `Failed to export ${key} chunk: ${_error}`;
        status.errors.push(errorMsg);
        this.logger.error(`Export chunk failed for ${key}`, error as Error);
      }
    }
  }

  /**
   * Imports data in chunks to prevent blocking.
   * @private
   */
  private async importChunked<T>(
    entityType: string,
    data: T[],
    repository: any,
    status: ImportStatus,
    onProgress?: (status: ImportStatus) => void
  ): Promise<void> {
    const chunks = this.chunkArray(data, this.CHUNK_SIZE);

    for (const chunk of chunks) {
      try {
        // Use a single database.write() transaction for the entire chunk
        await this.database.write(async () => {
          for (const item of chunk) {
            try {
              // Hydrate plain objects to domain models
              const domainModel = this.hydrateDomainModel(entityType, item);

              // Save the item using the repository's internal logic but within this transaction
              await this.saveItemInTransaction(entityType, domainModel);
              status.successfulRecords++;
            } catch (_error) {
              status.failedRecords++;
              const errorMsg = `Failed to import ${entityType} record: ${error}`;
              status.errors.push(errorMsg);
              this.logger.error(`Import record failed for ${entityType}`, error as Error, {
                record: item,
              });
            }
            status.processedRecords++;
          }
        });

        // Update progress after each chunk
        onProgress?.(status);

        // Allow UI updates between chunks
        await this.sleep(5);
      } catch (_error) {
        // If the entire chunk fails, mark all items as failed
        for (const item of chunk) {
          status.failedRecords++;
          status.processedRecords++;
          const errorMsg = `Failed to import ${entityType} chunk: ${error}`;
          status.errors.push(errorMsg);
        }
        this.logger.error(`Import chunk failed for ${entityType}`, error as Error);
        onProgress?.(status);
      }
    }
  }

  /**
   * Imports body metrics data which requires special handling.
   * @private
   */
  private async importBodyMetricsChunked(
    data: any[],
    status: ImportStatus,
    onProgress?: (status: ImportStatus) => void
  ): Promise<void> {
    const chunks = this.chunkArray(data, this.CHUNK_SIZE);

    for (const chunk of chunks) {
      for (const item of chunk) {
        try {
          await this.sleep(5);

          // Route to appropriate repository based on record type
          if (item.weight !== undefined) {
            await this.bodyMetricsRepository.saveWeight(item);
          } else if (item.height !== undefined) {
            await this.bodyMetricsRepository.saveHeight(item);
          } else {
            throw new Error('Unknown body metrics record type');
          }

          status.successfulRecords++;
        } catch (_error) {
          status.failedRecords++;
          const errorMsg = `Failed to import body metrics record: ${error}`;
          status.errors.push(errorMsg);
          this.logger.error('Import body metrics record failed', error as Error, { record: item });
        }

        status.processedRecords++;
        onProgress?.(status);
      }
    }
  }

  /**
   * Calculates total number of records in import data.
   * @private
   */
  private getTotalRecordsCount(importData: ExportData): number {
    return (
      importData.profiles.length +
      importData.exercises.length +
      importData.exerciseTemplates.length +
      importData.trainingPlans.length +
      importData.workoutLogs.length +
      importData.maxLogs.length +
      importData.bodyMetrics.length
    );
  }

  /**
   * Checks if import data version is compatible.
   * @private
   */
  private isCompatibleVersion(version: string): boolean {
    // For now, only support exact version match
    // Future versions could implement backward compatibility logic
    return version === this.EXPORT_VERSION;
  }

  /**
   * Splits an array into chunks of specified size.
   * @private
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Creates a delay to allow UI updates during processing.
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Saves an item directly to the database within an existing transaction.
   * This method bypasses repository.save() to avoid nested database.write() calls.
   * @private
   */
  private async saveItemInTransaction(entityType: string, domainModel: any): Promise<void> {
    const plainData = domainModel.toPlainObject();

    switch (entityType) {
      case 'profiles': {
        const collection = this.database.get('profiles');
        try {
          const existing = await collection.find(domainModel.id);
          await existing.update((record: any) => {
            record._raw.name = plainData.name;
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        } catch (_error) {
          await collection.create((record: any) => {
            record._raw.id = plainData.id;
            record._raw.name = plainData.name;
            record._raw.created_at = plainData.createdAt.getTime();
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        }
        break;
      }
      case 'exercises': {
        const collection = this.database.get('exercises');
        try {
          const existing = await collection.find(domainModel.id);
          await existing.update((record: any) => {
            record._raw.profile_id = plainData.profileId;
            record._raw.name = plainData.name;
            record._raw.muscle_groups = JSON.stringify(plainData.muscleGroups);
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        } catch (_error) {
          await collection.create((record: any) => {
            record._raw.id = plainData.id;
            record._raw.profile_id = plainData.profileId;
            record._raw.name = plainData.name;
            record._raw.muscle_groups = JSON.stringify(plainData.muscleGroups);
            record._raw.created_at = plainData.createdAt.getTime();
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        }
        break;
      }
      case 'maxLogs': {
        const collection = this.database.get('max_logs');
        try {
          const existing = await collection.find(domainModel.id);
          await existing.update((record: any) => {
            record._raw.profile_id = plainData.profileId;
            record._raw.exercise_id = plainData.exerciseId;
            record._raw.weight = plainData.weightEnteredByUser;
            record._raw.reps = plainData.reps;
            record._raw.date = plainData.date.getTime();
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        } catch (_error) {
          await collection.create((record: any) => {
            record._raw.id = plainData.id;
            record._raw.profile_id = plainData.profileId;
            record._raw.exercise_id = plainData.exerciseId;
            record._raw.weight = plainData.weightEnteredByUser;
            record._raw.reps = plainData.reps;
            record._raw.date = plainData.date.getTime();
            record._raw.created_at = plainData.createdAt.getTime();
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        }
        break;
      }
      case 'workoutLogs': {
        const collection = this.database.get('workout_logs');
        try {
          const existing = await collection.find(domainModel.id);
          await existing.update((record: any) => {
            record._raw.profile_id = plainData.profileId;
            record._raw.training_plan_id = plainData.trainingPlanId;
            record._raw.training_plan_name = plainData.trainingPlanName;
            record._raw.session_id = plainData.sessionId;
            record._raw.session_name = plainData.sessionName;
            record._raw.performed_group_ids = JSON.stringify(plainData.performedGroupIds || []);
            record._raw.start_time = plainData.startTime?.getTime();
            record._raw.end_time = plainData.endTime?.getTime();
            record._raw.duration_seconds = plainData.durationSeconds;
            record._raw.total_volume = plainData.totalVolume;
            record._raw.notes = plainData.notes;
            record._raw.user_rating = plainData.userRating;
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        } catch (_error) {
          await collection.create((record: any) => {
            record._raw.id = plainData.id;
            record._raw.profile_id = plainData.profileId;
            record._raw.training_plan_id = plainData.trainingPlanId;
            record._raw.training_plan_name = plainData.trainingPlanName;
            record._raw.session_id = plainData.sessionId;
            record._raw.session_name = plainData.sessionName;
            record._raw.performed_group_ids = JSON.stringify(plainData.performedGroupIds || []);
            record._raw.start_time = plainData.startTime?.getTime();
            record._raw.end_time = plainData.endTime?.getTime();
            record._raw.duration_seconds = plainData.durationSeconds;
            record._raw.total_volume = plainData.totalVolume;
            record._raw.notes = plainData.notes;
            record._raw.user_rating = plainData.userRating;
            record._raw.created_at = plainData.createdAt.getTime();
            record._raw.updated_at = plainData.updatedAt.getTime();
          });
        }
        break;
      }
      default:
        // For complex entity types like workoutLogs, fall back to repository save
        // This might still cause nested writer issues but is better than failing completely
        this.logger.warn(`Using repository fallback for entity type: ${entityType}`);
        // We can't call repository.save here as it would create nested transactions
        // So we'll skip this item and log it as failed
        throw new Error(
          `Direct database operations not fully implemented for entity type: ${entityType}. Skipping to avoid writer queue deadlock.`
        );
    }
  }

  /**
   * Hydrates plain objects into domain models based on entity type.
   * @private
   */
  private hydrateDomainModel(entityType: string, plainData: any): any {
    switch (entityType) {
      case 'profiles':
        return ProfileModel.hydrate(plainData);
      case 'exercises':
        return ExerciseModel.hydrate(plainData);
      case 'exerciseTemplates':
        return ExerciseTemplateModel.hydrate(plainData);
      case 'trainingPlans':
        return TrainingPlanModel.hydrate(plainData, []);
      case 'workoutLogs':
        return WorkoutLogModel.hydrate(plainData, []);
      case 'maxLogs':
        return MaxLogModel.hydrate(plainData);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}
