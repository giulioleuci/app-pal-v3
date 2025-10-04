import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Create a demo component that doesn't rely on dependency injection
const SettingsAdvancedPageDemo: React.FC<{ mockData: any }> = ({ mockData }) => {
  const { maintenanceData = {}, syncData = {} } = mockData || {};

  const {
    generatedAt,
    systemHealth,
    databaseSize,
    performance,
    storage,
    integrity,
    isMaintenanceLoading = false,
    maintenanceError = null,
  } = maintenanceData;

  const {
    score,
    grade,
    critical = 0,
    high = 0,
    medium = 0,
    low = 0,
    total = 0,
    isSyncLoading = false,
    syncError = null,
  } = syncData;

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return '#2e7d32';
      case 'warning':
        return '#ed6c02';
      case 'error':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const getGradeColor = (gradeValue: string) => {
    switch (gradeValue) {
      case 'A':
        return '#2e7d32';
      case 'B':
        return '#1976d2';
      case 'C':
        return '#ed6c02';
      case 'D':
      case 'F':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <h1>Advanced Settings</h1>
      <p>
        Demo of the SettingsAdvancedPage component with system maintenance and data sync controls.
      </p>

      {/* Data Sync Section */}
      <div
        style={{
          marginTop: '20px',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>☁️ Data Sync</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              Manage data synchronization and view sync health metrics
            </p>
          </div>
          <button style={{ padding: '8px 16px' }}>
            {isSyncLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {syncError ? (
          <div
            style={{
              color: 'red',
              padding: '10px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
            }}
          >
            Error loading sync data: {syncError.message}
          </div>
        ) : isSyncLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading sync data...</div>
        ) : (
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}
            >
              <span>Sync Score:</span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: score >= 90 ? '#e8f5e8' : score >= 70 ? '#fff3e0' : '#ffebee',
                  color: score >= 90 ? '#2e7d32' : score >= 70 ? '#ed6c02' : '#d32f2f',
                }}
              >
                {score || 0}%
              </span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: getGradeColor(grade || ''),
                  color: 'white',
                }}
              >
                Grade: {grade || 'N/A'}
              </span>
            </div>

            <div>
              <h4>Issues Breakdown ({total})</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: critical ? '#ffebee' : '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  Critical: {critical}
                </span>
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: high ? '#fff3e0' : '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  High: {high}
                </span>
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: medium ? '#e3f2fd' : '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  Medium: {medium}
                </span>
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: low ? '#e8f5e8' : '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  Low: {low}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Section */}
      <div
        style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>🗄️ Maintenance</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              System health monitoring and maintenance tools
            </p>
          </div>
          <button style={{ padding: '8px 16px' }}>
            {isMaintenanceLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {maintenanceError ? (
          <div
            style={{
              color: 'red',
              padding: '10px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
            }}
          >
            Error loading maintenance data: {maintenanceError.message}
          </div>
        ) : isMaintenanceLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading maintenance data...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: getHealthColor(systemHealth || 'unknown') }}>
                  {systemHealth === 'healthy' ? '✅' : systemHealth === 'warning' ? '⚠️' : '❌'}
                </span>
                <span>System Health</span>
              </div>
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: getHealthColor(systemHealth || 'unknown'),
                  color: 'white',
                  fontSize: '12px',
                }}
              >
                {systemHealth || 'Unknown'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
            >
              <span>Database Size</span>
              <span style={{ fontWeight: 'bold' }}>{databaseSize || '0 MB'}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
            >
              <span>Performance</span>
              <span style={{ fontWeight: 'bold' }}>{performance || 'N/A'}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
            >
              <span>Storage</span>
              <span style={{ fontWeight: 'bold' }}>{storage || 'N/A'}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
            >
              <span>Integrity</span>
              <span style={{ fontWeight: 'bold' }}>{integrity || 'N/A'}</span>
            </div>

            {generatedAt && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Last updated: {new Date(generatedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div
        style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '2px solid #d32f2f',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#d32f2f' }}>🔒 Danger Zone</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Irreversible actions that require confirmation
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#d32f2f',
              border: '1px solid #d32f2f',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => alert('This would trigger a confirmation dialog')}
          >
            🗑️ Clear All Data
          </button>

          <button
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#d32f2f',
              border: '1px solid #d32f2f',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => alert('This would trigger a confirmation dialog')}
          >
            🔄 Reset Database Schema
          </button>

          <button
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#d32f2f',
              border: '1px solid #d32f2f',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => alert('This would trigger a confirmation dialog')}
          >
            🗄️ Purge Old Backups
          </button>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof SettingsAdvancedPageDemo> = {
  title: 'Pages/SettingsAdvancedPage',
  component: SettingsAdvancedPageDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Advanced Settings page providing system maintenance, data synchronization, and administrative controls.',
      },
    },
  },
  argTypes: {
    mockData: {
      description: 'Mock data for maintenance and sync information',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsAdvancedPageDemo>;

/**
 * Default story showing healthy system state
 */
export const Default: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: new Date().toISOString(),
        systemHealth: 'healthy',
        databaseSize: '245 MB',
        performance: 'Excellent',
        storage: '2.1 GB available',
        integrity: '100% verified',
        isMaintenanceLoading: false,
        maintenanceError: null,
      },
      syncData: {
        score: 95,
        grade: 'A',
        critical: 0,
        high: 0,
        medium: 1,
        low: 2,
        total: 3,
        isSyncLoading: false,
        syncError: null,
      },
    },
  },
};

