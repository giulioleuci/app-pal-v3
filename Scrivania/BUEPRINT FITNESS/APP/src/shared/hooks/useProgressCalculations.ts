import { useMemo } from 'react';

export interface DataPoint {
  date: Date;
  value: number;
  type: 'weight' | 'volume' | 'frequency';
}

export interface TrendData {
  direction: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  rSquared: number; // Correlation coefficient
  confidenceLevel: 'high' | 'medium' | 'low';
  changePerWeek: number;
  changePercentage: number;
}

export interface ProgressRate {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  unit: string;
  period: string;
}

export interface ProjectedData {
  date: Date;
  projectedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface StatsSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  coefficientOfVariation: number;
}

interface UseProgressCalculationsResult {
  calculateTrend: (dataPoints: DataPoint[]) => TrendData;
  getProgressRate: (dataPoints: DataPoint[]) => ProgressRate;
  projectFutureProgress: (dataPoints: DataPoint[], timeframe: number) => ProjectedData[];
  statisticalSummary: (values: number[]) => StatsSummary;
  calculateVolatility: (dataPoints: DataPoint[]) => number;
  findPlateaus: (dataPoints: DataPoint[]) => Array<{ start: Date; end: Date; avgValue: number }>;
  detectBreakthrough: (
    dataPoints: DataPoint[]
  ) => Array<{ date: Date; magnitude: number; significance: 'minor' | 'major' }>;
}

/**
 * Hook for statistical analysis and progress calculations.
 *
 * Provides pure calculation functions for analyzing progress data points.
 * Does not fetch data - takes data as parameters for analysis.
 *
 * @returns Object with calculation functions and analysis tools
 *
 * @example
 * ```typescript
 * const {
 *   calculateTrend,
 *   getProgressRate,
 *   projectFutureProgress,
 *   statisticalSummary
 * } = useProgressCalculations();
 *
 * // Analyze strength progression
 * const maxLogData = maxLogs.map(log => ({
 *   date: log.achievedDate,
 *   value: log.weight,
 *   type: 'weight' as const
 * }));
 *
 * const trend = calculateTrend(maxLogData);
 * const rate = getProgressRate(maxLogData);
 * const projections = projectFutureProgress(maxLogData, 90); // 90 days
 *
 * return (
 *   <Box>
 *     <TrendIndicator trend={trend} />
 *     <ProgressRate rate={rate} />
 *     <ProjectionChart projections={projections} />
 *   </Box>
 * );
 * ```
 */
