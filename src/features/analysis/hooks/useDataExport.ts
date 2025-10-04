import { useCallback, useMemo } from 'react';
import { container } from 'tsyringe';

import { AnalysisQueryService } from '@/features/analysis/query-services/AnalysisQueryService';
import { ExportService } from '@/features/data-sync/services/ExportService';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';
import { useObserveQuery } from '@/shared/hooks/useObserveQuery';

export interface ExportData {
  workouts?: boolean;
  maxLogs?: boolean;
  exercises?: boolean;
  bodyMetrics?: boolean;
  trainingPlans?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  supportsScheduling: boolean;
}

export interface ExportConfig {
  format: string;
  data: ExportData;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    enabled: boolean;
  };
  destination?: 'download' | 'email' | 'cloud';
}

interface UseDataExportResult {
  exportToCSV: (data: ExportData) => Promise<string>;
  exportToPDF: (reportType: string) => Promise<Blob>;
  exportFormats: ExportFormat[];
  scheduleExport: (config: ExportConfig) => Promise<void>;
  cancelScheduledExport: (configId: string) => Promise<void>;
  getScheduledExports: () => Promise<ExportConfig[]>;
  isExporting: boolean;
}

/**
 * Hook for advanced data export with multiple formats and automated exports.
 *
 * Provides comprehensive data export functionality with support for multiple formats,
 * date range filtering, and scheduled automated exports. Enhances the basic export
 * capabilities with formatted reports and scheduling features.
 *
 * @param profileId The profile ID to export data for
 * @returns Object with export functions and format configurations
 *
 * @example
 * ```typescript
 * const {
 *   exportToCSV,
 *   exportToPDF,
 *   exportFormats,
 *   scheduleExport
 * } = useDataExport(profileId);
 *
 * // Export workout data to CSV
 * const handleExportCSV = async () => {
 *   const csvData = await exportToCSV({
 *     workouts: true,
 *     maxLogs: true,
 *     dateRange: { from: startDate, to: endDate }
 *   });
 *   // Download or display CSV data
 * };
 *
 * // Schedule weekly exports
 * const handleScheduleExport = async () => {
 *   await scheduleExport({
 *     format: 'csv',
 *     data: { workouts: true },
 *     schedule: { frequency: 'weekly', time: '09:00', enabled: true }
 *   });
 * };
 * ```
 */
