import { type BlueprintFitnessDB, database as globalDb } from './database';

/**
 * Executes a callback function within a single atomic database transaction.
 * This utility ensures that all database operations within the callback either
 * succeed together or fail together, maintaining data integrity. It abstracts
 * away the complexity of WatermelonDB's write API.
 *
 * @param callback The async function to execute within the transaction. It contains the database operations.
 * @param mode The transaction mode: 'r' for read-only, 'rw' for read-write. Defaults to 'rw'.
 * @param db The WatermelonDB database instance to use. Defaults to the global instance, but can be overridden for test isolation.
 * @returns A promise that resolves with the return value of the callback.
 * @throws Re-throws any error that occurs within the callback, causing the transaction to abort.
 *
 * @example
 * await runInTransaction(async () => {
 *   await db.profiles.put({ name: 'Alice' });
 *   await db.workoutLogs.put({ message: 'User Alice created' });
 * });
 */
export function runInTransaction<T>(
  callback: () => Promise<T>,
  _mode: 'r' | 'rw' = 'rw',
  db: BlueprintFitnessDB = globalDb
): Promise<T> {
  // WatermelonDB uses write() for transaction-like operations
  return db.write(async () => {
    return await callback();
  });
}
