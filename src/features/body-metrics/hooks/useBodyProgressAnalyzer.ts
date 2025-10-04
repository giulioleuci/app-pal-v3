import { useMemo } from 'react';
import { container } from 'tsyringe';

import { BodyMetricsQueryService } from '@/features/body-metrics/query-services/BodyMetricsQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';
import { heightRecordsToDomain, weightRecordsToDomain } from '@/shared/utils/transformations';

export interface TrendData {
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number; // Rate of change per week
  confidence: 'high' | 'medium' | 'low';
  dataPoints: Array<{ date: Date; value: number }>;
}

export interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'concerning';
  recommendation?: string;
}

export interface PredictionData {
  targetDate: Date;
  predictedValue: number;
  confidence: number; // 0-1
  basedOnDays: number;
}

interface UseBodyProgressAnalyzerResult {
  weightTrend: TrendData;
  bodyCompositionTrend: TrendData;
  calculateBMI: () => number | null;
  healthMetrics: HealthMetric[];
  progressPrediction: PredictionData | null;
}

/**
 * Hook for advanced body metrics analysis and health insights.
 *
 * Provides comprehensive analysis of weight trends, body composition changes,
 * BMI calculations, and health metrics using historical body metrics data.
 * Includes predictive analytics for future progress estimation and health recommendations.
 *
 * @param profileId The profile ID to analyze body metrics for
 * @returns Object with trend analysis, health metrics, and predictions
 *
 * @example
 * ```typescript
 * const {
 *   weightTrend,
 *   calculateBMI,
 *   healthMetrics,
 *   progressPrediction
 * } = useBodyProgressAnalyzer(profileId);
 *
 * return (
 *   <Box>
 *     <Typography>Weight Trend: {weightTrend.direction}</Typography>
 *     <Typography>BMI: {calculateBMI()}</Typography>
 *     {healthMetrics.map(metric => (
 *       <HealthMetricCard key={metric.name} metric={metric} />
 *     ))}
 *     {progressPrediction && (
 *       <PredictionChart data={progressPrediction} />
 *     )}
 *   </Box>
 * );
 * ```
 */
export function useBodyProgressAnalyzer(profileId: string): UseBodyProgressAnalyzerResult {
  const bodyMetricsQueryService = container.resolve(BodyMetricsQueryService);

  // Get weight history
  const weightHistoryQuery = profileId ? bodyMetricsQueryService.getWeightHistory(profileId) : null;
  const { data: weightRecords } = useObserveQuery(weightHistoryQuery, {
    transform: weightRecordsToDomain,
    enabled: !!profileId,
  });

  // Get height history
  const heightHistoryQuery = profileId ? bodyMetricsQueryService.getHeightHistory(profileId) : null;
  const { data: heightRecords } = useObserveQuery(heightHistoryQuery, {
    transform: heightRecordsToDomain,
    enabled: !!profileId,
  });

  const analysisData = useMemo(() => {
    const defaultResult: UseBodyProgressAnalyzerResult = {
      weightTrend: {
        direction: 'stable',
        rate: 0,
        confidence: 'low',
        dataPoints: [],
      },
      bodyCompositionTrend: {
        direction: 'stable',
        rate: 0,
        confidence: 'low',
        dataPoints: [],
      },
      calculateBMI: () => null,
      healthMetrics: [],
      progressPrediction: null,
    };

    if (!weightRecords || !heightRecords) {
      return defaultResult;
    }

    // Analyze weight trend
    const weightTrend = analyzeWeightTrend(weightRecords);

    // For now, body composition trend is same as weight (could be enhanced with body fat %)
    const bodyCompositionTrend = { ...weightTrend };

    // BMI calculation function
    const calculateBMI = (): number | null => {
      if (!weightRecords.length || !heightRecords.length) return null;

      const latestWeight = weightRecords[weightRecords.length - 1];
      const latestHeight = heightRecords[heightRecords.length - 1];

      if (!latestWeight || !latestHeight) return null;

      // BMI = weight (kg) / height (m)²
      const heightInMeters = latestHeight.height / 100; // Assuming height is in cm
      const bmi = latestWeight.weight / (heightInMeters * heightInMeters);

      return Math.round(bmi * 10) / 10; // Round to 1 decimal
    };

    // Generate health metrics
    const healthMetrics = generateHealthMetrics(weightRecords, heightRecords, calculateBMI());

    // Generate progress prediction
    const progressPrediction = generateProgressPrediction(weightRecords);

    return {
      weightTrend,
      bodyCompositionTrend,
      calculateBMI,
      healthMetrics,
      progressPrediction,
    };
  }, [weightRecords, heightRecords]);

  return analysisData;
}

/**
 * Analyzes weight trend from historical data
 */
