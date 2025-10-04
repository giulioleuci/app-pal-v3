import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnitSystem, useMetricConversions } from '../useMetricConversions';

// Mock navigator.language
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US',
});

describe('useMetricConversions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset navigator.language to default
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'en-US',
    });
  });

  describe('initialization', () => {
    it('should initialize with correct default functions', () => {
      const { result } = renderHook(() => useMetricConversions());

      expect(typeof result.current.convertWeight).toBe('function');
      expect(typeof result.current.convertHeight).toBe('function');
      expect(typeof result.current.convertDistance).toBe('function');
      expect(typeof result.current.formatForDisplay).toBe('function');
      expect(typeof result.current.getPreferredUnit).toBe('function');
      expect(typeof result.current.autoConvert).toBe('function');
      expect(typeof result.current.isMetric).toBe('boolean');
      expect(typeof result.current.isImperial).toBe('boolean');
    });

    it('should default to imperial for en-US locale', () => {
      const { result } = renderHook(() => useMetricConversions());

      expect(result.current.isImperial).toBe(true);
      expect(result.current.isMetric).toBe(false);
    });

    it('should default to metric for non-US locale', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en-GB',
      });

      const { result } = renderHook(() => useMetricConversions());

      expect(result.current.isMetric).toBe(true);
      expect(result.current.isImperial).toBe(false);
    });
  });

  describe('unit system detection', () => {
    it('should use metric system when explicitly specified', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'metric' }));

      expect(result.current.isMetric).toBe(true);
      expect(result.current.isImperial).toBe(false);
    });

    it('should use imperial system when explicitly specified', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'imperial' }));

      expect(result.current.isMetric).toBe(false);
      expect(result.current.isImperial).toBe(true);
    });

    it('should auto-detect based on locale when set to auto', () => {
      const { result: usResult } = renderHook(() =>
        useMetricConversions({
          preferredUnits: 'auto',
          locale: 'en-US',
        })
      );

      expect(usResult.current.isImperial).toBe(true);

      const { result: gbResult } = renderHook(() =>
        useMetricConversions({
          preferredUnits: 'auto',
          locale: 'en-GB',
        })
      );

      expect(gbResult.current.isMetric).toBe(true);
    });
  });

  describe('weight conversion', () => {
    it('should convert kg to lbs correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const lbsValue = result.current.convertWeight(70, 'kg', 'lbs');
      expect(lbsValue).toBeCloseTo(154.32, 1);
    });

    it('should convert lbs to kg correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const kgValue = result.current.convertWeight(150, 'lbs', 'kg');
      expect(kgValue).toBeCloseTo(68.04, 1);
    });

    it('should return same value when units are identical', () => {
      const { result } = renderHook(() => useMetricConversions());

      const sameValue = result.current.convertWeight(70, 'kg', 'kg');
      expect(sameValue).toBe(70);
    });
  });

  describe('height conversion', () => {
    it('should convert cm to ft-in correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const inchesValue = result.current.convertHeight(180, 'cm', 'ft-in');
      expect(inchesValue).toBeCloseTo(70.87, 1); // ~70.87 inches
    });

    it('should convert ft-in to cm correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const cmValue = result.current.convertHeight(72, 'ft-in', 'cm');
      expect(cmValue).toBeCloseTo(182.88, 1);
    });

    it('should convert cm to meters correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const mValue = result.current.convertHeight(180, 'cm', 'm');
      expect(mValue).toBe(1.8);
    });
  });

  describe('distance conversion', () => {
    it('should convert km to miles correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const milesValue = result.current.convertDistance(5, 'km', 'mi');
      expect(milesValue).toBeCloseTo(3.11, 1);
    });

    it('should convert miles to km correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const kmValue = result.current.convertDistance(3, 'mi', 'km');
      expect(kmValue).toBeCloseTo(4.83, 1);
    });

    it('should convert meters to feet correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const feetValue = result.current.convertDistance(100, 'm', 'ft');
      expect(feetValue).toBeCloseTo(328.08, 1);
    });
  });

  describe('preferred unit detection', () => {
    it('should return metric units when system is metric', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'metric' }));

      expect(result.current.getPreferredUnit('weight')).toBe('kg');
      expect(result.current.getPreferredUnit('height')).toBe('cm');
      expect(result.current.getPreferredUnit('distance')).toBe('km');
    });

    it('should return imperial units when system is imperial', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'imperial' }));

      expect(result.current.getPreferredUnit('weight')).toBe('lbs');
      expect(result.current.getPreferredUnit('height')).toBe('ft-in');
      expect(result.current.getPreferredUnit('distance')).toBe('mi');
    });
  });

  describe('display formatting', () => {
    it('should format weight values correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const kgFormatted = result.current.formatForDisplay(70.5, 'weight', 'kg');
      expect(kgFormatted).toBe('70.5 kg');

      const lbsFormatted = result.current.formatForDisplay(154.3, 'weight', 'lbs');
      expect(lbsFormatted).toBe('154.3 lbs');
    });

    it('should format height in feet and inches correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const feetInchesFormatted = result.current.formatForDisplay(71, 'height', 'ft-in');
      expect(feetInchesFormatted).toBe('5\' 11"');
    });

    it('should format height in cm correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const cmFormatted = result.current.formatForDisplay(180, 'height', 'cm');
      expect(cmFormatted).toBe('180 cm');
    });

    it('should format distance values correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const kmFormatted = result.current.formatForDisplay(5.25, 'distance', 'km');
      expect(kmFormatted).toBe('5.25 km');

      const miFormatted = result.current.formatForDisplay(3.1, 'distance', 'mi');
      expect(miFormatted).toBe('3.1 mi');
    });
  });

  describe('auto conversion', () => {
    it('should auto-convert to preferred metric units', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'metric' }));

      const converted = result.current.autoConvert(150, 'weight', 'lbs');

      expect(converted.unit).toBe('kg');
      expect(converted.value).toBeCloseTo(68.04, 1);
      expect(converted.formatted).toBe('68 kg');
    });

    it('should auto-convert to preferred imperial units', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'imperial' }));

      const converted = result.current.autoConvert(70, 'weight', 'kg');

      expect(converted.unit).toBe('lbs');
      expect(converted.value).toBeCloseTo(154.32, 1);
      expect(converted.formatted).toBe('154.3 lbs');
    });

    it('should not convert when units already match preference', () => {
      const { result } = renderHook(() => useMetricConversions({ preferredUnits: 'metric' }));

      const converted = result.current.autoConvert(70, 'weight', 'kg');

      expect(converted.unit).toBe('kg');
      expect(converted.value).toBe(70);
      expect(converted.formatted).toBe('70 kg');
    });
  });

  describe('edge cases', () => {
    it('should handle zero values correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      expect(result.current.convertWeight(0, 'kg', 'lbs')).toBe(0);
      expect(result.current.convertHeight(0, 'cm', 'ft-in')).toBe(0);
      expect(result.current.convertDistance(0, 'km', 'mi')).toBe(0);
    });

    it('should handle negative values correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      expect(result.current.convertWeight(-10, 'kg', 'lbs')).toBeCloseTo(-22.046, 1);
    });

    it('should handle very large values correctly', () => {
      const { result } = renderHook(() => useMetricConversions());

      const largeValue = result.current.convertWeight(1000, 'kg', 'lbs');
      expect(largeValue).toBeCloseTo(2204.62, 1);
    });
  });
});
