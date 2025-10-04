import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { container } from 'tsyringe';

import { MaintenanceService } from '@/features/maintenance/services/MaintenanceService';

export interface MaintenanceSchedule {
  optimization: Date;
  integrityCheck: Date;
  cleanup: Date;
  backup: Date;
}

export interface MaintenanceReport {
  generatedAt: Date;
  systemHealth: {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    databaseSize: number;
    performance: number; // 0-100 score
    storage: number; // 0-100 score
    integrity: number; // 0-100 score
  };
  recommendations: Array<{
    id: string;
    type: 'optimization' | 'cleanup' | 'security' | 'performance';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    estimatedImpact: string;
    action: () => Promise<void>;
  }>;
  recentOperations: Array<{
    type: string;
    status: 'success' | 'failed' | 'warning';
    timestamp: Date;
    duration: number;
    details: string;
  }>;
}

export interface AutoMaintenanceConfig {
  enabled: boolean;
  schedule: {
    optimization: 'daily' | 'weekly' | 'monthly';
    cleanup: 'weekly' | 'monthly';
    backup: 'daily' | 'weekly';
  };
  thresholds: {
    maxDatabaseSizeMB: number;
    maxFragmentation: number;
    minCacheHitRatio: number;
  };
  notifications: {
    success: boolean;
    warnings: boolean;
    errors: boolean;
  };
}

/**
 * Enhanced maintenance operations aggregate hub.
 *
 * This comprehensive hub provides:
 * - Database optimization and performance monitoring
 * - Automated maintenance scheduling and execution
 * - System health diagnostics and reporting
 * - Intelligent recommendations and insights
 * - Bulk operations with progress tracking
 * - Data integrity validation and repair
 * - Storage optimization and cleanup
 * - Performance analytics and trending
 *
 * Follows the useAnalyticsHub comprehensive pattern while
 * consolidating all maintenance operations into a single interface.
 *
 * @returns Enhanced maintenance management interface
 */
