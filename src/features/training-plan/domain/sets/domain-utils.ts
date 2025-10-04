/**
 * Domain-specific utilities for set configurations.
 * These utilities are pure and have no external dependencies.
 */

/**
 * An estimated average number of seconds to perform one repetition of an exercise.
 */
export const SECONDS_PER_REP = 3;

/**
 * An estimated base number of seconds for setup/teardown per set.
 */
export const BASE_SECONDS_PER_SET = 5;

/**
 * Generates a unique identifier for domain objects.
 * In a real implementation, this would use a proper UUID generator.
 * For the domain layer, we use a simple implementation to maintain purity.
 */
export function generateDomainId(): string {
  return `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