function analyzeWeightTrend(weightRecords: any[]): TrendData {
  if (!weightRecords || weightRecords.length < 2) {
    return {
      direction: 'stable',
      rate: 0,
      confidence: 'low',
      dataPoints: [],
    };
  }

  // Sort by date
  const sortedRecords = [...weightRecords].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  // Create data points
  const dataPoints = sortedRecords.map((record) => ({
    date: new Date(record.recordedAt),
    value: record.weight,
  }));

  // Calculate linear regression for trend
  const { slope, confidence } = calculateLinearRegression(dataPoints);

  // Convert slope to weekly rate (slope is per day)
  const weeklyRate = slope * 7;

  // Determine direction
  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(weeklyRate) > 0.1) {
    // Threshold for significant change
    direction = weeklyRate > 0 ? 'increasing' : 'decreasing';
  }

  return {
    direction,
    rate: Math.abs(weeklyRate),
    confidence,
    dataPoints,
  };
}

/**
 * Calculates linear regression for trend analysis
 */
function calculateLinearRegression(dataPoints: Array<{ date: Date; value: number }>) {
  if (dataPoints.length < 2) {
    return { slope: 0, confidence: 'low' as const };
  }

  // Convert dates to numeric values (days since first record)
  const firstDate = dataPoints[0].date.getTime();
  const points = dataPoints.map((point) => ({
    x: (point.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
    y: point.value,
  }));

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Calculate R-squared for confidence
  const meanY = sumY / n;
  const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const residualSumSquares = points.reduce((sum, p) => {
    const predicted = slope * p.x + (sumY - slope * sumX) / n;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);

  const rSquared = totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0;

  // Determine confidence based on R-squared and sample size
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (n >= 10 && rSquared > 0.7) confidence = 'high';
  else if (n >= 5 && rSquared > 0.5) confidence = 'medium';

  return { slope, confidence };
}

/**
 * Generates health metrics and recommendations
 */
function generateHealthMetrics(
  weightRecords: any[],
  heightRecords: any[],
  bmi: number | null
): HealthMetric[] {
  const metrics: HealthMetric[] = [];

  // BMI metric
  if (bmi !== null) {
    let status: 'healthy' | 'warning' | 'concerning' = 'healthy';
    let recommendation: string | undefined;

    if (bmi < 18.5) {
      status = 'warning';
      recommendation =
        'Consider consulting with a healthcare provider about healthy weight gain strategies.';
    } else if (bmi >= 25 && bmi < 30) {
      status = 'warning';
      recommendation =
        'Consider a balanced approach to nutrition and regular exercise for optimal health.';
    } else if (bmi >= 30) {
      status = 'concerning';
      recommendation =
        'Consider consulting with a healthcare provider about weight management strategies.';
    }

    metrics.push({
      name: 'Body Mass Index',
      value: bmi,
      unit: 'kg/m²',
      status,
      recommendation,
    });
  }

  // Weight change rate metric
  if (weightRecords.length >= 2) {
    const recentWeights = weightRecords.slice(-4); // Last 4 measurements
    if (recentWeights.length >= 2) {
      const firstWeight = recentWeights[0].weight;
      const lastWeight = recentWeights[recentWeights.length - 1].weight;
      const timeDiff =
        new Date(recentWeights[recentWeights.length - 1].recordedAt).getTime() -
        new Date(recentWeights[0].recordedAt).getTime();
      const weeksDiff = timeDiff / (1000 * 60 * 60 * 24 * 7);

      const weeklyChangeRate = Math.abs(lastWeight - firstWeight) / weeksDiff;

      let status: 'healthy' | 'warning' | 'concerning' = 'healthy';
      let recommendation: string | undefined;

      if (weeklyChangeRate > 1) {
        status = 'warning';
        recommendation =
          'Rapid weight changes may not be sustainable. Consider a more gradual approach.';
      } else if (weeklyChangeRate > 2) {
        status = 'concerning';
        recommendation =
          'Very rapid weight changes should be discussed with a healthcare provider.';
      }

      metrics.push({
        name: 'Weekly Weight Change Rate',
        value: Math.round(weeklyChangeRate * 100) / 100,
        unit: 'kg/week',
        status,
        recommendation,
      });
    }
  }

  return metrics;
}

/**
 * Generates progress predictions based on historical data
 */
function generateProgressPrediction(weightRecords: any[]): PredictionData | null {
  if (!weightRecords || weightRecords.length < 5) {
    return null; // Need at least 5 data points for reliable prediction
  }

  const sortedRecords = [...weightRecords].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  // Use last 30 days of data for prediction
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRecords = sortedRecords.filter(
    (record) => new Date(record.recordedAt) >= thirtyDaysAgo
  );

  if (recentRecords.length < 3) {
    return null;
  }

  const dataPoints = recentRecords.map((record) => ({
    date: new Date(record.recordedAt),
    value: record.weight,
  }));

  const { slope, confidence } = calculateLinearRegression(dataPoints);

  // Predict 30 days into the future
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);

  const currentWeight = sortedRecords[sortedRecords.length - 1].weight;
  const predictedValue = currentWeight + slope * 30; // 30 days of change

  // Convert confidence to numeric score
  const confidenceScore = confidence === 'high' ? 0.8 : confidence === 'medium' ? 0.6 : 0.4;

  return {
    targetDate,
    predictedValue: Math.round(predictedValue * 10) / 10,
    confidence: confidenceScore,
    basedOnDays: recentRecords.length,
  };
}
