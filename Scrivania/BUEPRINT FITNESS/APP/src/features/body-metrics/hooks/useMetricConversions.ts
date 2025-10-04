import { useCallback, useMemo } from 'react';

export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft-in' | 'm';
export type DistanceUnit = 'km' | 'mi' | 'm' | 'ft';
export type Unit = WeightUnit | HeightUnit | DistanceUnit;

export type MetricType = 'weight' | 'height' | 'distance';
export type UnitSystem = 'metric' | 'imperial' | 'auto';

export interface ConversionResult {
  value: number;
  unit: Unit;
  formatted: string;
}

export interface UseMetricConversionsOptions {
  preferredUnits?: UnitSystem;
  locale?: string;
}

interface UseMetricConversionsResult {
  convertWeight: (value: number, from: WeightUnit, to: WeightUnit) => number;
  convertHeight: (value: number, from: HeightUnit, to: HeightUnit) => number;
  convertDistance: (value: number, from: DistanceUnit, to: DistanceUnit) => number;
  formatForDisplay: (value: number, type: MetricType, unit: Unit) => string;
  getPreferredUnit: (metricType: MetricType) => Unit;
  autoConvert: (value: number, type: MetricType, fromUnit: Unit) => ConversionResult;
  isMetric: boolean;
  isImperial: boolean;
}

/**
 * Hook for unit conversion utilities and formatting for body metrics display.
 *
 * Centralizes conversion logic scattered across components and provides consistent
 * formatting based on user preferences. Handles weight, height, and distance
 * conversions with proper rounding and display formatting.
 *
 * @param options Configuration options for unit preferences and locale
 * @returns Object with conversion functions and formatting utilities
 *
 * @example
 * ```typescript
 * const {
 *   convertWeight,
 *   formatForDisplay,
 *   getPreferredUnit,
 *   autoConvert,
 *   isMetric
 * } = useMetricConversions({
 *   preferredUnits: 'metric',
 *   locale: 'en-US'
 * });
 *
 * // Convert weight values
 * const kgValue = convertWeight(150, 'lbs', 'kg'); // 68.04
 *
 * // Auto-convert to user's preferred unit
 * const converted = autoConvert(70, 'weight', 'kg');
 * // Result: { value: 154.32, unit: 'lbs', formatted: '154.3 lbs' }
 *
 * // Format for display
 * const display = formatForDisplay(180, 'height', 'cm'); // "180 cm" or "5' 11\""
 *
 * return (
 *   <Box>
 *     <Typography>Weight: {converted.formatted}</Typography>
 *     <Typography>System: {isMetric ? 'Metric' : 'Imperial'}</Typography>
 *   </Box>
 * );
 * ```
 */