export function useMaintenanceHub() {
  const maintenanceService = container.resolve(MaintenanceService);
  const [autoConfig, setAutoConfig] = useState<AutoMaintenanceConfig>({
    enabled: false,
    schedule: {
      optimization: 'weekly',
      cleanup: 'monthly',
      backup: 'weekly',
    },
    thresholds: {
      maxDatabaseSizeMB: 500,
      maxFragmentation: 30,
      minCacheHitRatio: 80,
    },
    notifications: {
      success: true,
      warnings: true,
      errors: true,
    },
  });

  // Base maintenance tools (consolidated functionality)
  const optimizeDatabase = useMutation({
    mutationFn: async (options?: { rebuildIndexes?: boolean }) => {
      return await maintenanceService.optimizeDatabase();
    },
  });

  const validateDataIntegrity = useMutation({
    mutationFn: async () => {
      return await maintenanceService.validateDataIntegrity();
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (option: 'ALL' | 'OLD_DATA' | 'INACTIVE_PROFILES') => {
      return await maintenanceService.bulkDelete(option);
    },
  });

  // Base tools object for compatibility
  const baseTools = {
    optimizeDatabase: optimizeDatabase.mutateAsync,
    validateDataIntegrity: validateDataIntegrity.mutateAsync,
    bulkDelete: bulkDelete.mutateAsync,
    cleanupTempFiles: async () => {
      // This functionality would be part of cleanup operations
      const result = await bulkDelete.mutateAsync('OLD_DATA');
      return result;
    },
    isOptimizing: optimizeDatabase.isPending,
    isValidating: validateDataIntegrity.isPending,
    isCleaning: bulkDelete.isPending,
    optimizationProgress: 0,
    validationResults: null,
    cleanupResults: null,
    lastOptimization: null,
    lastValidation: null,
  };

  // System health monitoring
  const systemHealth = useQuery({
    queryKey: ['maintenance', 'system-health'],
    queryFn: async () => {
      return await maintenanceService.getSystemHealth();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Performance metrics over time
  const performanceMetrics = useQuery({
    queryKey: ['maintenance', 'performance-metrics'],
    queryFn: async () => {
      return await maintenanceService.getPerformanceMetrics();
    },
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Maintenance schedule
  const maintenanceSchedule = useQuery({
    queryKey: ['maintenance', 'schedule'],
    queryFn: async () => {
      return await maintenanceService.getMaintenanceSchedule();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Automated maintenance execution
  const runAutomatedMaintenance = useMutation({
    mutationFn: async (operations: string[]) => {
      return await maintenanceService.runAutomatedMaintenance(operations, autoConfig);
    },
    onSuccess: () => {
      systemHealth.refetch();
      performanceMetrics.refetch();
    },
  });

  // Full system optimization
  const fullOptimization = useMutation({
    mutationFn: async (options: { aggressive?: boolean; includeIndexes?: boolean }) => {
      return await maintenanceService.runFullOptimization(options);
    },
    onSuccess: () => {
      systemHealth.refetch();
      performanceMetrics.refetch();
    },
  });

  // Advanced cleanup
  const advancedCleanup = useMutation({
    mutationFn: async (options: {
      removeOrphaned: boolean;
      compactTables: boolean;
      rebuildIndexes: boolean;
      cleanupLogs: boolean;
    }) => {
      return await maintenanceService.advancedCleanup(options);
    },
    onSuccess: () => {
      systemHealth.refetch();
      performanceMetrics.refetch();
    },
  });

  // Generate comprehensive maintenance report
  const generateReport = useCallback(async (): Promise<MaintenanceReport> => {
    const health = systemHealth.data;
    const metrics = performanceMetrics.data;
    const schedule = maintenanceSchedule.data;

    if (!health || !metrics) {
      throw new Error('Unable to generate report - missing health data');
    }

    // Calculate overall health score
    const performanceScore = Math.min(
      100,
      metrics.averageResponseTime < 100 ? 100 : metrics.averageResponseTime < 500 ? 80 : 60
    );
    const storageScore = Math.min(
      100,
      health.unusedSpace < 10 ? 100 : health.unusedSpace < 25 ? 80 : 60
    );
    const integrityScore = health.indexHealth;

    const overallScore = (performanceScore + storageScore + integrityScore) / 3;
    let overall: MaintenanceReport['systemHealth']['overall'];

    if (overallScore >= 90) overall = 'excellent';
    else if (overallScore >= 75) overall = 'good';
    else if (overallScore >= 60) overall = 'fair';
    else overall = 'poor';

    // Generate smart recommendations
    const recommendations: MaintenanceReport['recommendations'] = [];
    let recId = 1;

    if (health.fragmentationLevel > 20) {
      recommendations.push({
        id: `rec-${recId++}`,
        type: 'optimization',
        priority: health.fragmentationLevel > 40 ? 'high' : 'medium',
        title: 'Database Fragmentation Detected',
        description: `Database fragmentation is at ${health.fragmentationLevel}%. This can impact performance.`,
        estimatedImpact: 'Improve query performance by 15-30%',
        action: () => fullOptimization.mutateAsync({ aggressive: true, includeIndexes: true }),
      });
    }

    if (health.unusedSpace > 20) {
      recommendations.push({
        id: `rec-${recId++}`,
        type: 'cleanup',
        priority: health.unusedSpace > 40 ? 'high' : 'medium',
        title: 'Unused Space Cleanup',
        description: `${health.unusedSpace}% of database space is unused. Cleanup can reclaim significant storage.`,
        estimatedImpact: `Reclaim approximately ${Math.round((health.databaseSize * health.unusedSpace) / 100)}MB`,
        action: () =>
          advancedCleanup.mutateAsync({
            removeOrphaned: true,
            compactTables: true,
            rebuildIndexes: false,
            cleanupLogs: true,
          }),
      });
    }

    if (health.cacheHitRatio < 80) {
      recommendations.push({
        id: `rec-${recId++}`,
        type: 'performance',
        priority: health.cacheHitRatio < 60 ? 'high' : 'medium',
        title: 'Low Cache Hit Ratio',
        description: `Cache hit ratio is ${health.cacheHitRatio}%. This indicates potential memory or query optimization issues.`,
        estimatedImpact: 'Improve response times by 20-50%',
        action: () => fullOptimization.mutateAsync({ aggressive: false, includeIndexes: true }),
      });
    }

    if (health.indexHealth < 80) {
      recommendations.push({
        id: `rec-${recId++}`,
        type: 'optimization',
        priority: 'medium',
        title: 'Index Optimization Needed',
        description: `Index health score is ${health.indexHealth}%. Rebuilding indexes can improve query performance.`,
        estimatedImpact: 'Improve query performance by 10-25%',
        action: () => baseTools.optimizeDatabase({ rebuildIndexes: true }),
      });
    }

    return {
      generatedAt: new Date(),
      systemHealth: {
        overall,
        databaseSize: health.databaseSize,
        performance: performanceScore,
        storage: storageScore,
        integrity: integrityScore,
      },
      recommendations,
      recentOperations: metrics.recentOperations || [],
    };
  }, [
    systemHealth.data,
    performanceMetrics.data,
    maintenanceSchedule.data,
    baseTools,
    fullOptimization,
    advancedCleanup,
  ]);

  // Maintenance insights and analytics
  const insights = useMemo(() => {
    const health = systemHealth.data;
    const metrics = performanceMetrics.data;

    if (!health || !metrics) {
      return {
        status: 'loading',
        summary: 'Gathering system information...',
        alerts: [],
        trends: [],
      };
    }

    const alerts = [];
    const trends = [];

    // Critical alerts
    if (health.fragmentationLevel > 50) {
      alerts.push({
        type: 'critical' as const,
        title: 'High Database Fragmentation',
        message: 'Immediate optimization recommended to prevent performance degradation',
      });
    }

    if (health.databaseSize > autoConfig.thresholds.maxDatabaseSizeMB) {
      alerts.push({
        type: 'warning' as const,
        title: 'Database Size Limit Approaching',
        message: `Database is ${health.databaseSize}MB, approaching limit of ${autoConfig.thresholds.maxDatabaseSizeMB}MB`,
      });
    }

    // Performance trends
    if (metrics.performanceTrend) {
      if (metrics.performanceTrend.direction === 'improving') {
        trends.push({
          type: 'positive' as const,
          title: 'Performance Improving',
          change: `+${metrics.performanceTrend.percentage}%`,
        });
      } else if (metrics.performanceTrend.direction === 'declining') {
        trends.push({
          type: 'negative' as const,
          title: 'Performance Declining',
          change: `-${metrics.performanceTrend.percentage}%`,
        });
      }
    }

    const summary =
      alerts.length > 0
        ? `${alerts.length} issue${alerts.length > 1 ? 's' : ''} require attention`
        : 'System running optimally';

    return {
      status: alerts.length > 0 ? 'attention' : 'healthy',
      summary,
      alerts,
      trends,
    };
  }, [systemHealth.data, performanceMetrics.data, autoConfig.thresholds]);

  // Quick maintenance actions
  const quickActions = useMemo(
    () => [
      {
        id: 'optimize',
        title: 'Quick Optimize',
        description: 'Run basic optimization (5-10 minutes)',
        icon: '⚡',
        action: () => baseTools.optimizeDatabase(),
      },
      {
        id: 'cleanup',
        title: 'Cleanup Unused Data',
        description: 'Remove orphaned records and temporary files',
        icon: '🧹',
        action: () =>
          advancedCleanup.mutateAsync({
            removeOrphaned: true,
            compactTables: false,
            rebuildIndexes: false,
            cleanupLogs: true,
          }),
      },
      {
        id: 'integrity',
        title: 'Check Integrity',
        description: 'Validate data consistency and relationships',
        icon: '🔍',
        action: () => baseTools.validateDataIntegrity(),
      },
      {
        id: 'full-optimization',
        title: 'Full Optimization',
        description: 'Complete system optimization (15-30 minutes)',
        icon: '🚀',
        action: () => fullOptimization.mutateAsync({ aggressive: true, includeIndexes: true }),
      },
    ],
    [baseTools, advancedCleanup, fullOptimization]
  );

  // Auto-maintenance configuration
  const updateAutoConfig = useCallback((updates: Partial<AutoMaintenanceConfig>) => {
    setAutoConfig((prev) => ({
      ...prev,
      ...updates,
      schedule: { ...prev.schedule, ...updates.schedule },
      thresholds: { ...prev.thresholds, ...updates.thresholds },
      notifications: { ...prev.notifications, ...updates.notifications },
    }));
  }, []);

  return {
    // Base functionality (from useMaintenanceTools)
    ...baseTools,

    // Enhanced data
    systemHealth: systemHealth.data,
    performanceMetrics: performanceMetrics.data,
    maintenanceSchedule: maintenanceSchedule.data,

    // Insights and analytics
    insights,
    quickActions,

    // Loading states
    isLoadingHealth: systemHealth.isLoading,
    isLoadingMetrics: performanceMetrics.isLoading,
    isRunningAutomated: runAutomatedMaintenance.isPending,
    isOptimizing: fullOptimization.isPending,
    isCleaning: advancedCleanup.isPending,

    // Error states
    healthError: systemHealth.error,
    metricsError: performanceMetrics.error,
    automatedError: runAutomatedMaintenance.error,
    optimizationError: fullOptimization.error,
    cleanupError: advancedCleanup.error,

    // Operations
    runAutomatedMaintenance: runAutomatedMaintenance.mutateAsync,
    fullOptimization: fullOptimization.mutateAsync,
    advancedCleanup: advancedCleanup.mutateAsync,
    generateReport,

    // Configuration
    autoConfig,
    updateAutoConfig,

    // Refresh functions
    refreshHealth: () => systemHealth.refetch(),
    refreshMetrics: () => performanceMetrics.refetch(),
    refreshAll: () => {
      systemHealth.refetch();
      performanceMetrics.refetch();
      maintenanceSchedule.refetch();
    },

    // Status indicators
    isHealthy: insights.status === 'healthy',
    needsAttention: insights.status === 'attention',
    hasActiveOperations:
      runAutomatedMaintenance.isPending || fullOptimization.isPending || advancedCleanup.isPending,

    // Quick status
    overallHealth: systemHealth.data
      ? systemHealth.data.fragmentationLevel < 20 &&
        systemHealth.data.cacheHitRatio > 80 &&
        systemHealth.data.unusedSpace < 20
        ? 'excellent'
        : 'needs_optimization'
      : 'unknown',
  };
}

export type UseMaintenanceHubResult = ReturnType<typeof useMaintenanceHub>;
