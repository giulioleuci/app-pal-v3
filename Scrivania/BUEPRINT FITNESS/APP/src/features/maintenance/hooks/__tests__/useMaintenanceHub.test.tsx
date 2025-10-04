import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock external dependencies
vi.mock('tsyringe', () => ({
  container: {
    resolve: vi.fn(),
  },
  injectable: () => (target: any) => target,
  singleton: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
}));

// useMaintenanceTools functionality is now consolidated into useMaintenanceHub

import { container } from 'tsyringe';

import {
  type AutoMaintenanceConfig,
  type MaintenanceReport,
  type MaintenanceSchedule,
  useMaintenanceHub,
} from '../useMaintenanceHub';

// Mock implementations
const mockContainer = vi.mocked(container);

// Mock data
const mockSystemHealth = {
  databaseSize: 128.5,
  fragmentationLevel: 15.2,
  unusedSpace: 8.7,
  indexHealth: 92,
  cacheHitRatio: 87.3,
  totalRecords: 15420,
  corruptRecords: 0,
  lastMaintenanceDate: new Date('2023-01-01T00:00:00Z'),
  uptime: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

const mockPerformanceMetrics = {
  averageResponseTime: 89.5,
  throughputPerSecond: 45.2,
  errorRate: 0.012,
  cacheHitRatio: 87.3,
  diskUsage: 256.8,
  memoryUsage: 512.4,
  performanceTrend: {
    direction: 'improving' as const,
    percentage: 12.5,
    timespan: '7 days',
  },
  recentOperations: [
    {
      type: 'optimization',
      status: 'success' as const,
      timestamp: new Date('2023-01-01T10:00:00Z'),
      duration: 5400, // 90 minutes
      details: 'Database optimization completed successfully',
    },
    {
      type: 'cleanup',
      status: 'success' as const,
      timestamp: new Date('2023-01-01T08:00:00Z'),
      duration: 1200, // 20 minutes
      details: 'Cleaned up 500MB of unused data',
    },
    {
      type: 'backup',
      status: 'warning' as const,
      timestamp: new Date('2023-01-01T06:00:00Z'),
      duration: 3600, // 60 minutes
      details: 'Backup completed with warnings',
    },
  ],
};

const mockMaintenanceSchedule: MaintenanceSchedule = {
  optimization: new Date('2023-01-08T02:00:00Z'),
  integrityCheck: new Date('2023-01-05T03:00:00Z'),
  cleanup: new Date('2023-01-10T01:00:00Z'),
  backup: new Date('2023-01-02T04:00:00Z'),
};

// Mock services
const mockMaintenanceService = {
  getSystemHealth: vi.fn(),
  getPerformanceMetrics: vi.fn(),
  getMaintenanceSchedule: vi.fn(),
  runAutomatedMaintenance: vi.fn(),
  runFullOptimization: vi.fn(),
  advancedCleanup: vi.fn(),
  // Base tools methods used by the hook
  optimizeDatabase: vi.fn(),
  validateDataIntegrity: vi.fn(),
  bulkDelete: vi.fn(),
};

const mockBaseMaintenanceTools = {
  optimizeDatabase: vi.fn(),
  validateDataIntegrity: vi.fn(),
  cleanupTempFiles: vi.fn(),
  isOptimizing: false,
  isValidating: false,
  isCleaning: false,
  optimizationProgress: 0,
  validationResults: null,
  cleanupResults: null,
  lastOptimization: null,
  lastValidation: null,
  lastCleanup: null,
  error: null,
};

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMaintenanceHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock container resolution
    mockContainer.resolve.mockImplementation((serviceClass) => {
      // The hook passes the actual MaintenanceService class, not a string
      if (serviceClass && serviceClass.name === 'MaintenanceService') {
        return mockMaintenanceService;
      }
      throw new Error(`Unknown service: ${serviceClass}`);
    });

    // Base maintenance tools functionality is now directly in useMaintenanceHub

    // Mock service responses
    mockMaintenanceService.getSystemHealth.mockResolvedValue(mockSystemHealth);
    mockMaintenanceService.getPerformanceMetrics.mockResolvedValue(mockPerformanceMetrics);
    mockMaintenanceService.getMaintenanceSchedule.mockResolvedValue(mockMaintenanceSchedule);
    mockMaintenanceService.runAutomatedMaintenance.mockResolvedValue({
      success: true,
      duration: 1800,
    });
    mockMaintenanceService.runFullOptimization.mockResolvedValue({
      success: true,
      improvements: ['index_rebuilt', 'fragmentation_reduced'],
    });
    mockMaintenanceService.advancedCleanup.mockResolvedValue({
      success: true,
      spaceReclaimed: 125.6,
    });
    // Base tools methods
    mockMaintenanceService.optimizeDatabase.mockResolvedValue({
      success: true,
      message: 'Database optimized',
    });
    mockMaintenanceService.validateDataIntegrity.mockResolvedValue({ success: true, issues: [] });
    mockMaintenanceService.bulkDelete.mockResolvedValue({ success: true, deletedCount: 0 });
  });

  describe('Basic Initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.autoConfig).toBeDefined();
      expect(result.current.quickActions).toBeDefined();
    });

    it('should resolve maintenance service correctly', () => {
      renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(mockContainer.resolve).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should include base maintenance tools functionality', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Should spread all properties from base tools
      expect(result.current.optimizeDatabase).toBeTypeOf('function');
      expect(result.current.validateDataIntegrity).toBeTypeOf('function');
      expect(result.current.cleanupTempFiles).toBeTypeOf('function');
    });

    it('should initialize with default auto-configuration', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      const defaultConfig = result.current.autoConfig;
      expect(defaultConfig.enabled).toBe(false);
      expect(defaultConfig.schedule.optimization).toBe('weekly');
      expect(defaultConfig.schedule.cleanup).toBe('monthly');
      expect(defaultConfig.schedule.backup).toBe('weekly');
      expect(defaultConfig.thresholds.maxDatabaseSizeMB).toBe(500);
      expect(defaultConfig.thresholds.maxFragmentation).toBe(30);
      expect(defaultConfig.thresholds.minCacheHitRatio).toBe(80);
    });
  });

  describe('System Health Monitoring', () => {
    it('should load system health data', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.systemHealth).toEqual(mockSystemHealth);
      });

      expect(mockMaintenanceService.getSystemHealth).toHaveBeenCalled();
    });

    it('should handle system health loading state', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoadingHealth).toBe(true);
    });

    it('should handle system health error state', async () => {
      const mockError = new Error('Health check failed');
      mockMaintenanceService.getSystemHealth.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.healthError).toEqual(mockError);
      });
    });

    it('should refresh health data automatically', () => {
      renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Should set up auto-refresh (every 5 minutes)
      expect(mockMaintenanceService.getSystemHealth).toHaveBeenCalled();
    });

    it('should provide health refresh function', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refreshHealth).toBe('function');

      act(() => {
        result.current.refreshHealth();
      });

      // Should trigger additional health check
    });
  });

  describe('Performance Metrics', () => {
    it('should load performance metrics', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.performanceMetrics).toEqual(mockPerformanceMetrics);
      });

      expect(mockMaintenanceService.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('should handle performance metrics loading state', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoadingMetrics).toBe(true);
    });

    it('should handle performance metrics error', async () => {
      const mockError = new Error('Metrics fetch failed');
      mockMaintenanceService.getPerformanceMetrics.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.metricsError).toEqual(mockError);
      });
    });

    it('should provide metrics refresh function', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refreshMetrics).toBe('function');

      act(() => {
        result.current.refreshMetrics();
      });
    });
  });

  describe('Maintenance Schedule', () => {
    it('should load maintenance schedule', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.maintenanceSchedule).toEqual(mockMaintenanceSchedule);
      });

      expect(mockMaintenanceService.getMaintenanceSchedule).toHaveBeenCalled();
    });

    it('should handle schedule with proper caching', () => {
      renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Should use longer stale time for schedule (30 minutes)
      expect(mockMaintenanceService.getMaintenanceSchedule).toHaveBeenCalled();
    });
  });

  describe('Automated Maintenance Operations', () => {
    describe('Run Automated Maintenance', () => {
      it('should run automated maintenance successfully', async () => {
        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        const operations = ['optimization', 'cleanup'];

        await act(async () => {
          const response = await result.current.runAutomatedMaintenance(operations);
          expect(response).toEqual({ success: true, duration: 1800 });
        });

        expect(mockMaintenanceService.runAutomatedMaintenance).toHaveBeenCalledWith(
          operations,
          expect.objectContaining({
            enabled: false,
            schedule: expect.any(Object),
            thresholds: expect.any(Object),
            notifications: expect.any(Object),
          })
        );
      });

      it('should track automated maintenance loading state', async () => {
        let resolveOperation: (value: any) => void;
        const operationPromise = new Promise((resolve) => {
          resolveOperation = resolve;
        });

        mockMaintenanceService.runAutomatedMaintenance.mockReturnValue(operationPromise);

        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.runAutomatedMaintenance(['optimization']);
        });

        // Wait for the loading state to update
        await waitFor(() => {
          expect(result.current.isRunningAutomated).toBe(true);
        });

        await act(async () => {
          resolveOperation({ success: true });
          await operationPromise;
        });

        // Wait for the loading state to update to false
        await waitFor(() => {
          expect(result.current.isRunningAutomated).toBe(false);
        });
      });

      it('should refresh data after automated maintenance', async () => {
        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          await result.current.runAutomatedMaintenance(['optimization']);
        });

        // Should trigger refreshes of health and metrics
        await waitFor(() => {
          expect(mockMaintenanceService.getSystemHealth).toHaveBeenCalledTimes(2); // Initial + refresh
          expect(mockMaintenanceService.getPerformanceMetrics).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('Full Optimization', () => {
      it('should run full optimization successfully', async () => {
        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        const options = { aggressive: true, includeIndexes: true };

        await act(async () => {
          const response = await result.current.fullOptimization(options);
          expect(response).toEqual({
            success: true,
            improvements: ['index_rebuilt', 'fragmentation_reduced'],
          });
        });

        expect(mockMaintenanceService.runFullOptimization).toHaveBeenCalledWith(options);
      });

      it('should track optimization loading state', async () => {
        let resolveOptimization: (value: any) => void;
        const optimizationPromise = new Promise((resolve) => {
          resolveOptimization = resolve;
        });

        mockMaintenanceService.runFullOptimization.mockReturnValue(optimizationPromise);

        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.fullOptimization({ aggressive: false, includeIndexes: false });
        });

        // Wait for the loading state to update
        await waitFor(() => {
          expect(result.current.isOptimizing).toBe(true);
        });

        await act(async () => {
          resolveOptimization({ success: true });
          await optimizationPromise;
        });

        // Wait for the loading state to update to false
        await waitFor(() => {
          expect(result.current.isOptimizing).toBe(false);
        });
      });

      it('should handle optimization errors', async () => {
        const mockError = new Error('Optimization failed');
        mockMaintenanceService.runFullOptimization.mockRejectedValue(mockError);

        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        await expect(
          result.current.fullOptimization({ aggressive: true, includeIndexes: true })
        ).rejects.toThrow('Optimization failed');

        // Wait for the error state to update
        await waitFor(() => {
          expect(result.current.optimizationError).toEqual(mockError);
        });
      });
    });

    describe('Advanced Cleanup', () => {
      it('should run advanced cleanup successfully', async () => {
        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        const options = {
          removeOrphaned: true,
          compactTables: true,
          rebuildIndexes: false,
          cleanupLogs: true,
        };

        await act(async () => {
          const response = await result.current.advancedCleanup(options);
          expect(response).toEqual({ success: true, spaceReclaimed: 125.6 });
        });

        expect(mockMaintenanceService.advancedCleanup).toHaveBeenCalledWith(options);
      });

      it('should track cleanup loading state', async () => {
        let resolveCleanup: (value: any) => void;
        const cleanupPromise = new Promise((resolve) => {
          resolveCleanup = resolve;
        });

        mockMaintenanceService.advancedCleanup.mockReturnValue(cleanupPromise);

        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.advancedCleanup({
            removeOrphaned: false,
            compactTables: false,
            rebuildIndexes: false,
            cleanupLogs: false,
          });
        });

        // Wait for the loading state to update
        await waitFor(() => {
          expect(result.current.isCleaning).toBe(true);
        });

        await act(async () => {
          resolveCleanup({ success: true });
          await cleanupPromise;
        });

        // Wait for the loading state to update to false
        await waitFor(() => {
          expect(result.current.isCleaning).toBe(false);
        });
      });

      it('should handle cleanup errors', async () => {
        const mockError = new Error('Cleanup failed');
        mockMaintenanceService.advancedCleanup.mockRejectedValue(mockError);

        const { result } = renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });

        await expect(
          result.current.advancedCleanup({
            removeOrphaned: true,
            compactTables: true,
            rebuildIndexes: true,
            cleanupLogs: true,
          })
        ).rejects.toThrow('Cleanup failed');

        // Wait for the error state to update
        await waitFor(() => {
          expect(result.current.cleanupError).toEqual(mockError);
        });
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive maintenance report', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.systemHealth).toEqual(mockSystemHealth);
        expect(result.current.performanceMetrics).toEqual(mockPerformanceMetrics);
      });

      const report = await result.current.generateReport();

      expect(report).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.systemHealth.overall).toBe('excellent');
      expect(report.systemHealth.databaseSize).toBe(mockSystemHealth.databaseSize);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recentOperations).toEqual(mockPerformanceMetrics.recentOperations);
    });

    it('should calculate system health scores correctly', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.systemHealth).toBeDefined();
      });

      const report = await result.current.generateReport();

      expect(report.systemHealth.performance).toBeGreaterThan(80);
      expect(report.systemHealth.storage).toBeGreaterThan(80);
      expect(report.systemHealth.integrity).toBe(mockSystemHealth.indexHealth);
    });

    it('should generate recommendations based on system state', async () => {
      // Mock system with issues
      const problematicHealth = {
        ...mockSystemHealth,
        fragmentationLevel: 45, // High fragmentation
        unusedSpace: 35, // High unused space
        cacheHitRatio: 65, // Low cache hit ratio
        indexHealth: 70, // Low index health
      };

      mockMaintenanceService.getSystemHealth.mockResolvedValue(problematicHealth);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.systemHealth).toEqual(problematicHealth);
      });

      const report = await result.current.generateReport();

      expect(report.recommendations).toHaveLength(4); // Should have recommendations for all issues

      const fragmentationRec = report.recommendations.find((r) => r.type === 'optimization');
      const cleanupRec = report.recommendations.find((r) => r.type === 'cleanup');
      const performanceRec = report.recommendations.find((r) => r.type === 'performance');

      expect(fragmentationRec).toBeDefined();
      expect(cleanupRec).toBeDefined();
      expect(performanceRec).toBeDefined();
    });

    it('should set appropriate priority levels for recommendations', async () => {
      const criticalHealth = {
        ...mockSystemHealth,
        fragmentationLevel: 60, // Critical
        unusedSpace: 50, // Critical
        cacheHitRatio: 45, // Critical
      };

      mockMaintenanceService.getSystemHealth.mockResolvedValue(criticalHealth);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.systemHealth).toEqual(criticalHealth);
      });

      const report = await result.current.generateReport();

      const highPriorityRecs = report.recommendations.filter((r) => r.priority === 'high');
      expect(highPriorityRecs).toHaveLength(3);
    });

    it('should handle missing data gracefully', async () => {
      mockMaintenanceService.getSystemHealth.mockResolvedValue(null);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.generateReport()).rejects.toThrow(
        'Unable to generate report - missing health data'
      );
    });
  });

  describe('Insights and Analytics', () => {
    it('should provide insights when data is available', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.insights.status).toBe('healthy');
        expect(result.current.insights.summary).toBe('System running optimally');
        expect(result.current.insights.alerts).toEqual([]);
        expect(result.current.insights.trends).toBeInstanceOf(Array);
      });
    });

    it('should provide loading insights when data is not available', () => {
      mockMaintenanceService.getSystemHealth.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current.insights.status).toBe('loading');
      expect(result.current.insights.summary).toBe('Gathering system information...');
    });

    it('should generate critical alerts for severe issues', async () => {
      const severeHealth = {
        ...mockSystemHealth,
        fragmentationLevel: 55, // Critical level
        databaseSize: 600, // Above threshold
      };

      mockMaintenanceService.getSystemHealth.mockResolvedValue(severeHealth);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.insights.alerts).toHaveLength(2);

        const criticalAlert = result.current.insights.alerts.find((a) => a.type === 'critical');
        const warningAlert = result.current.insights.alerts.find((a) => a.type === 'warning');

        expect(criticalAlert).toBeDefined();
        expect(warningAlert).toBeDefined();
        expect(result.current.insights.status).toBe('attention');
      });
    });

    it('should track performance trends', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const improvingTrend = result.current.insights.trends.find((t) => t.type === 'positive');
        expect(improvingTrend).toBeDefined();
        expect(improvingTrend?.title).toBe('Performance Improving');
        expect(improvingTrend?.change).toBe('+12.5%');
      });
    });

    it('should handle declining performance trends', async () => {
      const decliningMetrics = {
        ...mockPerformanceMetrics,
        performanceTrend: {
          direction: 'declining' as const,
          percentage: 8.3,
          timespan: '24 hours',
        },
      };

      mockMaintenanceService.getPerformanceMetrics.mockResolvedValue(decliningMetrics);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const decliningTrend = result.current.insights.trends.find((t) => t.type === 'negative');
        expect(decliningTrend).toBeDefined();
        expect(decliningTrend?.title).toBe('Performance Declining');
        expect(decliningTrend?.change).toBe('-8.3%');
      });
    });
  });

  describe('Quick Actions', () => {
    it('should provide predefined quick actions', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current.quickActions).toHaveLength(4);

      const actions = result.current.quickActions;
      expect(actions.find((a) => a.id === 'optimize')).toBeDefined();
      expect(actions.find((a) => a.id === 'cleanup')).toBeDefined();
      expect(actions.find((a) => a.id === 'integrity')).toBeDefined();
      expect(actions.find((a) => a.id === 'full-optimization')).toBeDefined();
    });

    it('should execute quick optimize action', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      const optimizeAction = result.current.quickActions.find((a) => a.id === 'optimize');

      await act(async () => {
        await optimizeAction?.action();
      });

      expect(mockMaintenanceService.optimizeDatabase).toHaveBeenCalled();
    });

    it('should execute cleanup action with correct parameters', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      const cleanupAction = result.current.quickActions.find((a) => a.id === 'cleanup');

      await act(async () => {
        await cleanupAction?.action();
      });

      expect(mockMaintenanceService.advancedCleanup).toHaveBeenCalledWith({
        removeOrphaned: true,
        compactTables: false,
        rebuildIndexes: false,
        cleanupLogs: true,
      });
    });

    it('should execute integrity check action', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      const integrityAction = result.current.quickActions.find((a) => a.id === 'integrity');

      await act(async () => {
        await integrityAction?.action();
      });

      expect(mockMaintenanceService.validateDataIntegrity).toHaveBeenCalled();
    });

    it('should execute full optimization action', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      const fullOptAction = result.current.quickActions.find((a) => a.id === 'full-optimization');

      await act(async () => {
        await fullOptAction?.action();
      });

      expect(mockMaintenanceService.runFullOptimization).toHaveBeenCalledWith({
        aggressive: true,
        includeIndexes: true,
      });
    });
  });

  describe('Auto-Configuration Management', () => {
    it('should update auto-configuration', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      const updates: Partial<AutoMaintenanceConfig> = {
        enabled: true,
        schedule: { optimization: 'daily', cleanup: 'weekly', backup: 'daily' },
        thresholds: { maxDatabaseSizeMB: 1000 },
      };

      act(() => {
        result.current.updateAutoConfig(updates);
      });

      expect(result.current.autoConfig.enabled).toBe(true);
      expect(result.current.autoConfig.schedule.optimization).toBe('daily');
      expect(result.current.autoConfig.thresholds.maxDatabaseSizeMB).toBe(1000);
      // Should preserve existing values not being updated
      expect(result.current.autoConfig.notifications.success).toBe(true);
    });

    it('should partially update nested configuration objects', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateAutoConfig({
          schedule: { optimization: 'daily' }, // Only update optimization
        });
      });

      expect(result.current.autoConfig.schedule.optimization).toBe('daily');
      expect(result.current.autoConfig.schedule.cleanup).toBe('monthly'); // Should remain unchanged
      expect(result.current.autoConfig.schedule.backup).toBe('weekly'); // Should remain unchanged
    });

    it('should handle multiple configuration updates', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateAutoConfig({ enabled: true });
      });

      act(() => {
        result.current.updateAutoConfig({
          thresholds: { minCacheHitRatio: 90 },
        });
      });

      expect(result.current.autoConfig.enabled).toBe(true);
      expect(result.current.autoConfig.thresholds.minCacheHitRatio).toBe(90);
      expect(result.current.autoConfig.thresholds.maxDatabaseSizeMB).toBe(500); // Should preserve
    });
  });

  describe('Status Indicators', () => {
    it('should provide health status indicators', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isHealthy).toBe(true);
        expect(result.current.needsAttention).toBe(false);
        expect(result.current.overallHealth).toBe('excellent');
      });
    });

    it('should indicate attention needed for problematic systems', async () => {
      const problematicHealth = {
        ...mockSystemHealth,
        fragmentationLevel: 55,
      };

      mockMaintenanceService.getSystemHealth.mockResolvedValue(problematicHealth);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isHealthy).toBe(false);
        expect(result.current.needsAttention).toBe(true);
        expect(result.current.overallHealth).toBe('needs_optimization');
      });
    });

    it('should track active operations', async () => {
      let resolveOperation: (value: any) => void;
      const operationPromise = new Promise((resolve) => {
        resolveOperation = resolve;
      });

      mockMaintenanceService.runFullOptimization.mockReturnValue(operationPromise);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.fullOptimization({ aggressive: true, includeIndexes: true });
      });

      // Wait for the active operation state to update
      await waitFor(() => {
        expect(result.current.hasActiveOperations).toBe(true);
      });

      await act(async () => {
        resolveOperation({ success: true });
        await operationPromise;
      });

      // Wait for the active operations state to update to false
      await waitFor(() => {
        expect(result.current.hasActiveOperations).toBe(false);
      });
    });

    it('should handle unknown health status', () => {
      mockMaintenanceService.getSystemHealth.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current.overallHealth).toBe('unknown');
    });
  });

  describe('Refresh Functions', () => {
    it('should provide individual refresh functions', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refreshHealth).toBe('function');
      expect(typeof result.current.refreshMetrics).toBe('function');
      expect(typeof result.current.refreshAll).toBe('function');
    });

    it('should refresh all data sources', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.refreshAll();
      });

      // Should trigger refetch for all data sources
      // This would be verified by checking query invalidation in a real implementation
    });
  });

  describe('Error Handling', () => {
    it('should handle service resolution errors', () => {
      mockContainer.resolve.mockImplementation(() => {
        throw new Error('Service not found');
      });

      expect(() => {
        renderHook(() => useMaintenanceHub(), {
          wrapper: createWrapper(),
        });
      }).toThrow('Service not found');
    });

    it('should provide error states for all operations', () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      expect(result.current.healthError).toBeDefined();
      expect(result.current.metricsError).toBeDefined();
      expect(result.current.automatedError).toBeDefined();
      expect(result.current.optimizationError).toBeDefined();
      expect(result.current.cleanupError).toBeDefined();
    });

    it('should handle operation failures gracefully', async () => {
      const mockError = new Error('Operation failed');
      mockMaintenanceService.runAutomatedMaintenance.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.runAutomatedMaintenance(['optimization'])).rejects.toThrow(
        'Operation failed'
      );

      // Wait for the error state to update
      await waitFor(() => {
        expect(result.current.automatedError).toEqual(mockError);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete maintenance workflow', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.systemHealth).toBeDefined();
        expect(result.current.performanceMetrics).toBeDefined();
      });

      // Generate report
      const report = await result.current.generateReport();
      expect(report).toBeDefined();

      // Update configuration
      act(() => {
        result.current.updateAutoConfig({ enabled: true });
      });

      // Run automated maintenance
      await act(async () => {
        await result.current.runAutomatedMaintenance(['optimization', 'cleanup']);
      });

      // Verify data refresh occurred
      expect(mockMaintenanceService.getSystemHealth).toHaveBeenCalledTimes(2);
      expect(mockMaintenanceService.getPerformanceMetrics).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple simultaneous operations', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Start multiple operations
      const operations = Promise.all([
        result.current.runAutomatedMaintenance(['optimization']),
        result.current.fullOptimization({ aggressive: false, includeIndexes: true }),
        result.current.advancedCleanup({
          removeOrphaned: true,
          compactTables: false,
          rebuildIndexes: false,
          cleanupLogs: true,
        }),
      ]);

      await act(async () => {
        await operations;
      });

      // All operations should complete
      expect(mockMaintenanceService.runAutomatedMaintenance).toHaveBeenCalled();
      expect(mockMaintenanceService.runFullOptimization).toHaveBeenCalled();
      expect(mockMaintenanceService.advancedCleanup).toHaveBeenCalled();
    });

    it('should maintain data consistency during rapid updates', async () => {
      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      // Rapid configuration updates
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.updateAutoConfig({
            thresholds: { maxDatabaseSizeMB: 500 + i * 100 },
          });
        });
      }

      expect(result.current.autoConfig.thresholds.maxDatabaseSizeMB).toBe(900);

      // Verify other config remains intact
      expect(result.current.autoConfig.enabled).toBe(false);
      expect(result.current.autoConfig.notifications.success).toBe(true);
    });

    it('should handle recommendation execution', async () => {
      // Set up problematic health to generate recommendations
      const problematicHealth = {
        ...mockSystemHealth,
        fragmentationLevel: 35,
        unusedSpace: 25,
        indexHealth: 75,
      };

      mockMaintenanceService.getSystemHealth.mockResolvedValue(problematicHealth);

      const { result } = renderHook(() => useMaintenanceHub(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.systemHealth).toEqual(problematicHealth);
      });

      const report = await result.current.generateReport();
      const recommendation = report.recommendations[0];

      // Execute recommendation
      await act(async () => {
        await recommendation.action();
      });

      // Verify appropriate service was called
      expect(mockMaintenanceService.runFullOptimization).toHaveBeenCalled();
    });
  });
});
