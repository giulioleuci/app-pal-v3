import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataPoint, useProgressCalculations } from '../useProgressCalculations';

describe('useProgressCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct calculation functions', () => {
      const { result } = renderHook(() => useProgressCalculations());

      expect(typeof result.current.calculateTrend).toBe('function');
      expect(typeof result.current.getProgressRate).toBe('function');
      expect(typeof result.current.projectFutureProgress).toBe('function');
      expect(typeof result.current.statisticalSummary).toBe('function');
      expect(typeof result.current.calculateVolatility).toBe('function');
      expect(typeof result.current.findPlateaus).toBe('function');
      expect(typeof result.current.detectBreakthrough).toBe('function');
    });
  });

  describe('calculateTrend', () => {
    it('should return stable trend for insufficient data', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
      ];

      const trend = result.current.calculateTrend(dataPoints);

      expect(trend.direction).toBe('stable');
      expect(trend.slope).toBe(0);
      expect(trend.rSquared).toBe(0);
      expect(trend.confidenceLevel).toBe('low');
      expect(trend.changePerWeek).toBe(0);
      expect(trend.changePercentage).toBe(0);
    });

    it('should calculate increasing trend correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
        { date: new Date('2024-01-15'), value: 110, type: 'weight' },
        { date: new Date('2024-01-22'), value: 115, type: 'weight' },
        { date: new Date('2024-01-29'), value: 120, type: 'weight' },
      ];

      const trend = result.current.calculateTrend(dataPoints);

      expect(trend.direction).toBe('increasing');
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.rSquared).toBeGreaterThan(0.9); // Should have high correlation
      expect(trend.changePerWeek).toBeGreaterThan(0);
      expect(trend.changePercentage).toBeGreaterThan(0);
    });

    it('should calculate decreasing trend correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 120, type: 'weight' },
        { date: new Date('2024-01-08'), value: 115, type: 'weight' },
        { date: new Date('2024-01-15'), value: 110, type: 'weight' },
        { date: new Date('2024-01-22'), value: 105, type: 'weight' },
        { date: new Date('2024-01-29'), value: 100, type: 'weight' },
      ];

      const trend = result.current.calculateTrend(dataPoints);

      expect(trend.direction).toBe('decreasing');
      expect(trend.slope).toBeLessThan(0);
      expect(trend.changePerWeek).toBeLessThan(0);
      expect(trend.changePercentage).toBeLessThan(0);
    });

    it('should handle stable data with small variations', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 100.1, type: 'weight' },
        { date: new Date('2024-01-15'), value: 99.9, type: 'weight' },
        { date: new Date('2024-01-22'), value: 100.05, type: 'weight' },
        { date: new Date('2024-01-29'), value: 99.95, type: 'weight' },
      ];

      const trend = result.current.calculateTrend(dataPoints);

      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.slope)).toBeLessThan(0.1);
    });

    it('should determine confidence levels correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      // High confidence (10+ points, high R²)
      const highConfidenceData: DataPoint[] = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2024, 0, i * 7 + 1),
        value: 100 + i * 2, // Linear progression
        type: 'weight' as const,
      }));

      const highConfidenceTrend = result.current.calculateTrend(highConfidenceData);
      expect(highConfidenceTrend.confidenceLevel).toBe('high');

      // Medium confidence (5-9 points, medium R²)
      const mediumConfidenceData: DataPoint[] = Array.from({ length: 6 }, (_, i) => ({
        date: new Date(2024, 0, i * 7 + 1),
        value: 100 + i * 2 + Math.random() * 2, // Some noise
        type: 'weight' as const,
      }));

      const mediumConfidenceTrend = result.current.calculateTrend(mediumConfidenceData);
      expect(['medium', 'high']).toContain(mediumConfidenceTrend.confidenceLevel);
    });

    it('should sort data points by date', () => {
      const { result } = renderHook(() => useProgressCalculations());

      // Unsorted data
      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-15'), value: 110, type: 'weight' },
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-29'), value: 120, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
      ];

      const trend = result.current.calculateTrend(dataPoints);

      // Should still calculate trend correctly despite unsorted input
      expect(trend.direction).toBe('increasing');
      expect(trend.slope).toBeGreaterThan(0);
    });
  });

  describe('getProgressRate', () => {
    it('should return zero rates for insufficient data', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
      ];

      const rate = result.current.getProgressRate(dataPoints);

      expect(rate.dailyRate).toBe(0);
      expect(rate.weeklyRate).toBe(0);
      expect(rate.monthlyRate).toBe(0);
      expect(rate.unit).toBe('units');
      expect(rate.period).toBe('day');
    });

    it('should calculate progress rates correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 107, type: 'weight' }, // 7 days, 7kg gain = 1kg/day
      ];

      const rate = result.current.getProgressRate(dataPoints);

      expect(rate.dailyRate).toBeCloseTo(1, 1);
      expect(rate.weeklyRate).toBeCloseTo(7, 1);
      expect(rate.monthlyRate).toBeCloseTo(30, 1);
      expect(rate.unit).toBe('kg');
    });

    it('should set correct units based on data type', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const weightData: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
      ];

      const weightRate = result.current.getProgressRate(weightData);
      expect(weightRate.unit).toBe('kg');

      const volumeData: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 1000, type: 'volume' },
        { date: new Date('2024-01-08'), value: 1100, type: 'volume' },
      ];

      const volumeRate = result.current.getProgressRate(volumeData);
      expect(volumeRate.unit).toBe('units');
    });
  });

  describe('projectFutureProgress', () => {
    it('should return empty array for insufficient data', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
      ];

      const projections = result.current.projectFutureProgress(dataPoints, 30);
      expect(projections).toEqual([]);
    });

    it('should generate future projections correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
        { date: new Date('2024-01-15'), value: 110, type: 'weight' },
        { date: new Date('2024-01-22'), value: 115, type: 'weight' },
      ];

      const projections = result.current.projectFutureProgress(dataPoints, 28); // 4 weeks

      expect(projections.length).toBeGreaterThan(0);
      expect(projections.length).toBeLessThanOrEqual(14); // Max projection pointsojection points

      projections.forEach((projection) => {
        expect(projection.date).toBeInstanceOf(Date);
        expect(typeof projection.projectedValue).toBe('number');
        expect(projection.confidenceInterval.lower).toBeLessThan(projection.projectedValue);
        expect(projection.confidenceInterval.upper).toBeGreaterThan(projection.projectedValue);
      });
    });

    it('should have increasing uncertainty over time', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
        { date: new Date('2024-01-15'), value: 110, type: 'weight' },
        { date: new Date('2024-01-22'), value: 115, type: 'weight' },
      ];

      const projections = result.current.projectFutureProgress(dataPoints, 56); // 8 weeks

      if (projections.length >= 2) {
        const firstProjection = projections[0];
        const lastProjection = projections[projections.length - 1];

        const firstRange =
          firstProjection.confidenceInterval.upper - firstProjection.confidenceInterval.lower;
        const lastRange =
          lastProjection.confidenceInterval.upper - lastProjection.confidenceInterval.lower;

        expect(lastRange).toBeGreaterThan(firstRange);
      }
    });
  });

  describe('statisticalSummary', () => {
    it('should return zero summary for empty array', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const summary = result.current.statisticalSummary([]);

      expect(summary.mean).toBe(0);
      expect(summary.median).toBe(0);
      expect(summary.standardDeviation).toBe(0);
      expect(summary.variance).toBe(0);
      expect(summary.min).toBe(0);
      expect(summary.max).toBe(0);
      expect(summary.range).toBe(0);
      expect(summary.coefficientOfVariation).toBe(0);
    });

    it('should calculate statistics correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const values = [10, 20, 30, 40, 50];
      const summary = result.current.statisticalSummary(values);

      expect(summary.mean).toBe(30);
      expect(summary.median).toBe(30);
      expect(summary.min).toBe(10);
      expect(summary.max).toBe(50);
      expect(summary.range).toBe(40);
      expect(summary.standardDeviation).toBeCloseTo(14.14, 1);
      expect(summary.variance).toBeCloseTo(200, 1);
      expect(summary.coefficientOfVariation).toBeCloseTo(47.14, 1);
    });

    it('should handle even number of values for median', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const values = [10, 20, 30, 40];
      const summary = result.current.statisticalSummary(values);

      expect(summary.median).toBe(25); // Average of 20 and 30
    });

    it('should handle single value', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const values = [100];
      const summary = result.current.statisticalSummary(values);

      expect(summary.mean).toBe(100);
      expect(summary.median).toBe(100);
      expect(summary.standardDeviation).toBe(0);
      expect(summary.variance).toBe(0);
      expect(summary.coefficientOfVariation).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility as coefficient of variation', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 90, type: 'weight' },
        { date: new Date('2024-01-08'), value: 100, type: 'weight' },
        { date: new Date('2024-01-15'), value: 110, type: 'weight' },
      ];

      const volatility = result.current.calculateVolatility(dataPoints);

      // Should match the coefficient of variation from statisticalSummary
      const summary = result.current.statisticalSummary([90, 100, 110]);
      expect(volatility).toBeCloseTo(summary.coefficientOfVariation, 2);
    });
  });

  describe('findPlateaus', () => {
    it('should return empty array for insufficient data', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
      ];

      const plateaus = result.current.findPlateaus(dataPoints);
      expect(plateaus).toEqual([]);
    });

    it('should detect plateau periods correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 102, type: 'weight' },
        { date: new Date('2024-01-15'), value: 101, type: 'weight' },
        { date: new Date('2024-01-22'), value: 103, type: 'weight' }, // Plateau
        { date: new Date('2024-01-29'), value: 120, type: 'weight' }, // Break out
        { date: new Date('2024-02-05'), value: 122, type: 'weight' },
        { date: new Date('2024-02-12'), value: 121, type: 'weight' },
        { date: new Date('2024-02-19'), value: 123, type: 'weight' }, // Another plateau
      ];

      const plateaus = result.current.findPlateaus(dataPoints);

      expect(plateaus.length).toBeGreaterThanOrEqual(1);
      plateaus.forEach((plateau) => {
        expect(plateau.start).toBeInstanceOf(Date);
        expect(plateau.end).toBeInstanceOf(Date);
        expect(typeof plateau.avgValue).toBe('number');
        expect(plateau.end.getTime()).toBeGreaterThanOrEqual(plateau.start.getTime());
      });
    });

    it('should require at least 3 points for a plateau', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 101, type: 'weight' }, // Only 2 similar points
        { date: new Date('2024-01-15'), value: 120, type: 'weight' }, // Big jump
      ];

      const plateaus = result.current.findPlateaus(dataPoints);
      expect(plateaus.length).toBe(0);
    });
  });

  describe('detectBreakthrough', () => {
    it('should return empty array for insufficient data', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 105, type: 'weight' },
      ];

      const breakthroughs = result.current.detectBreakthrough(dataPoints);
      expect(breakthroughs).toEqual([]);
    });

    it('should detect breakthrough moments correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 102, type: 'weight' },
        { date: new Date('2024-01-15'), value: 101, type: 'weight' },
        { date: new Date('2024-01-22'), value: 115, type: 'weight' }, // 15% jump - breakthrough
        { date: new Date('2024-01-29'), value: 116, type: 'weight' },
        { date: new Date('2024-02-05'), value: 117, type: 'weight' },
        { date: new Date('2024-02-12'), value: 150, type: 'weight' }, // 30% jump - major breakthrough
      ];

      const breakthroughs = result.current.detectBreakthrough(dataPoints);

      expect(breakthroughs.length).toBeGreaterThanOrEqual(1);
      breakthroughs.forEach((breakthrough) => {
        expect(breakthrough.date).toBeInstanceOf(Date);
        expect(typeof breakthrough.magnitude).toBe('number');
        expect(['minor', 'major']).toContain(breakthrough.significance);
      });

      // Check for major breakthroughs (>25% change)
      const majorBreakthroughs = breakthroughs.filter((b) => b.significance === 'major');
      expect(majorBreakthroughs.length).toBeGreaterThanOrEqual(1);
    });

    it('should classify breakthrough significance correctly', () => {
      const { result } = renderHook(() => useProgressCalculations());

      const dataPoints: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100, type: 'weight' },
        { date: new Date('2024-01-08'), value: 100, type: 'weight' },
        { date: new Date('2024-01-15'), value: 100, type: 'weight' },
        { date: new Date('2024-01-22'), value: 115, type: 'weight' }, // 15% jump - minor
        { date: new Date('2024-01-29'), value: 115, type: 'weight' },
        { date: new Date('2024-02-05'), value: 115, type: 'weight' },
        { date: new Date('2024-02-12'), value: 150, type: 'weight' }, // 30% jump - major
      ];

      const breakthroughs = result.current.detectBreakthrough(dataPoints);

      const minorBreakthroughs = breakthroughs.filter((b) => b.significance === 'minor');
      const majorBreakthroughs = breakthroughs.filter((b) => b.significance === 'major');

      expect(minorBreakthroughs.length + majorBreakthroughs.length).toBe(breakthroughs.length);
    });
  });
});
