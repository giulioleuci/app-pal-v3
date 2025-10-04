import { inject, injectable } from 'tsyringe';

import {
  DataSyncService,
  ExportData,
  ExportStatus,
  ImportStatus,
} from '@/features/data-sync/services/DataSyncService';

/**
 * Query service that acts as an adapter between the Data Sync Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the DataSyncService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all data synchronization operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class DataSyncQueryService {
  constructor(@inject(DataSyncService) private readonly dataSyncService: DataSyncService) {}

  /**
   * Exports all user data to a structured format.
   * Uses chunking to prevent UI blocking during large exports.
   * @param profileId The profile ID to export data for
   * @param onProgress Optional callback for progress updates
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to export data
   */
  async exportData(
    profileId: string,
    onProgress?: (status: ExportStatus) => void
  ): Promise<ExportData> {
    const result = await this.dataSyncService.exportData(profileId, onProgress);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Imports data from an export file.
   * Uses chunking to prevent UI blocking during large imports.
   * @param importData The data to import
   * @param onProgress Optional callback for progress updates
   * @throws {ApplicationError|ConflictError} When the operation fails or conflicts are detected
   * @returns Promise resolving to import status
   */
  async importData(
    importData: ExportData,
    onProgress?: (status: ImportStatus) => void
  ): Promise<ImportStatus> {
    const result = await this.dataSyncService.importData(importData, onProgress);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }
}
