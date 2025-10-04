import { ConflictError } from '@/shared/errors/ConflictError';

/**
 * A TypeScript type predicate to check if an error is a ConflictError.
 * @param e The error to check, of unknown type.
 * @returns True if the error is an instance of ConflictError, false otherwise.
 */
export function isConflictError(e: unknown): e is ConflictError {
  return e instanceof ConflictError;
}