export function useProgressCalculations(): UseProgressCalculationsResult {
  /**
   * Calculates trend analysis for a series of data points
   */
  const calculateTrend = useMemo(() => {
    return (dataPoints: DataPoint[]): TrendData => {
      if (dataPoints.length < 2) {
        return {
          direction: 'stable',
          slope: 0,
          rSquared: 0,
          confidenceLevel: 'low',
          changePerWeek: 0,
          changePercentage: 0,
        };
      }

      // Sort by date
      const sortedPoints = [...dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());

      // Convert dates to numeric values (days since first point)
      const firstDate = sortedPoints[0].date.getTime();
      const points = sortedPoints.map((point) => ({
        x: (point.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
        y: point.value,
      }));

      // Linear regression
      const n = points.length;
      const sumX = points.reduce((sum, p) => sum + p.x, 0);
      const sumY = points.reduce((sum, p) => sum + p.y, 0);
      const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate R-squared
      const meanY = sumY / n;
      const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
      const residualSumSquares = points.reduce((sum, p) => {
        const predicted = slope * p.x + intercept;
        return sum + Math.pow(p.y - predicted, 2);
      }, 0);

      const rSquared = totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0;

      // Determine trend direction
      let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
      const slopeThreshold = Math.abs(meanY) * 0.001; // 0.1% threshold relative to mean

      if (Math.abs(slope) > slopeThreshold) {
        direction = slope > 0 ? 'increasing' : 'decreasing';
      }

      // Determine confidence level
      let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
      if (n >= 10 && rSquared > 0.7) {
        confidenceLevel = 'high';
      } else if (n >= 5 && rSquared > 0.5) {
        confidenceLevel = 'medium';
      }

      // Calculate change rates
      const changePerWeek = slope * 7; // Convert daily slope to weekly
      const firstValue = sortedPoints[0].value;
      const changePercentage = firstValue > 0 ? (changePerWeek / firstValue) * 100 : 0;

      return {
        direction,
        slope,
        rSquared,
        confidenceLevel,
        changePerWeek,
        changePercentage,
      };
    };
  }, []);

  /**
   * Calculates progress rate from data points
   */
  const getProgressRate = useMemo(() => {
    return (dataPoints: DataPoint[]): ProgressRate => {
      if (dataPoints.length < 2) {
        return {
          dailyRate: 0,
          weeklyRate: 0,
          monthlyRate: 0,
          unit: 'units',
          period: 'day',
        };
      }

      const trend = calculateTrend(dataPoints);

      return {
        dailyRate: trend.slope,
        weeklyRate: trend.slope * 7,
        monthlyRate: trend.slope * 30,
        unit: dataPoints[0].type === 'weight' ? 'kg' : 'units',
        period: 'day',
      };
    };
  }, [calculateTrend]);

  /**
   * Projects future progress based on historical data
   */
  const projectFutureProgress = useMemo(() => {
    return (dataPoints: DataPoint[], timeframeDays: number): ProjectedData[] => {
      if (dataPoints.length < 3) return [];

      const trend = calculateTrend(dataPoints);
      const stats = statisticalSummary(dataPoints.map((p) => p.value));

      const projections: ProjectedData[] = [];
      const lastPoint = dataPoints[dataPoints.length - 1];
      const standardError = stats.standardDeviation / Math.sqrt(dataPoints.length);
      const confidenceMultiplier = 1.96; // 95% confidence interval

      // Generate projections for the next timeframe
      const intervalDays = Math.max(1, Math.floor(timeframeDays / 10)); // 10 projection points

      for (let i = intervalDays; i <= timeframeDays; i += intervalDays) {
        const projectedValue = lastPoint.value + trend.slope * i;
        const projectionDate = new Date(lastPoint.date);
        projectionDate.setDate(projectionDate.getDate() + i);

        // Adjust confidence interval based on projection distance
        const distanceMultiplier = Math.sqrt(i / 7); // Uncertainty increases with time
        const margin = confidenceMultiplier * standardError * distanceMultiplier;

        projections.push({
          date: projectionDate,
          projectedValue,
          confidenceInterval: {
            lower: projectedValue - margin,
            upper: projectedValue + margin,
          },
        });
      }

      return projections;
    };
  }, [calculateTrend]);

  /**
   * Calculates comprehensive statistical summary
   */
  const statisticalSummary = useMemo(() => {
    return (values: number[]): StatsSummary => {
      if (values.length === 0) {
        return {
          mean: 0,
          median: 0,
          standardDeviation: 0,
          variance: 0,
          min: 0,
          max: 0,
          range: 0,
          coefficientOfVariation: 0,
        };
      }

      const sortedValues = [...values].sort((a, b) => a - b);
      const n = values.length;

      // Mean
      const mean = values.reduce((sum, val) => sum + val, 0) / n;

      // Median
      const median =
        n % 2 === 0
          ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
          : sortedValues[Math.floor(n / 2)];

      // Variance and standard deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const standardDeviation = Math.sqrt(variance);

      // Min, max, range
      const min = sortedValues[0];
      const max = sortedValues[n - 1];
      const range = max - min;

      // Coefficient of variation
      const coefficientOfVariation = mean !== 0 ? (standardDeviation / mean) * 100 : 0;

      return {
        mean,
        median,
        standardDeviation,
        variance,
        min,
        max,
        range,
        coefficientOfVariation,
      };
    };
  }, []);

  /**
   * Calculates volatility (coefficient of variation)
   */
  const calculateVolatility = useMemo(() => {
    return (dataPoints: DataPoint[]): number => {
      const values = dataPoints.map((p) => p.value);
      const stats = statisticalSummary(values);
      return stats.coefficientOfVariation;
    };
  }, [statisticalSummary]);

  /**
   * Detects plateau periods in progress
   */
  const findPlateaus = useMemo(() => {
    return (dataPoints: DataPoint[]) => {
      if (dataPoints.length < 5) return [];

      const sortedPoints = [...dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());
      const plateaus: Array<{ start: Date; end: Date; avgValue: number }> = [];

      let currentPlateau: DataPoint[] = [];
      const plateauThreshold = 0.05; // 5% variation considered plateau

      for (let i = 0; i < sortedPoints.length; i++) {
        if (currentPlateau.length === 0) {
          currentPlateau.push(sortedPoints[i]);
          continue;
        }

        const plateauMean =
          currentPlateau.reduce((sum, p) => sum + p.value, 0) / currentPlateau.length;
        const variation = Math.abs(sortedPoints[i].value - plateauMean) / plateauMean;

        if (variation <= plateauThreshold) {
          currentPlateau.push(sortedPoints[i]);
        } else {
          // End current plateau if it's significant (at least 3 points)
          if (currentPlateau.length >= 3) {
            plateaus.push({
              start: currentPlateau[0].date,
              end: currentPlateau[currentPlateau.length - 1].date,
              avgValue: plateauMean,
            });
          }
          currentPlateau = [sortedPoints[i]];
        }
      }

      // Check final plateau
      if (currentPlateau.length >= 3) {
        const plateauMean =
          currentPlateau.reduce((sum, p) => sum + p.value, 0) / currentPlateau.length;
        plateaus.push({
          start: currentPlateau[0].date,
          end: currentPlateau[currentPlateau.length - 1].date,
          avgValue: plateauMean,
        });
      }

      return plateaus;
    };
  }, []);

  /**
   * Detects significant breakthrough moments
   */
  const detectBreakthrough = useMemo(() => {
    return (dataPoints: DataPoint[]) => {
      if (dataPoints.length < 5) return [];

      const sortedPoints = [...dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());
      const breakthroughs: Array<{
        date: Date;
        magnitude: number;
        significance: 'minor' | 'major';
      }> = [];

      // Check for breakthroughs by comparing consecutive windows
      for (let i = 1; i < sortedPoints.length; i++) {
        const currentValue = sortedPoints[i].value;
        const previousValue = sortedPoints[i - 1].value;

        const change = currentValue - previousValue;
        const magnitude = Math.abs(change) / previousValue;

        if (magnitude > 0.1) {
          // 10% change threshold
          breakthroughs.push({
            date: sortedPoints[i].date,
            magnitude: change,
            significance: magnitude > 0.25 ? 'major' : 'minor',
          });
        }
      }

      return breakthroughs;
    };
  }, []);

  return {
    calculateTrend,
    getProgressRate,
    projectFutureProgress,
    statisticalSummary,
    calculateVolatility,
    findPlateaus,
    detectBreakthrough,
  };
}
