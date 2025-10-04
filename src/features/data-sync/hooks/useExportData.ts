import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { DataSyncQueryService } from '@/features/data-sync/query-services/DataSyncQueryService';
import { ExportData, ExportStatus } from '@/features/data-sync/services/DataSyncService';
import { ApplicationError } from '@/shared/errors/ApplicationError';

/**
 * Input type for data export operation.
 */
export type ExportDataInput = {
  profileId: string;
  onProgress?: (status: ExportStatus) => void;
};

/**
 * React Query mutation hook for exporting user data.
 *
 * This hook provides a declarative way to trigger data export operations with progress
 * tracking. It uses chunking to prevent UI blocking during large exports and provides
 * real-time progress updates through the onProgress callback.
 *
 * @param options Optional React Query mutation configuration options
 * @returns Mutation result with mutate function, loading state, and error information
 */
export function useExportData(
  options?: Omit<UseMutationOptions<ExportData, ApplicationError, ExportDataInput>, 'mutationFn'>
) {
  const dataSyncQueryService = container.resolve(DataSyncQueryService);

  return useMutation({
    mutationFn: ({ profileId, onProgress }: ExportDataInput) =>
      dataSyncQueryService.exportData(profileId, onProgress),
    ...options,
  });
}
