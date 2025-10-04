import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { ApplicationError } from '@/shared/errors';

/**
 * Generic service interface that CRUD hooks expect
 */
export interface CrudService<T, TCreate, TUpdate> {
  create(input: TCreate): Promise<T>;
  update(input: TUpdate): Promise<T>;
  delete(input: { id: string }): Promise<void>;
  getById(id: string): Promise<T>;
  getByProfileId(profileId: string): Promise<T[]>;
}

/**
 * Generic CRUD hooks factory that creates standardized hooks for any entity.
 * Reduces boilerplate and ensures consistent patterns across all features.
 *
 * @param entityName - Name used for query keys (e.g., 'exercise', 'workout')
 * @param service - Service implementing the CrudService interface
 * @returns Object containing standardized CRUD hooks
 */
export function createCrudHooks<T, TCreate, TUpdate>(
  entityName: string,
  service: CrudService<T, TCreate, TUpdate>
) {
  return {
    /**
     * Mutation hook for creating new entities
     */
    useCreate: (options?: Omit<UseMutationOptions<T, ApplicationError, TCreate>, 'mutationFn'>) => {
      const queryClient = useQueryClient();

      return useMutation({
        ...options,
        mutationFn: service.create,
        onSuccess: (data, variables, context) => {
          // Invalidate list queries to ensure new entity appears
          queryClient.invalidateQueries({ queryKey: [entityName, 'list'] });
          queryClient.invalidateQueries({ queryKey: [entityName, 'recent'] });

          // Call user's onSuccess if provided
          options?.onSuccess?.(data, variables, context);
        },
      });
    },

    /**
     * Mutation hook for updating existing entities
     */
    useUpdate: (options?: Omit<UseMutationOptions<T, ApplicationError, TUpdate>, 'mutationFn'>) => {
      const queryClient = useQueryClient();

      return useMutation({
        ...options,
        mutationFn: service.update,
        onSuccess: (data, variables, context) => {
          // Update specific entity cache
          const entityWithId = data as T & { id: string };
          queryClient.setQueryData([entityName, entityWithId.id], data);

          // Invalidate list queries to ensure updates propagate
          queryClient.invalidateQueries({ queryKey: [entityName, 'list'] });

          // Call user's onSuccess if provided
          options?.onSuccess?.(data, variables, context);
        },
      });
    },

    /**
     * Mutation hook for deleting entities
     */
    useDelete: (
      options?: Omit<UseMutationOptions<void, ApplicationError, { id: string }>, 'mutationFn'>
    ) => {
      const queryClient = useQueryClient();

      return useMutation({
        ...options,
        mutationFn: service.delete,
        onSuccess: (data, variables, context) => {
          // Remove specific entity from cache
          queryClient.removeQueries({ queryKey: [entityName, variables.id] });

          // Invalidate list queries to ensure deletion propagates
          queryClient.invalidateQueries({ queryKey: [entityName, 'list'] });

          // Call user's onSuccess if provided
          options?.onSuccess?.(data, variables, context);
        },
      });
    },

    /**
     * Query hook for fetching a single entity by ID
     */
    useGet: (
      id: string,
      options?: Omit<UseQueryOptions<T, ApplicationError>, 'queryKey' | 'queryFn'>
    ) => {
      return useQuery({
        ...options,
        queryKey: [entityName, id],
        queryFn: () => service.getById(id),
        enabled: options?.enabled !== false && !!id,
      });
    },

    /**
     * Query hook for fetching all entities for a profile
     */
    useList: (
      profileId: string,
      options?: Omit<UseQueryOptions<T[], ApplicationError>, 'queryKey' | 'queryFn'>
    ) => {
      return useQuery({
        ...options,
        queryKey: [entityName, 'list', profileId],
        queryFn: () => service.getByProfileId(profileId),
        enabled: options?.enabled !== false && !!profileId,
      });
    },
  };
}

/**
 * Utility type to extract the hooks from createCrudHooks result
 */
export type CrudHooks<T, TCreate, TUpdate> = ReturnType<
  typeof createCrudHooks<T, TCreate, TUpdate>
>;
