import { RepRangeCategory } from '@/shared/types';

/**
 * Calculates Body Mass Index (BMI) using the classic formula.
 * @param weightKg User's weight in kilograms.
 * @param heightCm User's height in centimeters.
 * @returns The calculated BMI value.
 */
export function calculateBMIClassic(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Calculates Body Mass Index (BMI) using the new, revised formula.
 * @param weightKg User's weight in kilograms.
 * @param heightCm User's height in centimeters.
 * @returns The calculated BMI value.
 */
export function calculateBMINew(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return 1.3 * (weightKg / Math.pow(heightM, 2.5));
}

/**
 * Estimates 1-Rep Max (1RM) using the Brzycki formula.
 * @param weight The weight lifted.
 * @param reps The number of repetitions performed.
 * @returns The estimated 1RM.
 */
export function brzycki(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return weight / (1.0278 - 0.0278 * reps);
}

/**
 * Estimates 1-Rep Max (1RM) using the Baechle (or Epley) formula.
 * @param weight The weight lifted.
 * @param reps The number of repetitions performed.
 * @returns The estimated 1RM.
 */
export function baechle(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return weight * (1 + 0.0333 * reps);
}

/**
 * Classifies a given number of repetitions into a strength category.
 * @param reps The number of repetitions.
 * @returns The corresponding rep range category.
 */
export function classifyRepRange(reps: number): RepRangeCategory {
  if (reps <= 5) return 'strength';
  if (reps <= 15) return 'hypertrophy';
  return 'endurance';
}
