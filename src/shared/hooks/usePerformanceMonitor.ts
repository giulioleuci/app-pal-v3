import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Performance metrics for aggregate hooks
 */
export interface AggregatePerformanceMetrics {
  hookName: string;
  renderCount: number;
  averageRenderTime: number;
  memoryUsage: number;
  cacheHitRatio: number;
  queryCount: number;
  errorRate: number;
  lastMeasurement: Date;
  trends: {
    renderTime: 'improving' | 'stable' | 'degrading';
    memoryUsage: 'improving' | 'stable' | 'degrading';
    errorRate: 'improving' | 'stable' | 'degrading';
  };
}

/**
 * Global performance registry for all aggregate hooks
 */
class PerformanceRegistry {
  private static instance: PerformanceRegistry;
  private metrics = new Map<string, AggregatePerformanceMetrics>();
  private observers = new Set<(metrics: Map<string, AggregatePerformanceMetrics>) => void>();

  static getInstance(): PerformanceRegistry {
    if (!PerformanceRegistry.instance) {
      PerformanceRegistry.instance = new PerformanceRegistry();
    }
    return PerformanceRegistry.instance;
  }

  recordMetric(hookName: string, metric: Partial<AggregatePerformanceMetrics>) {
    const existing = this.metrics.get(hookName);
    const updated: AggregatePerformanceMetrics = {
      hookName,
      renderCount: 0,
      averageRenderTime: 0,
      memoryUsage: 0,
      cacheHitRatio: 0,
      queryCount: 0,
      errorRate: 0,
      lastMeasurement: new Date(),
      trends: {
        renderTime: 'stable',
        memoryUsage: 'stable',
        errorRate: 'stable',
      },
      ...existing,
      ...metric,
      lastMeasurement: new Date(),
    };

    // Calculate trends if we have previous data
    if (existing) {
      updated.trends = {
        renderTime: this.calculateTrend(existing.averageRenderTime, updated.averageRenderTime),
        memoryUsage: this.calculateTrend(existing.memoryUsage, updated.memoryUsage),
        errorRate: this.calculateTrend(existing.errorRate, updated.errorRate, true), // Lower is better for error rate
      };
    }

    this.metrics.set(hookName, updated);
    this.notifyObservers();
  }

  private calculateTrend(
    oldValue: number,
    newValue: number,
    lowerIsBetter = false
  ): 'improving' | 'stable' | 'degrading' {
    const threshold = 0.1; // 10% change threshold
    const change = (newValue - oldValue) / oldValue;

    if (Math.abs(change) < threshold) return 'stable';

    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'degrading';
    } else {
      return change > 0 ? 'degrading' : 'improving';
    }
  }

  getAllMetrics(): Map<string, AggregatePerformanceMetrics> {
    return new Map(this.metrics);
  }

  getMetric(hookName: string): AggregatePerformanceMetrics | undefined {
    return this.metrics.get(hookName);
  }

  subscribe(observer: (metrics: Map<string, AggregatePerformanceMetrics>) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notifyObservers() {
    this.observers.forEach((observer) => observer(this.getAllMetrics()));
  }

  generateReport(): {
    summary: {
      totalHooks: number;
      averagePerformance: number;
      issuesFound: number;
    };
    recommendations: string[];
    topPerformers: string[];
    needsAttention: string[];
  } {
    const metrics = Array.from(this.metrics.values());

    const summary = {
      totalHooks: metrics.length,
      averagePerformance:
        metrics.reduce((sum, m) => sum + (100 - m.averageRenderTime), 0) / metrics.length,
      issuesFound: metrics.filter(
        (m) =>
          m.trends.renderTime === 'degrading' ||
          m.trends.memoryUsage === 'degrading' ||
          m.errorRate > 0.05
      ).length,
    };

    const recommendations: string[] = [];
    const topPerformers: string[] = [];
    const needsAttention: string[] = [];

    metrics.forEach((metric) => {
      // Performance score calculation
      let score = 100;
      score -= metric.averageRenderTime * 2; // Penalty for slow renders
      score -= (metric.memoryUsage / 1024 / 1024) * 10; // Penalty for memory usage (MB)
      score -= metric.errorRate * 100; // Penalty for errors
      score += metric.cacheHitRatio * 20; // Bonus for good cache usage

      if (score > 80) {
        topPerformers.push(metric.hookName);
      } else if (score < 60) {
        needsAttention.push(metric.hookName);
      }

      // Generate recommendations
      if (metric.averageRenderTime > 5) {
        recommendations.push(
          `${metric.hookName}: Consider optimizing render performance (${metric.averageRenderTime.toFixed(2)}ms avg)`
        );
      }

      if (metric.cacheHitRatio < 0.7) {
        recommendations.push(
          `${metric.hookName}: Low cache hit ratio (${(metric.cacheHitRatio * 100).toFixed(1)}%) - review caching strategy`
        );
      }

      if (metric.errorRate > 0.05) {
        recommendations.push(
          `${metric.hookName}: High error rate (${(metric.errorRate * 100).toFixed(1)}%) - investigate error handling`
        );
      }
    });

    return {
      summary,
      recommendations: recommendations.slice(0, 10), // Top 10 recommendations
      topPerformers: topPerformers.slice(0, 5),
      needsAttention: needsAttention.slice(0, 5),
    };
  }
}