export function useDataExport(profileId: string): UseDataExportResult {
  const exportService = container.resolve(ExportService);
  const workoutQueryService = container.resolve(WorkoutQueryService);
  const maxLogQueryService = container.resolve(MaxLogQueryService);
  const analysisQueryService = container.resolve(AnalysisQueryService);

  // Available export formats
  const exportFormats: ExportFormat[] = useMemo(
    () => [
      {
        id: 'csv',
        name: 'CSV (Comma-Separated Values)',
        extension: '.csv',
        description: 'Compatible with Excel and other spreadsheet applications',
        supportsScheduling: true,
      },
      {
        id: 'json',
        name: 'JSON (JavaScript Object Notation)',
        extension: '.json',
        description: 'Structured data format for developers and data analysis',
        supportsScheduling: true,
      },
      {
        id: 'pdf-report',
        name: 'PDF Progress Report',
        extension: '.pdf',
        description: 'Formatted progress report with charts and statistics',
        supportsScheduling: false,
      },
      {
        id: 'pdf-workout-log',
        name: 'PDF Workout Log',
        extension: '.pdf',
        description: 'Detailed workout history in printable format',
        supportsScheduling: false,
      },
      {
        id: 'excel',
        name: 'Excel Workbook',
        extension: '.xlsx',
        description: 'Multiple sheets with different data types',
        supportsScheduling: true,
      },
    ],
    []
  );

  /**
   * Exports data to CSV format
   */
  const exportToCSV = useCallback(
    async (data: ExportData): Promise<string> => {
      try {
        const exportDataCollection: any = {};

        // Collect workout data
        if (data.workouts) {
          const workouts = await workoutQueryService
            .getWorkoutLogs(profileId, {
              dateRange: data.dateRange || { from: new Date(0), to: new Date() },
            })
            .fetch();
          exportDataCollection.workouts = workouts;
        }

        // Collect max logs
        if (data.maxLogs) {
          const maxLogs = await maxLogQueryService.getAllMaxLogs(profileId).fetch();
          exportDataCollection.maxLogs = maxLogs;
        }

        // Export using the service
        const csvData = await exportService.exportToCSV(profileId, exportDataCollection);
        return csvData;
      } catch (_error) {
        console.error('Error exporting to CSV:', _error);
        throw new Error('Failed to export data to CSV');
      }
    },
    [profileId, exportService, workoutQueryService, maxLogQueryService]
  );

  /**
   * Exports data to PDF format
   */
  const exportToPDF = useCallback(
    async (reportType: string): Promise<Blob> => {
      try {
        let pdfData: Blob;

        switch (reportType) {
          case 'progress-report':
            // Generate a comprehensive progress report
            const progressData = await analysisQueryService.getProgressAnalysis(profileId);
            pdfData = await exportService.generateProgressReportPDF(profileId, progressData);
            break;

          case 'workout-log':
            // Generate a workout log report
            const workouts = await workoutQueryService.getCompleteWorkoutHistory(profileId).fetch();
            pdfData = await exportService.generateWorkoutLogPDF(profileId, workouts);
            break;

          default:
            throw new Error(`Unknown report type: ${reportType}`);
        }

        return pdfData;
      } catch (_error) {
        console.error('Error exporting to PDF:', _error);
        throw new Error('Failed to export data to PDF');
      }
    },
    [profileId, exportService, analysisQueryService, workoutQueryService]
  );

  /**
   * Schedules automated data exports
   */
  const scheduleExport = useCallback(
    async (config: ExportConfig): Promise<void> => {
      try {
        // This would integrate with a scheduling service (like cron jobs or background tasks)
        console.log('Would schedule export with config:', config);

        // Implementation would:
        // 1. Validate the export configuration
        // 2. Store the schedule in the database
        // 3. Set up the recurring export job
        // 4. Handle notification preferences

        // For now, store the configuration locally
        const scheduledExports = JSON.parse(
          localStorage.getItem(`scheduled_exports_${profileId}`) || '[]'
        );

        const newConfig = {
          ...config,
          id: `export_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        scheduledExports.push(newConfig);
        localStorage.setItem(`scheduled_exports_${profileId}`, JSON.stringify(scheduledExports));
      } catch (_error) {
        console.error('Error scheduling export:', _error);
        throw new Error('Failed to schedule export');
      }
    },
    [profileId]
  );

  /**
   * Cancels a scheduled export
   */
  const cancelScheduledExport = useCallback(
    async (configId: string): Promise<void> => {
      try {
        const scheduledExports = JSON.parse(
          localStorage.getItem(`scheduled_exports_${profileId}`) || '[]'
        );
        const updatedExports = scheduledExports.filter((config: any) => config.id !== configId);
        localStorage.setItem(`scheduled_exports_${profileId}`, JSON.stringify(updatedExports));

        console.log('Cancelled scheduled export:', configId);
      } catch (_error) {
        console.error('Error cancelling scheduled export:', _error);
        throw new Error('Failed to cancel scheduled export');
      }
    },
    [profileId]
  );

  /**
   * Gets all scheduled exports for the profile
   */
  const getScheduledExports = useCallback(async (): Promise<ExportConfig[]> => {
    try {
      const scheduledExports = JSON.parse(
        localStorage.getItem(`scheduled_exports_${profileId}`) || '[]'
      );

      return scheduledExports;
    } catch (_error) {
      console.error('Error getting scheduled exports:', _error);
      return [];
    }
  }, [profileId]);

  // Track export status (would be managed by the export service in a real implementation)
  const isExporting = useMemo(() => false, []);

  return {
    exportToCSV,
    exportToPDF,
    exportFormats,
    scheduleExport,
    cancelScheduledExport,
    getScheduledExports,
    isExporting,
  };
}