/**
 * Loading state story
 */
export const Loading: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: null,
        systemHealth: null,
        databaseSize: null,
        performance: null,
        storage: null,
        integrity: null,
        isMaintenanceLoading: true,
        maintenanceError: null,
      },
      syncData: {
        score: null,
        grade: null,
        critical: null,
        high: null,
        medium: null,
        low: null,
        total: null,
        isSyncLoading: true,
        syncError: null,
      },
    },
  },
};

/**
 * System with warnings and issues
 */
export const WithWarnings: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        systemHealth: 'warning',
        databaseSize: '1.2 GB',
        performance: 'Good',
        storage: '512 MB available',
        integrity: '98.5% verified',
        isMaintenanceLoading: false,
        maintenanceError: null,
      },
      syncData: {
        score: 73,
        grade: 'C',
        critical: 1,
        high: 3,
        medium: 5,
        low: 2,
        total: 11,
        isSyncLoading: false,
        syncError: null,
      },
    },
  },
};

/**
 * System with critical errors
 */
export const WithCriticalErrors: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        systemHealth: 'error',
        databaseSize: '2.8 GB',
        performance: 'Poor',
        storage: '128 MB available',
        integrity: '89.2% verified',
        isMaintenanceLoading: false,
        maintenanceError: null,
      },
      syncData: {
        score: 42,
        grade: 'F',
        critical: 8,
        high: 12,
        medium: 6,
        low: 3,
        total: 29,
        isSyncLoading: false,
        syncError: null,
      },
    },
  },
};

/**
 * Error state for maintenance data
 */
export const MaintenanceErrorState: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: null,
        systemHealth: null,
        databaseSize: null,
        performance: null,
        storage: null,
        integrity: null,
        isMaintenanceLoading: false,
        maintenanceError: new Error('Failed to load maintenance data'),
      },
      syncData: {
        score: 85,
        grade: 'B',
        critical: 0,
        high: 1,
        medium: 3,
        low: 1,
        total: 5,
        isSyncLoading: false,
        syncError: null,
      },
    },
  },
};

/**
 * Error state for sync data
 */
export const SyncErrorState: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: new Date().toISOString(),
        systemHealth: 'healthy',
        databaseSize: '312 MB',
        performance: 'Excellent',
        storage: '1.8 GB available',
        integrity: '100% verified',
        isMaintenanceLoading: false,
        maintenanceError: null,
      },
      syncData: {
        score: null,
        grade: null,
        critical: null,
        high: null,
        medium: null,
        low: null,
        total: null,
        isSyncLoading: false,
        syncError: new Error('Failed to load sync data'),
      },
    },
  },
};

/**
 * Perfect system state
 */
export const PerfectSystem: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: new Date().toISOString(),
        systemHealth: 'healthy',
        databaseSize: '156 MB',
        performance: 'Exceptional',
        storage: '4.2 GB available',
        integrity: '100% verified',
        isMaintenanceLoading: false,
        maintenanceError: null,
      },
      syncData: {
        score: 100,
        grade: 'A',
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        isSyncLoading: false,
        syncError: null,
      },
    },
  },
};

/**
 * Large database with many issues
 */
export const LargeDatabaseWithIssues: Story = {
  args: {
    mockData: {
      maintenanceData: {
        generatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        systemHealth: 'warning',
        databaseSize: '4.7 GB',
        performance: 'Fair',
        storage: '256 MB available',
        integrity: '94.8% verified',
        isMaintenanceLoading: false,
        maintenanceError: null,
      },
      syncData: {
        score: 58,
        grade: 'D',
        critical: 4,
        high: 8,
        medium: 15,
        low: 12,
        total: 39,
        isSyncLoading: false,
        syncError: null,
      },
    },
  },
};
