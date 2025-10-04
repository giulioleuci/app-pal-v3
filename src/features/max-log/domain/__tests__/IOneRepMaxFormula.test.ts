import { describe, expect, it } from 'vitest';

import { BrzyckiFormula, EpleyFormula, LanderFormula } from '../IOneRepMaxFormula';

describe('1RM Formula Strategies', () => {
  describe('BrzyckiFormula', () => {
    let formula: BrzyckiFormula;

    beforeEach(() => {
      formula = new BrzyckiFormula();
    });

    describe('calculate', () => {
      it('should return weight for single rep (1RM)', () => {
        const result = formula.calculate(100, 1);

        expect(result).toBe(100);
      });

      it('should calculate 1RM using Brzycki formula for multiple reps', () => {
        // 100kg x 5 reps = 100 / (1.0278 - 0.0278 * 5) = 100 / 0.889 ≈ 112.51
        const result = formula.calculate(100, 5);

        expect(result).toBeCloseTo(112.51, 2);
      });

      it('should calculate 1RM correctly for 10 reps', () => {
        // 80kg x 10 reps = 80 / (1.0278 - 0.0278 * 10) = 80 / 0.750 ≈ 106.70
        const result = formula.calculate(80, 10);

        expect(result).toBeCloseTo(106.7, 2);
      });

      it('should calculate 1RM correctly for 3 reps', () => {
        // 120kg x 3 reps = 120 / (1.0278 - 0.0278 * 3) = 120 / 0.9444 ≈ 127.06
        const result = formula.calculate(120, 3);

        expect(result).toBeCloseTo(127.06, 2);
      });

      it('should return 0 for zero weight', () => {
        const result = formula.calculate(0, 5);

        expect(result).toBe(0);
      });

      it('should return 0 for negative weight', () => {
        const result = formula.calculate(-50, 5);

        expect(result).toBe(0);
      });

      it('should return 0 for zero reps', () => {
        const result = formula.calculate(100, 0);

        expect(result).toBe(0);
      });

      it('should return 0 for negative reps', () => {
        const result = formula.calculate(100, -3);

        expect(result).toBe(0);
      });

      it('should handle decimal weights and reps', () => {
        const result = formula.calculate(87.5, 6);

        expect(result).toBeCloseTo(101.63, 2);
      });

      it('should handle high rep ranges', () => {
        const result = formula.calculate(50, 20);

        expect(result).toBeCloseTo(105.98, 2);
      });
    });
  });

  describe('EpleyFormula', () => {
    let formula: EpleyFormula;

    beforeEach(() => {
      formula = new EpleyFormula();
    });

    describe('calculate', () => {
      it('should return weight for single rep (1RM)', () => {
        const result = formula.calculate(100, 1);

        expect(result).toBe(100);
      });

      it('should calculate 1RM using Epley formula for multiple reps', () => {
        // 100kg x 5 reps = 100 * (1 + 0.0333 * 5) = 100 * 1.1665 = 116.65
        const result = formula.calculate(100, 5);

        expect(result).toBeCloseTo(116.65, 2);
      });

      it('should calculate 1RM correctly for 10 reps', () => {
        // 80kg x 10 reps = 80 * (1 + 0.0333 * 10) = 80 * 1.333 = 106.64
        const result = formula.calculate(80, 10);

        expect(result).toBeCloseTo(106.64, 2);
      });

      it('should calculate 1RM correctly for 3 reps', () => {
        // 120kg x 3 reps = 120 * (1 + 0.0333 * 3) = 120 * 1.0999 = 131.99
        const result = formula.calculate(120, 3);

        expect(result).toBeCloseTo(131.99, 2);
      });

      it('should return 0 for zero weight', () => {
        const result = formula.calculate(0, 5);

        expect(result).toBe(0);
      });

      it('should return 0 for negative weight', () => {
        const result = formula.calculate(-50, 5);

        expect(result).toBe(0);
      });

      it('should return 0 for zero reps', () => {
        const result = formula.calculate(100, 0);

        expect(result).toBe(0);
      });

      it('should return 0 for negative reps', () => {
        const result = formula.calculate(100, -3);

        expect(result).toBe(0);
      });

      it('should handle decimal weights and reps', () => {
        const result = formula.calculate(87.5, 6);

        expect(result).toBeCloseTo(104.98, 2);
      });

      it('should handle high rep ranges', () => {
        const result = formula.calculate(50, 20);

        expect(result).toBeCloseTo(83.3, 2);
      });
    });
  });

  describe('LanderFormula', () => {
    let formula: LanderFormula;

    beforeEach(() => {
      formula = new LanderFormula();
    });

    describe('calculate', () => {
      it('should return weight for single rep (1RM)', () => {
        const result = formula.calculate(100, 1);

        expect(result).toBe(100);
      });

      it('should calculate 1RM using Lander formula for multiple reps', () => {
        // 100kg x 5 reps = (100 * 100) / (101.3 - 2.67123 * 5) = 10000 / 87.94385 ≈ 113.71
        const result = formula.calculate(100, 5);

        expect(result).toBeCloseTo(113.71, 2);
      });

      it('should calculate 1RM correctly for 10 reps', () => {
        // 80kg x 10 reps = (80 * 100) / (101.3 - 2.67123 * 10) = 8000 / 74.5877 ≈ 107.26
        const result = formula.calculate(80, 10);

        expect(result).toBeCloseTo(107.26, 2);
      });

      it('should calculate 1RM correctly for 3 reps', () => {
        // 120kg x 3 reps = (120 * 100) / (101.3 - 2.67123 * 3) = 12000 / 93.28631 ≈ 128.64
        const result = formula.calculate(120, 3);

        expect(result).toBeCloseTo(128.64, 2);
      });

      it('should return 0 for zero weight', () => {
        const result = formula.calculate(0, 5);

        expect(result).toBe(0);
      });

      it('should return 0 for negative weight', () => {
        const result = formula.calculate(-50, 5);

        expect(result).toBe(0);
      });

      it('should return 0 for zero reps', () => {
        const result = formula.calculate(100, 0);

        expect(result).toBe(0);
      });

      it('should return 0 for negative reps', () => {
        const result = formula.calculate(100, -3);

        expect(result).toBe(0);
      });

      it('should handle decimal weights and reps', () => {
        const result = formula.calculate(87.5, 6);

        expect(result).toBeCloseTo(102.61, 2);
      });

      it('should handle high rep ranges', () => {
        const result = formula.calculate(50, 20);

        expect(result).toBeCloseTo(104.44, 2);
      });
    });
  });

  describe('Formula comparisons', () => {
    let brzyckiFormula: BrzyckiFormula;
    let epleyFormula: EpleyFormula;
    let landerFormula: LanderFormula;

    beforeEach(() => {
      brzyckiFormula = new BrzyckiFormula();
      epleyFormula = new EpleyFormula();
      landerFormula = new LanderFormula();
    });

    it('should all return same value for 1RM (1 rep)', () => {
      const weight = 100;
      const reps = 1;

      const brzyckiResult = brzyckiFormula.calculate(weight, reps);
      const epleyResult = epleyFormula.calculate(weight, reps);
      const landerResult = landerFormula.calculate(weight, reps);

      expect(brzyckiResult).toBe(weight);
      expect(epleyResult).toBe(weight);
      expect(landerResult).toBe(weight);
    });

    it('should produce different but reasonable estimates for same input', () => {
      const weight = 100;
      const reps = 5;

      const brzyckiResult = brzyckiFormula.calculate(weight, reps);
      const epleyResult = epleyFormula.calculate(weight, reps);
      const landerResult = landerFormula.calculate(weight, reps);

      // All should be greater than the original weight
      expect(brzyckiResult).toBeGreaterThan(weight);
      expect(epleyResult).toBeGreaterThan(weight);
      expect(landerResult).toBeGreaterThan(weight);

      // All should be reasonably close (within 10% of each other)
      const results = [brzyckiResult, epleyResult, landerResult];
      const min = Math.min(...results);
      const max = Math.max(...results);
      const range = max - min;
      const average = results.reduce((a, b) => a + b) / results.length;

      expect(range / average).toBeLessThan(0.1);
    });

    it('should all handle edge cases consistently', () => {
      const testCases = [
        { weight: 0, reps: 5 },
        { weight: 100, reps: 0 },
        { weight: -50, reps: 5 },
        { weight: 100, reps: -3 },
      ];

      testCases.forEach(({ weight, reps }) => {
        const brzyckiResult = brzyckiFormula.calculate(weight, reps);
        const epleyResult = epleyFormula.calculate(weight, reps);
        const landerResult = landerFormula.calculate(weight, reps);

        expect(brzyckiResult).toBe(0);
        expect(epleyResult).toBe(0);
        expect(landerResult).toBe(0);
      });
    });
  });

  describe('Mathematical accuracy', () => {
    it('should calculate Brzycki formula precisely', () => {
      // Test with exact mathematical values
      const weight = 100;
      const reps = 5;
      const expected = 100 / (1.0278 - 0.0278 * 5);

      const result = new BrzyckiFormula().calculate(weight, reps);

      expect(result).toBeCloseTo(expected, 10);
    });

    it('should calculate Epley formula precisely', () => {
      // Test with exact mathematical values
      const weight = 100;
      const reps = 5;
      const expected = 100 * (1 + 0.0333 * 5);

      const result = new EpleyFormula().calculate(weight, reps);

      expect(result).toBeCloseTo(expected, 10);
    });

    it('should calculate Lander formula precisely', () => {
      // Test with exact mathematical values
      const weight = 100;
      const reps = 5;
      const expected = (100 * 100) / (101.3 - 2.67123 * 5);

      const result = new LanderFormula().calculate(weight, reps);

      expect(result).toBeCloseTo(expected, 10);
    });
  });
});
