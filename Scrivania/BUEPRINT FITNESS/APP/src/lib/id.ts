import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new v4 UUID string.
 * @returns A unique identifier string.
 */
export function generateId(): string {
  return uuidv4();
}
