/**
 * Performance tests for useProgressCalculations hook
 *
 * These tests measure the execution time of calculation functions
 * to identify performance bottlenecks.
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DataPoint } from '../useProgressCalculations';
import { useProgressCalculations } from '../useProgressCalculations';

describe('useProgressCalculations Performance', () => {
  // Helper to generate test data
  const generateDataPoints = (count: number): DataPoint[] => {
    const points: DataPoint[] = [];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < count; i++) {
      points.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        value: 100 + Math.random() * 50,
        type: 'weight',
      });
    }

    return points;
  };

  const measureExecutionTime = (fn: () => void): number => {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
  };

  describe('calculateTrend performance', () => {
    it('should handle 10 data points quickly (<10ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(10);

      const executionTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
      });

      expect(executionTime).toBeLessThan(10);
      console.log(`10 points: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle 100 data points reasonably (<50ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      const executionTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
      });

      expect(executionTime).toBeLessThan(50);
      console.log(`100 points: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle 1000 data points without excessive delay (<200ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(1000);

      const executionTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
      });

      expect(executionTime).toBeLessThan(200);
      console.log(`1000 points: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle 5000 data points (stress test)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(5000);

      const executionTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
      });

      console.log(`5000 points: ${executionTime.toFixed(2)}ms`);
      // Just log, no assertion as this is a stress test
    });
  });

  describe('projectFutureProgress performance', () => {
    it('should project 90 days with 100 data points quickly (<100ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      const executionTime = measureExecutionTime(() => {
        result.current.projectFutureProgress(dataPoints, 90);
      });

      expect(executionTime).toBeLessThan(100);
      console.log(`Project 90 days (100 points): ${executionTime.toFixed(2)}ms`);
    });

    it('should project 365 days with 100 data points reasonably (<200ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      const executionTime = measureExecutionTime(() => {
        result.current.projectFutureProgress(dataPoints, 365);
      });

      expect(executionTime).toBeLessThan(200);
      console.log(`Project 365 days (100 points): ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('findPlateaus performance', () => {
    it('should find plateaus in 100 data points quickly (<50ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      const executionTime = measureExecutionTime(() => {
        result.current.findPlateaus(dataPoints);
      });

      expect(executionTime).toBeLessThan(50);
      console.log(`Find plateaus (100 points): ${executionTime.toFixed(2)}ms`);
    });

    it('should find plateaus in 1000 data points reasonably (<300ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(1000);

      const executionTime = measureExecutionTime(() => {
        result.current.findPlateaus(dataPoints);
      });

      expect(executionTime).toBeLessThan(300);
      console.log(`Find plateaus (1000 points): ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('detectBreakthrough performance', () => {
    it('should detect breakthroughs in 100 data points quickly (<30ms)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      const executionTime = measureExecutionTime(() => {
        result.current.detectBreakthrough(dataPoints);
      });

      expect(executionTime).toBeLessThan(30);
      console.log(`Detect breakthroughs (100 points): ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Combined operations performance', () => {
    it('should handle all calculations on 100 data points reasonably (<250ms total)', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      const totalExecutionTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
        result.current.getProgressRate(dataPoints);
        result.current.projectFutureProgress(dataPoints, 90);
        result.current.statisticalSummary(dataPoints.map((p) => p.value));
        result.current.findPlateaus(dataPoints);
        result.current.detectBreakthrough(dataPoints);
      });

      expect(totalExecutionTime).toBeLessThan(250);
      console.log(`All calculations (100 points): ${totalExecutionTime.toFixed(2)}ms`);
    });

    it('should not degrade significantly with repeated calls (memoization test)', () => {
      const { result, rerender } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(100);

      // First call
      const firstCallTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
      });

      // Trigger re-render
      rerender();

      // Second call (should be similar if memoized)
      const secondCallTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
      });

      console.log(`First call: ${firstCallTime.toFixed(2)}ms, Second call: ${secondCallTime.toFixed(2)}ms`);

      // Second call should not be significantly slower
      expect(secondCallTime / firstCallTime).toBeLessThan(3); // Allow up to 3x variance
    });
  });

  describe('useProgressCalculations re-render behavior', () => {
    it('should not create new function references on every render', () => {
      const { result, rerender } = renderHook(() => useProgressCalculations());

      const firstFunctions = {
        calculateTrend: result.current.calculateTrend,
        getProgressRate: result.current.getProgressRate,
        projectFutureProgress: result.current.projectFutureProgress,
      };

      // Trigger multiple re-renders
      rerender();
      rerender();
      rerender();

      const secondFunctions = {
        calculateTrend: result.current.calculateTrend,
        getProgressRate: result.current.getProgressRate,
        projectFutureProgress: result.current.projectFutureProgress,
      };

      // Functions should be the same reference (memoized)
      expect(secondFunctions.calculateTrend).toBe(firstFunctions.calculateTrend);
      expect(secondFunctions.getProgressRate).toBe(firstFunctions.getProgressRate);
      expect(secondFunctions.projectFutureProgress).toBe(firstFunctions.projectFutureProgress);
    });
  });

  describe('Edge cases and performance', () => {
    it('should handle empty array efficiently', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const executionTime = measureExecutionTime(() => {
        result.current.calculateTrend([]);
        result.current.findPlateaus([]);
        result.current.detectBreakthrough([]);
      });

      expect(executionTime).toBeLessThan(5);
      console.log(`Empty array handling: ${executionTime.toFixed(2)}ms`);
    });

    it('should handle single data point efficiently', () => {
      const { result } = renderHook(() => useProgressCalculations());
      const dataPoints = generateDataPoints(1);

      const executionTime = measureExecutionTime(() => {
        result.current.calculateTrend(dataPoints);
        result.current.findPlateaus(dataPoints);
        result.current.detectBreakthrough(dataPoints);
      });

      expect(executionTime).toBeLessThan(5);
      console.log(`Single point handling: ${executionTime.toFixed(2)}ms`);
    });
  });
});
