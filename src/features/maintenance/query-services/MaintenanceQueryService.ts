import { inject, injectable } from 'tsyringe';

import {
  BulkDeleteOptions,
  CleanupResult,
  MaintenanceService,
  MaintenanceStatus,
} from '@/features/maintenance/services/MaintenanceService';

/**
 * Query service that acts as an adapter between the Maintenance Application Layer and React Query.
 *
 * This service handles the unwrapping of Result objects returned by the MaintenanceService,
 * allowing React Query hooks to use standard promise-based error handling. It provides
 * methods for all maintenance operations that components need through hooks.
 *
 * The service throws errors on failure instead of returning Result objects, which integrates
 * seamlessly with React Query's error handling mechanisms.
 */
@injectable()
export class MaintenanceQueryService {
  constructor(
    @inject(MaintenanceService) private readonly maintenanceService: MaintenanceService
  ) {}

  /**
   * Performs bulk delete operations based on the specified option.
   * Uses chunking to prevent UI blocking during large operations.
   * @param option The type of bulk delete operation to perform
   * @param onProgress Optional callback for progress updates
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to cleanup results
   */
  async bulkDelete(
    option: BulkDeleteOptions,
    onProgress?: (status: MaintenanceStatus) => void
  ): Promise<CleanupResult> {
    const result = await this.maintenanceService.bulkDelete(option, onProgress);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Optimizes database performance by running cleanup operations.
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to optimization results
   */
  async optimizeDatabase(): Promise<{
    message: string;
    operationsPerformed: string[];
  }> {
    const result = await this.maintenanceService.optimizeDatabase();
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Validates data integrity across all repositories.
   * @throws {ApplicationError} When the operation fails
   * @returns Promise resolving to validation results
   */
  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    totalRecordsChecked: number;
  }> {
    const result = await this.maintenanceService.validateDataIntegrity();
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }
}
