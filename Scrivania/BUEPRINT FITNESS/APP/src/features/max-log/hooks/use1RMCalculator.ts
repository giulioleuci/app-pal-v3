import { useCallback, useMemo } from 'react';

export type Formula = 'epley' | 'brzycki' | 'lander' | 'lombardi' | 'mayhew' | 'oconner' | 'wathen';

export interface FormulaComparison {
  formula: Formula;
  name: string;
  result: number;
  confidence: 'high' | 'medium' | 'low';
  repRange: string;
}

export interface ValidationRule {
  field: 'weight' | 'reps';
  rule: 'min' | 'max' | 'required';
  value: number;
  message: string;
}

interface Use1RMCalculatorResult {
  calculate1RM: (weight: number, reps: number, formula?: Formula) => number;
  compareFormulas: (weight: number, reps: number) => FormulaComparison[];
  getRecommendedWeight: (targetReps: number, max1RM: number) => number;
  validationRules: ValidationRule[];
}

/**
 * Hook for comprehensive 1RM calculations and weight recommendations.
 *
 * Provides multiple 1RM calculation formulas with confidence ratings and weight
 * recommendations for different rep ranges. Offers immediate feedback in workout
 * forms without creating max log entries, enabling real-time training decisions.
 *
 * @returns Object with calculation functions and validation rules
 *
 * @example
 * ```typescript
 * const { calculate1RM, compareFormulas, getRecommendedWeight } = use1RMCalculator();
 *
 * // Calculate 1RM from a set
 * const oneRM = calculate1RM(100, 5); // 100kg x 5 reps
 *
 * // Compare different formulas
 * const comparisons = compareFormulas(100, 5);
 *
 * // Get weight recommendation for target reps
 * const recommendedWeight = getRecommendedWeight(8, oneRM); // For 8 reps
 * ```
 */
