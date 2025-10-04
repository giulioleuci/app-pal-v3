import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Create a demo component that doesn't rely on dependency injection
const ExerciseDeepDivePageDemo: React.FC<{ mockData: any }> = ({ mockData }) => {
  const mockExerciseData = {
    exerciseDetails: mockData?.exerciseDetails || null,
    volumeHistory: mockData?.volumeHistory || null,
    performanceMetrics: mockData?.performanceMetrics || null,
    isLoading: mockData?.isLoading || false,
    isError: mockData?.isError || false,
    error: mockData?.error || null,
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <h1>Exercise Deep Dive</h1>
      <p>Demo of the ExerciseDeepDivePage component with mock data.</p>

      {mockExerciseData.isLoading ? (
        <div>Loading exercise data...</div>
      ) : mockExerciseData.isError ? (
        <div style={{ color: 'red' }}>Error: {mockExerciseData.error?.message}</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          {mockExerciseData.exerciseDetails && (
            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <h2>{mockExerciseData.exerciseDetails.name}</h2>
              <p>{mockExerciseData.exerciseDetails.description}</p>
              {mockExerciseData.exerciseDetails.category && (
                <p>
                  <strong>Category:</strong> {mockExerciseData.exerciseDetails.category}
                </p>
              )}
              {mockExerciseData.exerciseDetails.equipment && (
                <p>
                  <strong>Equipment:</strong>{' '}
                  {mockExerciseData.exerciseDetails.equipment.join(', ')}
                </p>
              )}
            </div>
          )}

          {mockExerciseData.performanceMetrics && (
            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <h3>Performance Summary</h3>
              <ul>
                <li>Total Volume: {mockExerciseData.performanceMetrics.totalVolume} kg</li>
                <li>Personal Best: {mockExerciseData.performanceMetrics.personalBest} kg</li>
                <li>Total Sessions: {mockExerciseData.performanceMetrics.totalSessions}</li>
                <li>Average Volume: {mockExerciseData.performanceMetrics.averageVolume} kg</li>
                {mockExerciseData.performanceMetrics.progressionRate && (
                  <li>
                    Progression Rate: {mockExerciseData.performanceMetrics.progressionRate * 100}%
                  </li>
                )}
                {mockExerciseData.performanceMetrics.consistencyScore && (
                  <li>
                    Consistency Score: {mockExerciseData.performanceMetrics.consistencyScore * 100}%
                  </li>
                )}
              </ul>
            </div>
          )}

          <div
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h3>Volume History Chart</h3>
            <p>📈 Volume progression over time would be displayed here</p>
            {mockExerciseData.volumeHistory && (
              <div>
                <p>Data points: {mockExerciseData.volumeHistory.length}</p>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h3>Performance Metrics Chart</h3>
            <p>📊 Performance analytics would be displayed here</p>
          </div>

          <div
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h3>Strength Progression Chart</h3>
            <p>💪 Strength gains over time would be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof ExerciseDeepDivePageDemo> = {
  title: 'Pages/ExerciseDeepDivePage',
  component: ExerciseDeepDivePageDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Exercise Deep Dive page providing comprehensive performance analytics for a specific exercise.',
      },
    },
  },
  argTypes: {
    mockData: {
      description: 'Mock data for the exercise deep dive page',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExerciseDeepDivePageDemo>;

/**
 * Default story showing the exercise deep dive page with sample data
 */
export const Default: Story = {
  args: {
    mockData: {
      exerciseDetails: {
        id: '1',
        name: 'Bench Press',
        description: 'Classic compound chest exercise for building upper body strength',
        category: 'Chest',
        equipment: ['Barbell', 'Bench'],
      },
      volumeHistory: [
        { date: '2024-01-01', volume: 5000 },
        { date: '2024-01-08', volume: 5200 },
        { date: '2024-01-15', volume: 5400 },
        { date: '2024-01-22', volume: 5100 },
        { date: '2024-01-29', volume: 5600 },
      ],
      performanceMetrics: {
        totalVolume: 156000,
        personalBest: 225,
        totalSessions: 24,
        averageVolume: 6500,
        progressionRate: 0.15,
        consistencyScore: 0.87,
      },
      isLoading: false,
      isError: false,
      error: null,
    },
  },
};

/**
 * Loading state story
 */
export const Loading: Story = {
  args: {
    mockData: {
      exerciseDetails: null,
      volumeHistory: null,
      performanceMetrics: null,
      isLoading: true,
      isError: false,
      error: null,
    },
  },
};

/**
 * Error state story
 */
export const ErrorState: Story = {
  args: {
    mockData: {
      exerciseDetails: null,
      volumeHistory: null,
      performanceMetrics: null,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load exercise performance data'),
    },
  },
};

/**
 * Exercise with minimal data
 */
export const MinimalData: Story = {
  args: {
    mockData: {
      exerciseDetails: {
        id: '2',
        name: 'Deadlift',
        description: '',
      },
      volumeHistory: null,
      performanceMetrics: {
        totalVolume: 0,
        personalBest: 0,
        totalSessions: 0,
        averageVolume: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    },
  },
};

/**
 * Exercise with extensive data
 */
export const ExtensiveData: Story = {
  args: {
    mockData: {
      exerciseDetails: {
        id: '3',
        name: 'Squat',
        description: 'The king of all exercises - compound movement targeting legs and core',
        category: 'Legs',
        equipment: ['Barbell', 'Squat Rack', 'Safety Bars'],
        muscleGroups: ['Quadriceps', 'Glutes', 'Core'],
      },
      volumeHistory: Array.from({ length: 20 }, (_, i) => ({
        date: new Date(2024, 0, i * 3 + 1).toISOString(),
        volume: 4000 + Math.random() * 2000,
      })),
      performanceMetrics: {
        totalVolume: 285600,
        personalBest: 315,
        totalSessions: 48,
        averageVolume: 5950,
        progressionRate: 0.22,
        consistencyScore: 0.94,
        strengthGain: 45,
        volumeGrowth: 0.18,
        frequencyPerWeek: 2.1,
      },
      isLoading: false,
      isError: false,
      error: null,
    },
  },
};
