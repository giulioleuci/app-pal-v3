import { useMutation, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { container } from 'tsyringe';

import { queryKeys } from '@/app/queryKeys';
import { DataSyncQueryService } from '@/features/data-sync/query-services/DataSyncQueryService';
import { ExportData, ImportStatus } from '@/features/data-sync/services/DataSyncService';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { ConflictError } from '@/shared/errors/ConflictError';
import { isConflictError } from '@/shared/errors/guards';

/**
 * Input type for data import operation.
 */
export type ImportDataInput = {
  importData: ExportData;
  onProgress?: (status: ImportStatus) => void;
};

/**
 * React Query mutation hook for importing user data.
 *
 * This hook provides a declarative way to trigger data import operations with progress
 * tracking and conflict handling. It uses chunking to prevent UI blocking during large
 * imports and provides real-time progress updates through the onProgress callback.
 *
 * The hook handles ConflictError instances specially using the isConflictError type guard
 * in its onError callback. When a ConflictError is thrown, its message property contains
 * an I18nKeys type that must be translated by the consuming UI component to provide
 * localized error messages to the user.
 *
 * On successful import, the hook triggers granular cache invalidation by calling
 * queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() }) to refresh
 * profile-wide data and ensure UI consistency across all related features.
 *
 * @param options Optional React Query mutation configuration options
 * @returns Mutation result with mutate function, loading state, and error information
 */
export function useImportData(
  options?: Omit<
    UseMutationOptions<ImportStatus, ApplicationError | ConflictError, ImportDataInput>,
    'mutationFn'
  >
) {
  const dataSyncQueryService = container.resolve(DataSyncQueryService);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ importData, onProgress }: ImportDataInput) =>
      dataSyncQueryService.importData(importData, onProgress),
    onSuccess: (result, variables) => {
      // Invalidate profiles cache to trigger a granular, profile-wide data refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() });

      options?.onSuccess?.(result, variables, undefined);
    },
    onError: (error, variables, context) => {
      // Use type guard to handle ConflictError specially
      if (isConflictError(error)) {
        // ConflictError.message is an I18nKeys type that needs translation
        // The consuming UI component must translate this key to display localized messages
        console.warn('Import conflict detected:', error.message);
      }

      options?.onError?.(error, variables, context);
    },
    onSettled: options?.onSettled,
    onMutate: options?.onMutate,
  });
}
