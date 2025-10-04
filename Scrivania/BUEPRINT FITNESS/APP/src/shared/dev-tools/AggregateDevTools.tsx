import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';

import {
  logPerformanceReport,
  useGlobalPerformanceMetrics,
} from '@/shared/hooks/usePerformanceMonitor';

/**
 * Development tools component for monitoring and debugging aggregate hooks.
 * Only renders in development mode and provides comprehensive insights into
 * the performance and behavior of all aggregate hooks in the application.
 */
export function AggregateDevTools() {
  const { allMetrics, report, getMetricsArray, getRecommendations } = useGlobalPerformanceMetrics();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Auto refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger re-render by forcing state update
      setIsOpen((prev) => prev);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearCache = useCallback(() => {
    queryClient.clear();
    console.log('🗑️ Query cache cleared');
  }, [queryClient]);

  const handleInvalidateQueries = useCallback(
    (pattern?: string) => {
      if (pattern) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey.some((key) => typeof key === 'string' && key.includes(pattern)),
        });
        console.log(`🔄 Invalidated queries matching: ${pattern}`);
      } else {
        queryClient.invalidateQueries();
        console.log('🔄 Invalidated all queries');
      }
    },
    [queryClient]
  );

  const handleExportMetrics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: report.summary,
      recommendations: report.recommendations,
      metrics: getMetricsArray().reduce(
        (acc, metric) => {
          acc[metric.hookName] = {
            renderCount: metric.renderCount,
            averageRenderTime: metric.averageRenderTime,
            memoryUsage: metric.memoryUsage,
            cacheHitRatio: metric.cacheHitRatio,
            errorRate: metric.errorRate,
            trends: metric.trends,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aggregate-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, getMetricsArray]);

  if (!isOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title='Open Aggregate Dev Tools'
        >
          🚀
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '80vh',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: 10000,
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#f5f5f5',
          padding: '12px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px' }}>🚀 Aggregate DevTools</h3>
        <div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              background: autoRefresh ? '#4CAF50' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '10px',
              marginRight: '8px',
            }}
          >
            {autoRefresh ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px' }}>
        {/* Summary */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>📊 Summary</h4>
          <div style={{ background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
            <div>📱 Total Hooks: {report.summary.totalHooks}</div>
            <div>⚡ Avg Performance: {report.summary.averagePerformance.toFixed(1)}/100</div>
            <div>⚠️ Issues Found: {report.summary.issuesFound}</div>
          </div>
        </div>

        {/* Top Performers */}
        {report.topPerformers.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#4CAF50' }}>🏆 Top Performers</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {report.topPerformers.map((hook) => (
                <li key={hook} style={{ color: '#4CAF50' }}>
                  {hook}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issues */}
        {report.needsAttention.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f44336' }}>⚠️ Needs Attention</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {report.needsAttention.map((hook) => (
                <li key={hook} style={{ color: '#f44336' }}>
                  {hook}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {getRecommendations().length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#FF9800' }}>💡 Recommendations</h4>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {getRecommendations().map((rec, index) => (
                <div
                  key={index}
                  style={{
                    background: '#fff3e0',
                    padding: '4px 8px',
                    margin: '4px 0',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hook Details */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>🔍 Hook Details</h4>
          <select
            value={selectedHook || ''}
            onChange={(e) => setSelectedHook(e.target.value || null)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          >
            <option value=''>Select a hook...</option>
            {getMetricsArray().map((metric) => (
              <option key={metric.hookName} value={metric.hookName}>
                {metric.hookName}
              </option>
            ))}
          </select>

          {selectedHook && allMetrics.has(selectedHook) && (
            <div style={{ background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
              {(() => {
                const metric = allMetrics.get(selectedHook)!;
                return (
                  <>
                    <div>🔄 Renders: {metric.renderCount}</div>
                    <div>⏱️ Avg Time: {metric.averageRenderTime.toFixed(2)}ms</div>
                    <div>💾 Memory: {(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                    <div>📊 Cache Hit: {(metric.cacheHitRatio * 100).toFixed(1)}%</div>
                    <div>❌ Error Rate: {(metric.errorRate * 100).toFixed(2)}%</div>
                    <div>📈 Trends:</div>
                    <div style={{ marginLeft: '16px', fontSize: '10px' }}>
                      <div>
                        Render: {getTrendEmoji(metric.trends.renderTime)} {metric.trends.renderTime}
                      </div>
                      <div>
                        Memory: {getTrendEmoji(metric.trends.memoryUsage)}{' '}
                        {metric.trends.memoryUsage}
                      </div>
                      <div>
                        Errors: {getTrendEmoji(metric.trends.errorRate)} {metric.trends.errorRate}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>🛠️ Actions</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={logPerformanceReport}
              style={{
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              📊 Log Report
            </button>
            <button
              onClick={handleExportMetrics}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              📁 Export
            </button>
            <button
              onClick={handleClearCache}
              style={{
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              🗑️ Clear Cache
            </button>
            <button
              onClick={() => handleInvalidateQueries()}
              style={{
                background: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              🔄 Invalidate All
            </button>
          </div>
        </div>

        {/* Query Cache Info */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>🗄️ Query Cache</h4>
          <div style={{ background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
            <div>Total Queries: {queryClient.getQueryCache().getAll().length}</div>
            <div>
              Stale Queries:{' '}
              {
                queryClient
                  .getQueryCache()
                  .getAll()
                  .filter((q) => q.state.isStale).length
              }
            </div>
            <div>
              Error Queries:{' '}
              {
                queryClient
                  .getQueryCache()
                  .getAll()
                  .filter((q) => q.state.isError).length
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTrendEmoji(trend: 'improving' | 'stable' | 'degrading'): string {
  switch (trend) {
    case 'improving':
      return '📈';
    case 'degrading':
      return '📉';
    case 'stable':
      return '📊';
    default:
      return '❓';
  }
}

/**
 * Hook to programmatically control dev tools
 */
export function useAggregateDevTools() {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  return {
    isDevToolsOpen,
    openDevTools: () => setIsDevToolsOpen(true),
    closeDevTools: () => setIsDevToolsOpen(false),
    toggleDevTools: () => setIsDevToolsOpen((prev) => !prev),
  };
}

/**
 * Console commands for debugging aggregate hooks
 */
if (process.env.NODE_ENV === 'development') {
  // Add global debugging functions
  (window as any).__AGGREGATE_DEBUG__ = {
    logPerformance: logPerformanceReport,

    logQueryCache: () => {
      console.group('🗄️ React Query Cache');
      console.log(
        'Available queries:',
        (window as any).__queryClient__
          ?.getQueryCache()
          .getAll()
          .map((q) => ({
            key: q.queryKey,
            data: q.state.data ? 'has data' : 'no data',
            status: q.state.status,
            isStale: q.state.isStale,
          }))
      );
      console.groupEnd();
    },

    findHookUsage: (hookName: string) => {
      console.log(`🔍 Searching for usage of ${hookName}...`);
      // This would integrate with your build tools to search for hook usage
      console.log('This feature requires build tool integration');
    },

    benchmarkHook: (hookName: string) => {
      console.log(`⏱️ Benchmarking ${hookName}...`);
      // This would run performance benchmarks on specific hooks
      console.log('This feature requires performance testing integration');
    },
  };

  console.log('🚀 Aggregate debugging tools loaded. Use window.__AGGREGATE_DEBUG__ for utilities.');
}
