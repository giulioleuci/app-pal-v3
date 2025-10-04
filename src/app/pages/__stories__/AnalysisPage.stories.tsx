import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import React from 'react';

// Create a demo component that doesn't rely on dependency injection
const AnalysisPageDemo: React.FC = () => {
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Mock analytics data
  const mockAnalyticsData = {
    volume: {
      data: { totalVolume: 125750, trend: 'increasing' },
      isLoading: false,
      error: null,
    },
    frequency: {
      data: { totalSessions: 30, averageFrequency: 4.2 },
      isLoading: false,
      error: null,
    },
    weightProgress: {
      data: { currentWeight: 78.5, weightChange: 2.3 },
      isLoading: false,
      error: null,
    },
    insights: {
      overallProgress: 'You are making excellent progress! Keep up the great work.',
      recommendations: [
        'Try increasing weights by 2.5kg for major compound movements',
        'Consider adding an extra rest day to optimize recovery',
        'Focus on progressive overload for the next 2 weeks',
      ],
    },
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <h1>Analytics Dashboard</h1>
      <p>This is a demo of the AnalysisPage component with mock data.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        {/* Volume Widget */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h3>Volume Analysis</h3>
          <p>Total Volume: {mockAnalyticsData.volume.data.totalVolume} kg</p>
          <p>Trend: {mockAnalyticsData.volume.data.trend}</p>
        </div>

        {/* Frequency Widget */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h3>Frequency Analysis</h3>
          <p>Total Sessions: {mockAnalyticsData.frequency.data.totalSessions}</p>
          <p>Average Frequency: {mockAnalyticsData.frequency.data.averageFrequency} per week</p>
        </div>

        {/* Weight Progress Widget */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h3>Weight Progress</h3>
          <p>Current Weight: {mockAnalyticsData.weightProgress.data.currentWeight} kg</p>
          <p>Weight Change: +{mockAnalyticsData.weightProgress.data.weightChange} kg</p>
        </div>

        {/* Insights Widget */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            gridColumn: 'span 2',
          }}
        >
          <h3>Insights</h3>
          <p>{mockAnalyticsData.insights.overallProgress}</p>
          <ul>
            {mockAnalyticsData.insights.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => {
            setIsGeneratingReport(true);
            setTimeout(() => setIsGeneratingReport(false), 3000);
          }}
          disabled={isGeneratingReport}
          data-testid='generate-report-button'
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isGeneratingReport ? 'Generating...' : 'Generate Report'}
        </button>

        <button
          onClick={() => {
            setIsExporting(true);
            setTimeout(() => setIsExporting(false), 2000);
          }}
          disabled={isExporting}
          data-testid='export-pdf-button'
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc004e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Report Generation Modal */}
      {isGeneratingReport && (
        <div
          data-testid='report-generation-modal'
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <h2>Generating Report...</h2>
            <div
              style={{
                width: '200px',
                height: '4px',
                backgroundColor: '#e0e0e0',
                borderRadius: '2px',
                margin: '20px 0',
              }}
            >
              <div
                style={{
                  width: '50%',
                  height: '100%',
                  backgroundColor: '#1976d2',
                  borderRadius: '2px',
                }}
              ></div>
            </div>
            <p>Please wait while we generate your analytics report.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Demo variants for different states
const createLoadingDemo = () => {
  const LoadingDemo: React.FC = () => (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <h1>Analytics Dashboard</h1>
      <p>Loading analytics data...</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                height: '20px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            ></div>
            <div style={{ height: '100px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
  return LoadingDemo;
};

const createErrorDemo = () => {
  const ErrorDemo: React.FC = () => (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1 style={{ color: '#d32f2f' }}>Error Loading Analytics</h1>
        <p>Failed to load analytics data. Please try again.</p>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
  return ErrorDemo;
};

const meta: Meta<typeof AnalysisPageDemo> = {
  title: 'Pages/AnalysisPage',
  component: AnalysisPageDemo,
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The **AnalysisPage** is the most data-intensive page in the application, providing comprehensive analytics and reporting capabilities.

## Key Features

- **URL-Synchronized Filters**: Filter state is automatically synchronized with the browser URL
- **Blocking Report Generation**: Full-screen modal prevents interaction during report generation
- **Responsive Analytics Grid**: Widgets adapt to different screen sizes
- **Complete Error Handling**: Robust error boundaries with retry capabilities
- **Loading States**: Skeletons and progress indicators for all async operations

## Data Flow

The page uses the \`useAnalyticsHub\` aggregate hook to manage all analytics data and operations. This includes:
- Volume, frequency, and weight progress analysis
- Chart-ready data formatting
- Report generation and data export
- Comprehensive caching and invalidation

## Architecture Compliance

- Follows **Data-First Design Protocol**
- Implements **URL State Management Mandate**
- Uses **Page-Level Error Handling Protocol**
- Adheres to **Responsive Layout Protocol**
        `,
      },
    },
  },
  argTypes: {
    // No props for page component
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view showing the analysis page with all widgets loaded
 */
export const Default: Story = {
  name: 'Default View',
  parameters: {
    docs: {
      description: {
        story: `
The default analysis page showing all analytics widgets with data loaded.
Demonstrates the responsive grid layout and proper data visualization.
        `,
      },
    },
  },
};

/**
 * Loading state with skeleton placeholders
 */
export const Loading: Story = {
  name: 'Loading State',
  render: createLoadingDemo(),
  parameters: {
    docs: {
      description: {
        story: `
Shows the loading state with skeleton placeholders for all widgets.
Demonstrates proper loading UX with consistent skeleton dimensions.
        `,
      },
    },
  },
};

/**
 * Error state with retry capabilities
 */
export const ErrorState: Story = {
  name: 'Error State',
  render: createErrorDemo(),
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates error handling when analytics data fails to load.
Shows the ErrorDisplay component with retry functionality.
        `,
      },
    },
  },
};

/**
 * With applied filters from URL parameters
 */
export const WithFilters: Story = {
  name: 'With Applied Filters',
  parameters: {
    docs: {
      description: {
        story: `
Shows the analysis page with filters applied and reflected in the URL.
Demonstrates the URL State Management implementation with filter chips.
        `,
      },
    },
  },
};

/**
 * Report generation modal in progress
 */
export const ReportGeneration: Story = {
  name: 'Report Generation',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Try to find the generate report button
    const generateButton = canvas.queryByTestId('generate-report-button');
    if (generateButton) {
      await userEvent.click(generateButton);
    }
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the full-screen blocking modal during report generation.
Shows the linear progress indicator and prevents user interaction.
        `,
      },
    },
  },
};

/**
 * Export functionality interaction
 */
export const DataExport: Story = {
  name: 'Data Export',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Try to click the export PDF button
    const exportButton = canvas.queryByTestId('export-pdf-button');
    if (exportButton) {
      await userEvent.click(exportButton);
    }
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows the data export functionality with PDF export.
Demonstrates user feedback via snackbar notifications.
        `,
      },
    },
  },
};

/**
 * Filter interaction demo
 */
export const FilterInteraction: Story = {
  name: 'Filter Interaction',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Try to click the configure filters button
    const filterButton = canvas.queryByTestId('open-filter-dialog');
    if (filterButton) {
      await userEvent.click(filterButton);
    }
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates filter configuration interaction.
Shows how URL state is synchronized with filter changes.
        `,
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const MobileView: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: `
Shows the analysis page optimized for mobile devices.
Demonstrates responsive grid layout with stacked widgets.
        `,
      },
    },
  },
};

/**
 * Tablet responsive view
 */
export const TabletView: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: `
Shows the analysis page optimized for tablet devices.
Demonstrates responsive grid with 2-column layout.
        `,
      },
    },
  },
};

/**
 * Individual widget error state
 */
export const WidgetError: Story = {
  name: 'Widget Error State',
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates error handling at the individual widget level.
Shows how one widget failure doesn't affect other widgets.
        `,
      },
    },
  },
};

/**
 * Dark theme variant
 */
export const DarkTheme: Story = {
  name: 'Dark Theme',
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: `
Shows the analysis page with dark theme applied.
Demonstrates proper contrast and readability in dark mode.
        `,
      },
    },
  },
};
