import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Create a demo component that doesn't rely on dependency injection
const ConflictResolutionPageDemo: React.FC<{ routeState: any }> = ({ routeState }) => {
  const conflictData = routeState?.error;

  const renderConflicts = (conflicts: any[]) => {
    return conflicts.map((conflict, index) => (
      <div
        key={conflict.id || index}
        style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: `1px solid ${conflict.severity === 'high' ? '#d32f2f' : conflict.severity === 'medium' ? '#ed6c02' : '#2e7d32'}`,
          marginBottom: '10px',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>
          Field: {conflict.field} ({conflict.severity} severity)
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '15px',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Local Value:</strong>
            <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '5px' }}>
              {JSON.stringify(conflict.localValue, null, 2)}
            </pre>
          </div>
          <div style={{ fontSize: '20px' }}>⇄</div>
          <div>
            <strong>Remote Value:</strong>
            <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '5px' }}>
              {JSON.stringify(conflict.remoteValue, null, 2)}
            </pre>
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button style={{ marginRight: '10px', padding: '5px 10px' }}>Use Local</button>
          <button style={{ padding: '5px 10px' }}>Use Remote</button>
        </div>
      </div>
    ));
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <h1>Conflict Resolution</h1>
      <p>
        Demo of the ConflictResolutionPage component for handling data synchronization conflicts.
      </p>

      {!conflictData ? (
        <div
          style={{ color: 'red', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}
        >
          <h3>Error: No conflict data available</h3>
          <p>This page requires conflict data to be passed through the route state.</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ed6c02',
            }}
          >
            <h2>⚠️ Conflicts Overview</h2>
            <p>Found {conflictData.conflictCount || 0} conflicts across different entity types.</p>
          </div>

          {conflictData.conflicts?.map((group: any, groupIndex: number) => (
            <div
              key={groupIndex}
              style={{
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <h3>
                📁 {group.entityType} ({group.conflicts?.length || 0} conflicts)
              </h3>
              <div style={{ marginTop: '15px' }}>
                {group.conflicts && renderConflicts(group.conflicts)}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p>Batch resolution actions:</p>
            <div>
              <button style={{ marginRight: '10px', padding: '10px 20px' }}>Use All Local</button>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Use All Remote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof ConflictResolutionPageDemo> = {
  title: 'Pages/ConflictResolutionPage',
  component: ConflictResolutionPageDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Conflict Resolution page for handling data synchronization conflicts with type-safe error handling.',
      },
    },
  },
  argTypes: {
    routeState: {
      description: 'Route state containing conflict error data',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConflictResolutionPageDemo>;

/**
 * Default story with multiple conflict types
 */
export const Default: Story = {
  args: {
    routeState: {
      error: {
        name: 'ConflictError',
        message: 'Data synchronization conflicts detected',
        conflicts: [
          {
            entityType: 'WorkoutPlan',
            conflicts: [
              {
                id: 'conflict-1',
                field: 'name',
                localValue: 'Push Pull Legs',
                remoteValue: 'Upper Lower Split',
                entityId: 'plan-123',
                severity: 'high' as const,
              },
              {
                id: 'conflict-2',
                field: 'description',
                localValue: 'A 6-day workout split focusing on push/pull/legs',
                remoteValue: 'A 4-day workout split focusing on upper/lower body',
                entityId: 'plan-123',
                severity: 'medium' as const,
              },
            ],
          },
          {
            entityType: 'Exercise',
            conflicts: [
              {
                id: 'conflict-3',
                field: 'sets',
                localValue: 4,
                remoteValue: 3,
                entityId: 'exercise-456',
                severity: 'low' as const,
              },
              {
                id: 'conflict-4',
                field: 'weight',
                localValue: 225,
                remoteValue: 205,
                entityId: 'exercise-456',
                severity: 'high' as const,
              },
            ],
          },
        ],
        conflictCount: 4,
      },
    },
  },
};

/**
 * Single conflict type story
 */
export const SingleConflictType: Story = {
  args: {
    routeState: {
      error: {
        name: 'ConflictError',
        message: 'Exercise data conflict detected',
        conflicts: [
          {
            entityType: 'Exercise',
            conflicts: [
              {
                id: 'conflict-1',
                field: 'reps',
                localValue: 12,
                remoteValue: 10,
                entityId: 'exercise-789',
                severity: 'medium' as const,
              },
            ],
          },
        ],
        conflictCount: 1,
      },
    },
  },
};

/**
 * High severity conflicts story
 */
export const HighSeverityConflicts: Story = {
  args: {
    routeState: {
      error: {
        name: 'ConflictError',
        message: 'Critical data synchronization conflicts detected',
        conflicts: [
          {
            entityType: 'UserProfile',
            conflicts: [
              {
                id: 'conflict-1',
                field: 'bodyWeight',
                localValue: 180,
                remoteValue: 175,
                entityId: 'profile-123',
                severity: 'high' as const,
              },
              {
                id: 'conflict-2',
                field: 'height',
                localValue: 72,
                remoteValue: 71,
                entityId: 'profile-123',
                severity: 'high' as const,
              },
            ],
          },
          {
            entityType: 'WorkoutSession',
            conflicts: [
              {
                id: 'conflict-3',
                field: 'completedAt',
                localValue: '2024-01-15T14:30:00Z',
                remoteValue: '2024-01-15T14:25:00Z',
                entityId: 'session-456',
                severity: 'high' as const,
              },
            ],
          },
        ],
        conflictCount: 3,
      },
    },
  },
};

/**
 * Complex data conflicts story
 */
export const ComplexDataConflicts: Story = {
  args: {
    routeState: {
      error: {
        name: 'ConflictError',
        message: 'Complex data structure conflicts detected',
        conflicts: [
          {
            entityType: 'WorkoutPlan',
            conflicts: [
              {
                id: 'conflict-1',
                field: 'exercises',
                localValue: [
                  { name: 'Bench Press', sets: 4, reps: 8 },
                  { name: 'Incline Press', sets: 3, reps: 10 },
                ],
                remoteValue: [
                  { name: 'Bench Press', sets: 3, reps: 10 },
                  { name: 'Dumbbell Press', sets: 3, reps: 12 },
                ],
                entityId: 'plan-789',
                severity: 'medium' as const,
              },
              {
                id: 'conflict-2',
                field: 'settings',
                localValue: {
                  restTime: 120,
                  autoIncrement: true,
                  trackCardio: false,
                },
                remoteValue: {
                  restTime: 90,
                  autoIncrement: false,
                  trackCardio: true,
                },
                entityId: 'plan-789',
                severity: 'low' as const,
              },
            ],
          },
        ],
        conflictCount: 2,
      },
    },
  },
};

/**
 * No conflict data story (error state)
 */
export const NoConflictData: Story = {
  args: {
    routeState: {
      error: null,
    },
  },
};

/**
 * Invalid error type story
 */
export const InvalidErrorType: Story = {
  args: {
    routeState: {
      error: {
        name: 'SomeOtherError',
        message: 'This is not a conflict error',
      },
    },
  },
};