/**
 * Performance monitoring hook for aggregate hooks.
 *
 * This hook provides comprehensive performance monitoring for aggregate hooks:
 * - Render time tracking
 * - Memory usage monitoring
 * - Cache performance analysis
 * - Error rate tracking
 * - Trend analysis and recommendations
 *
 * Use this hook to wrap your aggregate hooks during development to monitor
 * performance and identify optimization opportunities.
 *
 * @param hookName - Name of the aggregate hook being monitored
 * @param enabled - Whether monitoring is enabled (default: process.env.NODE_ENV === 'development')
 * @returns Performance monitoring utilities
 */
export function usePerformanceMonitor(
  hookName: string,
  enabled = process.env.NODE_ENV === 'development'
) {
  const queryClient = useQueryClient();
  const registry = PerformanceRegistry.getInstance();
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const errorsRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const [metrics, setMetrics] = useState<AggregatePerformanceMetrics | undefined>();

  // Track render start time
  if (enabled) {
    startTimeRef.current = performance.now();
    renderCountRef.current++;
  }

  // Record render completion and calculate metrics
  useEffect(() => {
    if (!enabled) return;

    const renderTime = performance.now() - startTimeRef.current;
    renderTimesRef.current.push(renderTime);

    // Keep only last 100 render times for performance
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100);
    }

    // Calculate performance metrics
    const averageRenderTime =
      renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length;

    // Estimate memory usage (simplified)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    // Get cache metrics from React Query
    const allQueries = queryClient.getQueryCache().getAll();
    const hookQueries = allQueries.filter(
      (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey.some(
          (key) =>
            typeof key === 'string' && key.includes(hookName.replace('use', '').toLowerCase())
        )
    );

    const cacheHits = hookQueries.filter((q) => q.state.data !== undefined).length;
    const cacheHitRatio = hookQueries.length > 0 ? cacheHits / hookQueries.length : 0;

    const errorRate = renderCountRef.current > 0 ? errorsRef.current / renderCountRef.current : 0;

    // Record metrics
    const newMetrics: Partial<AggregatePerformanceMetrics> = {
      renderCount: renderCountRef.current,
      averageRenderTime,
      memoryUsage,
      cacheHitRatio,
      queryCount: hookQueries.length,
      errorRate,
    };

    registry.recordMetric(hookName, newMetrics);
    setMetrics(registry.getMetric(hookName));
  });

  // Subscribe to metrics updates
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = registry.subscribe((allMetrics) => {
      setMetrics(allMetrics.get(hookName));
    });

    return unsubscribe;
  }, [hookName, enabled, registry]);

  // Performance monitoring utilities
  const recordError = useCallback(() => {
    if (!enabled) return;
    errorsRef.current++;
  }, [enabled]);

  const measureOperation = useCallback(
    <T>(operation: () => T, operationName?: string): T => {
      if (!enabled) return operation();

      const startTime = performance.now();
      try {
        const result = operation();
        const endTime = performance.now();

        if (operationName && process.env.NODE_ENV === 'development') {
          console.log(`${hookName}.${operationName}: ${(endTime - startTime).toFixed(2)}ms`);
        }

        return result;
      } catch (_error) {
        recordError();
        throw error;
      }
    },
    [enabled, hookName, recordError]
  );

  const getOptimizationSuggestions = useCallback((): string[] => {
    if (!enabled || !metrics) return [];

    const suggestions: string[] = [];

    if (metrics.averageRenderTime > 5) {
      suggestions.push('Consider memoizing expensive calculations');
    }

    if (metrics.cacheHitRatio < 0.7) {
      suggestions.push('Review query key strategies and stale time settings');
    }

    if (metrics.errorRate > 0.05) {
      suggestions.push('Improve error handling and add more defensive programming');
    }

    if (metrics.queryCount > 10) {
      suggestions.push('Consider consolidating related queries or using query batching');
    }

    return suggestions;
  }, [enabled, metrics]);

  return {
    // Current metrics
    metrics,

    // Monitoring utilities
    recordError,
    measureOperation,
    getOptimizationSuggestions,

    // Performance indicators
    isPerformant: metrics ? metrics.averageRenderTime < 5 && metrics.errorRate < 0.01 : true,
    hasIssues: metrics
      ? metrics.trends.renderTime === 'degrading' ||
        metrics.trends.memoryUsage === 'degrading' ||
        metrics.errorRate > 0.05
      : false,

    // Development helpers
    enabled,
  };
}

/**
 * Hook to access global performance metrics for all aggregate hooks
 */
export function useGlobalPerformanceMetrics() {
  const registry = PerformanceRegistry.getInstance();
  const [allMetrics, setAllMetrics] = useState<Map<string, AggregatePerformanceMetrics>>(new Map());

  useEffect(() => {
    const unsubscribe = registry.subscribe(setAllMetrics);
    setAllMetrics(registry.getAllMetrics()); // Initial load
    return unsubscribe;
  }, [registry]);

  const report = registry.generateReport();

  return {
    allMetrics,
    report,

    // Utility functions
    getMetricsArray: () => Array.from(allMetrics.values()),
    getTopPerformers: () => report.topPerformers,
    getIssues: () => report.needsAttention,
    getRecommendations: () => report.recommendations,
  };
}

/**
 * Development utility to log performance metrics to console
 */
export function logPerformanceReport() {
  if (process.env.NODE_ENV !== 'development') return;

  const registry = PerformanceRegistry.getInstance();
  const report = registry.generateReport();

  console.group('🚀 Aggregate Hook Performance Report');
  console.log('📊 Summary:', report.summary);
  console.log('🏆 Top Performers:', report.topPerformers);
  console.log('⚠️ Needs Attention:', report.needsAttention);
  console.log('💡 Recommendations:', report.recommendations);
  console.groupEnd();
}