export function useMetricConversions(
  options: UseMetricConversionsOptions = {}
): UseMetricConversionsResult {
  const { preferredUnits = 'auto', locale } = options;

  // Determine user's preferred unit system
  const { isMetric, isImperial } = useMemo(() => {
    if (preferredUnits === 'metric') {
      return { isMetric: true, isImperial: false };
    } else if (preferredUnits === 'imperial') {
      return { isMetric: false, isImperial: true };
    } else {
      // Auto-detect based on locale
      const userLocale = locale || navigator.language || 'en-US';
      const usesImperial = ['en-US', 'en-LR', 'en-MM'].includes(userLocale);
      return { isMetric: !usesImperial, isImperial: usesImperial };
    }
  }, [preferredUnits, locale]);

  /**
   * Converts weight between kg and lbs
   */
  const convertWeight = useCallback((value: number, from: WeightUnit, to: WeightUnit): number => {
    if (from === to) return value;

    let kgValue = value;

    // Convert to kg first
    if (from === 'lbs') {
      kgValue = value / 2.20462;
    }

    // Convert from kg to target unit
    if (to === 'lbs') {
      return kgValue * 2.20462;
    }

    return kgValue;
  }, []);

  /**
   * Converts height between different units
   */
  const convertHeight = useCallback((value: number, from: HeightUnit, to: HeightUnit): number => {
    if (from === to) return value;

    let cmValue = value;

    // Convert to cm first
    if (from === 'm') {
      cmValue = value * 100;
    } else if (from === 'ft-in') {
      // Assumes value is total inches
      cmValue = value * 2.54;
    }

    // Convert from cm to target unit
    if (to === 'm') {
      return cmValue / 100;
    } else if (to === 'ft-in') {
      return cmValue / 2.54; // Returns total inches
    }

    return cmValue;
  }, []);

  /**
   * Converts distance between different units
   */
  const convertDistance = useCallback(
    (value: number, from: DistanceUnit, to: DistanceUnit): number => {
      if (from === to) return value;

      let meterValue = value;

      // Convert to meters first
      switch (from) {
        case 'km':
          meterValue = value * 1000;
          break;
        case 'mi':
          meterValue = value * 1609.34;
          break;
        case 'ft':
          meterValue = value * 0.3048;
          break;
        case 'm':
          meterValue = value;
          break;
      }

      // Convert from meters to target unit
      switch (to) {
        case 'km':
          return meterValue / 1000;
        case 'mi':
          return meterValue / 1609.34;
        case 'ft':
          return meterValue / 0.3048;
        case 'm':
          return meterValue;
        default:
          return meterValue;
      }
    },
    []
  );

  /**
   * Gets the preferred unit for a metric type based on user preferences
   */
  const getPreferredUnit = useCallback(
    (metricType: MetricType): Unit => {
      switch (metricType) {
        case 'weight':
          return isMetric ? 'kg' : 'lbs';
        case 'height':
          return isMetric ? 'cm' : 'ft-in';
        case 'distance':
          return isMetric ? 'km' : 'mi';
        default:
          return 'kg';
      }
    },
    [isMetric]
  );

  /**
   * Formats a value for display with appropriate units and precision
   */
  const formatForDisplay = useCallback((value: number, type: MetricType, unit: Unit): string => {
    switch (type) {
      case 'weight':
        const weightPrecision = unit === 'kg' ? 1 : 1;
        const weightValue =
          Math.round(value * Math.pow(10, weightPrecision)) / Math.pow(10, weightPrecision);
        return `${weightValue} ${unit}`;

      case 'height':
        if (unit === 'ft-in') {
          const totalInches = Math.round(value);
          const feet = Math.floor(totalInches / 12);
          const inches = totalInches % 12;
          return `${feet}' ${inches}"`;
        } else if (unit === 'm') {
          const mValue = Math.round(value * 100) / 100;
          return `${mValue} m`;
        } else {
          const cmValue = Math.round(value);
          return `${cmValue} cm`;
        }

      case 'distance':
        const distancePrecision = unit === 'km' || unit === 'mi' ? 2 : 0;
        const distanceValue =
          Math.round(value * Math.pow(10, distancePrecision)) / Math.pow(10, distancePrecision);
        return `${distanceValue} ${unit}`;

      default:
        return `${Math.round(value * 10) / 10} ${unit}`;
    }
  }, []);

  /**
   * Automatically converts a value to the user's preferred unit system
   */
  const autoConvert = useCallback(
    (value: number, type: MetricType, fromUnit: Unit): ConversionResult => {
      const preferredUnit = getPreferredUnit(type);
      let convertedValue = value;

      // Perform conversion if needed
      if (fromUnit !== preferredUnit) {
        switch (type) {
          case 'weight':
            convertedValue = convertWeight(
              value,
              fromUnit as WeightUnit,
              preferredUnit as WeightUnit
            );
            break;
          case 'height':
            convertedValue = convertHeight(
              value,
              fromUnit as HeightUnit,
              preferredUnit as HeightUnit
            );
            break;
          case 'distance':
            convertedValue = convertDistance(
              value,
              fromUnit as DistanceUnit,
              preferredUnit as DistanceUnit
            );
            break;
        }
      }

      return {
        value: convertedValue,
        unit: preferredUnit,
        formatted: formatForDisplay(convertedValue, type, preferredUnit),
      };
    },
    [getPreferredUnit, convertWeight, convertHeight, convertDistance, formatForDisplay]
  );

  return {
    convertWeight,
    convertHeight,
    convertDistance,
    formatForDisplay,
    getPreferredUnit,
    autoConvert,
    isMetric,
    isImperial,
  };
}