export function use1RMCalculator(): Use1RMCalculatorResult {
  /**
   * Calculates 1RM using the specified formula
   */
  const calculate1RM = useCallback(
    (weight: number, reps: number, formula: Formula = 'epley'): number => {
      if (weight <= 0 || reps <= 0) return 0;
      if (reps === 1) return weight; // Already a 1RM

      let oneRM = 0;

      switch (formula) {
        case 'epley':
          // Epley formula: 1RM = weight × (1 + reps/30)
          oneRM = weight * (1 + reps / 30);
          break;

        case 'brzycki':
          // Brzycki formula: 1RM = weight × 36 / (37 - reps)
          oneRM = (weight * 36) / (37 - reps);
          break;

        case 'lander':
          // Lander formula: 1RM = (100 × weight) / (101.3 - 2.67123 × reps)
          oneRM = (100 * weight) / (101.3 - 2.67123 * reps);
          break;

        case 'lombardi':
          // Lombardi formula: 1RM = weight × reps^0.1
          oneRM = weight * Math.pow(reps, 0.1);
          break;

        case 'mayhew':
          // Mayhew formula: 1RM = (100 × weight) / (52.2 + 41.9 × e^(-0.055 × reps))
          oneRM = (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps));
          break;

        case 'oconner':
          // O'Conner formula: 1RM = weight × (1 + reps/40)
          oneRM = weight * (1 + reps / 40);
          break;

        case 'wathen':
          // Wathen formula: 1RM = (100 × weight) / (48.8 + 53.8 × e^(-0.075 × reps))
          oneRM = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
          break;

        default:
          // Default to Epley if invalid formula provided
          oneRM = weight * (1 + reps / 30);
          break;
      }

      return Math.round(oneRM * 10) / 10; // Round to 1 decimal place
    },
    []
  );

  /**
   * Compare results from all available formulas
   */
  const compareFormulas = useCallback(
    (weight: number, reps: number): FormulaComparison[] => {
      const formulas: Array<{ formula: Formula; name: string; repRange: string }> = [
        { formula: 'epley', name: 'Epley', repRange: '2-10' },
        { formula: 'brzycki', name: 'Brzycki', repRange: '2-10' },
        { formula: 'lander', name: 'Lander', repRange: '2-10' },
        { formula: 'lombardi', name: 'Lombardi', repRange: '1-15' },
        { formula: 'mayhew', name: 'Mayhew', repRange: '2-12' },
        { formula: 'oconner', name: "O'Conner", repRange: '3-15' },
        { formula: 'wathen', name: 'Wathen', repRange: '2-15' },
      ];

      const comparisons = formulas.map(({ formula, name, repRange }) => {
        const result = calculate1RM(weight, reps, formula);

        // Determine confidence based on rep range and formula suitability
        let confidence: 'high' | 'medium' | 'low' = 'medium';

        if (reps >= 1 && reps <= 3) {
          confidence = 'high';
        } else if (reps >= 4 && reps <= 10) {
          confidence = formula === 'epley' || formula === 'brzycki' ? 'high' : 'medium';
        } else if (reps >= 11 && reps <= 15) {
          confidence = formula === 'lombardi' || formula === 'wathen' ? 'medium' : 'low';
        } else {
          confidence = 'low';
        }

        return {
          formula,
          name,
          result,
          confidence,
          repRange,
        };
      });

      // Sort by highest result first
      return comparisons.sort((a, b) => b.result - a.result);
    },
    [calculate1RM]
  );

  /**
   * Get recommended weight for a target rep range based on 1RM
   */
  const getRecommendedWeight = useCallback((targetReps: number, max1RM: number): number => {
    if (targetReps <= 0 || max1RM <= 0) return 0;
    if (targetReps === 1) return max1RM;

    // Standard percentage chart for different rep ranges
    const percentageTable: Record<number, number> = {
      1: 100,
      2: 95,
      3: 93,
      4: 90,
      5: 87,
      6: 85,
      7: 83,
      8: 80,
      9: 77,
      10: 75,
      11: 73,
      12: 70,
      15: 65,
    };

    let percentage: number;

    if (percentageTable[targetReps]) {
      percentage = percentageTable[targetReps];
    } else {
      // Linear interpolation for values not in the table
      // Find the closest known values in the table
      const availableReps = Object.keys(percentageTable)
        .map(Number)
        .sort((a, b) => a - b);

      let lowerReps = 1;
      let upperReps = 15;

      // Find the bracketing values
      for (let i = 0; i < availableReps.length - 1; i++) {
        if (availableReps[i] <= targetReps && targetReps <= availableReps[i + 1]) {
          lowerReps = availableReps[i];
          upperReps = availableReps[i + 1];
          break;
        }
      }

      // Handle values outside the table range
      if (targetReps > Math.max(...availableReps)) {
        // Extend the pattern for high reps
        percentage = Math.max(50, 65 - (targetReps - 15) * 2); // Decrease by 2% per rep after 15
      } else if (targetReps < Math.min(...availableReps)) {
        // Should not happen for valid inputs, but handle gracefully
        percentage = 100;
      } else {
        // Interpolate between the bracketing values
        const lowerPercentage = percentageTable[lowerReps];
        const upperPercentage = percentageTable[upperReps];
        const fraction = (targetReps - lowerReps) / (upperReps - lowerReps);
        percentage = lowerPercentage + (upperPercentage - lowerPercentage) * fraction;
      }
    }

    const recommendedWeight = (max1RM * percentage) / 100;
    return Math.round(recommendedWeight * 10) / 10; // Round to 1 decimal place
  }, []);

  /**
   * Validation rules for weight and rep inputs
   */
  const validationRules: ValidationRule[] = useMemo(
    () => [
      {
        field: 'weight',
        rule: 'required',
        value: 0,
        message: 'Weight is required',
      },
      {
        field: 'weight',
        rule: 'min',
        value: 0.1,
        message: 'Weight must be greater than 0',
      },
      {
        field: 'weight',
        rule: 'max',
        value: 1000,
        message: 'Weight cannot exceed 1000kg',
      },
      {
        field: 'reps',
        rule: 'required',
        value: 0,
        message: 'Reps are required',
      },
      {
        field: 'reps',
        rule: 'min',
        value: 1,
        message: 'Reps must be at least 1',
      },
      {
        field: 'reps',
        rule: 'max',
        value: 50,
        message: 'Reps cannot exceed 50',
      },
    ],
    []
  );

  return {
    calculate1RM,
    compareFormulas,
    getRecommendedWeight,
    validationRules,
  };
}
