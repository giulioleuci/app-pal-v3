/**
 * Defines the interface for a 1-Rep Max calculation strategy.
 */
export interface IOneRepMaxFormula {
  /**
   * Calculates the estimated 1-Rep Max.
   * @param weight The weight lifted.
   * @param reps The number of repetitions performed.
   * @returns The estimated 1-Rep Max.
   * @throws Never throws - returns 0 for invalid inputs.
   */
  calculate(weight: number, reps: number): number;
}

/**
 * Implements the Brzycki formula for 1RM estimation.
 * Formula: 1RM = weight / (1.0278 - 0.0278 × reps)
 */
export class BrzyckiFormula implements IOneRepMaxFormula {
  /**
   * Calculates 1RM using the Brzycki formula.
   * @param weight The weight lifted in kg.
   * @param reps The number of repetitions performed.
   * @returns The estimated 1-Rep Max using Brzycki formula.
   */
  calculate(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return weight / (1.0278 - 0.0278 * reps);
  }
}

/**
 * Implements the Epley (or Baechle) formula for 1RM estimation.
 * Formula: 1RM = weight × (1 + 0.0333 × reps)
 */
export class EpleyFormula implements IOneRepMaxFormula {
  /**
   * Calculates 1RM using the Epley formula.
   * @param weight The weight lifted in kg.
   * @param reps The number of repetitions performed.
   * @returns The estimated 1-Rep Max using Epley formula.
   */
  calculate(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return weight * (1 + 0.0333 * reps);
  }
}

/**
 * Implements the Lander formula for 1RM estimation.
 * Formula: 1RM = (100 × weight) / (101.3 - 2.67123 × reps)
 */
export class LanderFormula implements IOneRepMaxFormula {
  /**
   * Calculates 1RM using the Lander formula.
   * @param weight The weight lifted in kg.
   * @param reps The number of repetitions performed.
   * @returns The estimated 1-Rep Max using Lander formula.
   */
  calculate(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return (100 * weight) / (101.3 - 2.67123 * reps);
  }
}
