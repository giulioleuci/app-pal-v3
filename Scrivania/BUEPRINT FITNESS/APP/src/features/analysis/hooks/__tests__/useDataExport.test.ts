import { act, renderHook } from '@testing-library/react';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalysisQueryService } from '@/features/analysis/query-services/AnalysisQueryService';
import { ExportService } from '@/features/data-sync/services/ExportService';
import { MaxLogQueryService } from '@/features/max-log/query-services/MaxLogQueryService';
import { WorkoutQueryService } from '@/features/workout/query-services/WorkoutQueryService';

import { ExportConfig, ExportData, useDataExport } from '../useDataExport';

// Mock tsyringe
vi.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject:
    () => (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {},
  singleton: () => (target: any) => target,
  Lifecycle: {
    Singleton: 'Singleton',
    Transient: 'Transient',
    ContainerScoped: 'ContainerScoped',
  },
  container: {
    resolve: vi.fn(),
    registerInstance: vi.fn(),
    register: vi.fn(),
    registerSingleton: vi.fn(),
  },
}));

const mockExportService = {
  exportToCSV: vi.fn(),
  generateProgressReportPDF: vi.fn(),
  generateWorkoutLogPDF: vi.fn(),
};

const mockWorkoutQueryService = {
  getWorkoutHistoryInDateRange: vi.fn(),
  getCompleteWorkoutHistory: vi.fn(),
};

const mockMaxLogQueryService = {
  getAllMaxLogs: vi.fn(),
};

const mockAnalysisQueryService = {
  getProgressAnalysis: vi.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useDataExport', () => {
  const profileId = 'test-profile-id';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup container mocks
    (container.resolve as any).mockImplementation((service: any) => {
      if (service === ExportService) return mockExportService;
      if (service === WorkoutQueryService) return mockWorkoutQueryService;
      if (service === MaxLogQueryService) return mockMaxLogQueryService;
      if (service === AnalysisQueryService) return mockAnalysisQueryService;
      return {};
    });

    // Setup localStorage mocks
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockLocalStorage.setItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Export Formats', () => {
    it('should provide available export formats', () => {
      // Act
      const { result } = renderHook(() => useDataExport(profileId));

      // Assert
      expect(result.current.exportFormats).toHaveLength(5);
      expect(result.current.exportFormats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'csv',
            name: 'CSV (Comma-Separated Values)',
            extension: '.csv',
            supportsScheduling: true,
          }),
          expect.objectContaining({
            id: 'json',
            name: 'JSON (JavaScript Object Notation)',
            extension: '.json',
            supportsScheduling: true,
          }),
          expect.objectContaining({
            id: 'pdf-report',
            name: 'PDF Progress Report',
            extension: '.pdf',
            supportsScheduling: false,
          }),
        ])
      );
    });

    it('should include format descriptions', () => {
      // Act
      const { result } = renderHook(() => useDataExport(profileId));

      // Assert
      const csvFormat = result.current.exportFormats.find((f) => f.id === 'csv');
      expect(csvFormat?.description).toContain('Excel');

      const pdfFormat = result.current.exportFormats.find((f) => f.id === 'pdf-report');
      expect(pdfFormat?.description).toContain('charts');
    });
  });

  describe('CSV Export', () => {
    it('should export workout data to CSV', async () => {
      // Arrange
      const exportData: ExportData = {
        workouts: true,
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      };

      const mockWorkouts = [{ id: 'workout-1', name: 'Test Workout' }];
      const mockQuery = { fetch: vi.fn().mockResolvedValue(mockWorkouts) };

      mockWorkoutQueryService.getWorkoutHistoryInDateRange.mockReturnValue(mockQuery);
      mockExportService.exportToCSV.mockResolvedValue('csv,data,here');

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const csvData = await act(async () => {
        return await result.current.exportToCSV(exportData);
      });

      // Assert
      expect(mockWorkoutQueryService.getWorkoutHistoryInDateRange).toHaveBeenCalledWith(
        profileId,
        exportData.dateRange
      );
      expect(mockExportService.exportToCSV).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining({
          workouts: mockWorkouts,
        })
      );
      expect(csvData).toBe('csv,data,here');
    });

    it('should export max logs to CSV', async () => {
      // Arrange
      const exportData: ExportData = {
        maxLogs: true,
      };

      const mockMaxLogs = [{ id: 'max-1', exercise: 'Squat' }];
      const mockQuery = { fetch: vi.fn().mockResolvedValue(mockMaxLogs) };

      mockMaxLogQueryService.getAllMaxLogs.mockReturnValue(mockQuery);
      mockExportService.exportToCSV.mockResolvedValue('max,logs,csv');

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const csvData = await act(async () => {
        return await result.current.exportToCSV(exportData);
      });

      // Assert
      expect(mockMaxLogQueryService.getAllMaxLogs).toHaveBeenCalledWith(profileId);
      expect(mockExportService.exportToCSV).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining({
          maxLogs: mockMaxLogs,
        })
      );
      expect(csvData).toBe('max,logs,csv');
    });

    it('should handle default date range when none provided', async () => {
      // Arrange
      const exportData: ExportData = {
        workouts: true,
      };

      const mockQuery = { fetch: vi.fn().mockResolvedValue([]) };
      mockWorkoutQueryService.getWorkoutHistoryInDateRange.mockReturnValue(mockQuery);
      mockExportService.exportToCSV.mockResolvedValue('');

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      await act(async () => {
        await result.current.exportToCSV(exportData);
      });

      // Assert
      expect(mockWorkoutQueryService.getWorkoutHistoryInDateRange).toHaveBeenCalledWith(profileId, {
        from: new Date(0),
        to: expect.any(Date),
      });
    });

    it('should handle CSV export errors', async () => {
      // Arrange
      const exportData: ExportData = { workouts: true };
      const mockQuery = { fetch: vi.fn().mockRejectedValue(new Error('Database error')) };

      mockWorkoutQueryService.getWorkoutHistoryInDateRange.mockReturnValue(mockQuery);

      const { result } = renderHook(() => useDataExport(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.exportToCSV(exportData)).rejects.toThrow(
          'Failed to export data to CSV'
        );
      });
    });
  });

  describe('PDF Export', () => {
    it('should export progress report to PDF', async () => {
      // Arrange
      const mockPdfBlob = new Blob(['pdf data'], { type: 'application/pdf' });
      const mockProgressData = { totalWorkouts: 10 };

      mockAnalysisQueryService.getProgressAnalysis.mockResolvedValue(mockProgressData);
      mockExportService.generateProgressReportPDF.mockResolvedValue(mockPdfBlob);

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const pdfData = await act(async () => {
        return await result.current.exportToPDF('progress-report');
      });

      // Assert
      expect(mockAnalysisQueryService.getProgressAnalysis).toHaveBeenCalledWith(profileId);
      expect(mockExportService.generateProgressReportPDF).toHaveBeenCalledWith(
        profileId,
        mockProgressData
      );
      expect(pdfData).toBe(mockPdfBlob);
    });

    it('should export workout log to PDF', async () => {
      // Arrange
      const mockPdfBlob = new Blob(['workout log pdf'], { type: 'application/pdf' });
      const mockWorkouts = [{ id: 'workout-1' }];
      const mockQuery = { fetch: vi.fn().mockResolvedValue(mockWorkouts) };

      mockWorkoutQueryService.getCompleteWorkoutHistory.mockReturnValue(mockQuery);
      mockExportService.generateWorkoutLogPDF.mockResolvedValue(mockPdfBlob);

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const pdfData = await act(async () => {
        return await result.current.exportToPDF('workout-log');
      });

      // Assert
      expect(mockWorkoutQueryService.getCompleteWorkoutHistory).toHaveBeenCalledWith(profileId);
      expect(mockExportService.generateWorkoutLogPDF).toHaveBeenCalledWith(profileId, mockWorkouts);
      expect(pdfData).toBe(mockPdfBlob);
    });

    it('should handle unknown report type', async () => {
      // Arrange
      const { result } = renderHook(() => useDataExport(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.exportToPDF('unknown-type')).rejects.toThrow(
          'Failed to export data to PDF'
        );
      });
    });

    it('should handle PDF export errors', async () => {
      // Arrange
      mockAnalysisQueryService.getProgressAnalysis.mockRejectedValue(
        new Error('Analysis service error')
      );

      const { result } = renderHook(() => useDataExport(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.exportToPDF('progress-report')).rejects.toThrow(
          'Failed to export data to PDF'
        );
      });
    });
  });

  describe('Scheduled Exports', () => {
    it('should schedule an export configuration', async () => {
      // Arrange
      const exportConfig: ExportConfig = {
        format: 'csv',
        data: { workouts: true },
        schedule: {
          frequency: 'weekly',
          time: '09:00',
          enabled: true,
        },
      };

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      await act(async () => {
        await result.current.scheduleExport(exportConfig);
      });

      // Assert
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `scheduled_exports_${profileId}`,
        expect.stringContaining('"format":"csv"')
      );
    });

    it('should add unique ID and timestamp to scheduled export', async () => {
      // Arrange
      const exportConfig: ExportConfig = {
        format: 'json',
        data: { maxLogs: true },
        schedule: {
          frequency: 'monthly',
          time: '08:00',
          enabled: true,
        },
      };

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      await act(async () => {
        await result.current.scheduleExport(exportConfig);
      });

      // Assert
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      expect(parsedData[0]).toMatchObject({
        ...exportConfig,
        id: expect.stringMatching(/^export_\d+$/),
        createdAt: expect.any(String),
      });
    });

    it('should maintain existing scheduled exports', async () => {
      // Arrange
      const existingExports = [{ id: 'existing-1', format: 'csv', data: { workouts: true } }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingExports));

      const newConfig: ExportConfig = {
        format: 'json',
        data: { maxLogs: true },
      };

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      await act(async () => {
        await result.current.scheduleExport(newConfig);
      });

      // Assert
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      expect(parsedData).toHaveLength(2);
      expect(parsedData[0]).toMatchObject(existingExports[0]);
    });

    it('should handle schedule export errors', async () => {
      // Arrange
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const exportConfig: ExportConfig = {
        format: 'csv',
        data: { workouts: true },
      };

      const { result } = renderHook(() => useDataExport(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.scheduleExport(exportConfig)).rejects.toThrow(
          'Failed to schedule export'
        );
      });
    });
  });

  describe('Cancel Scheduled Export', () => {
    it('should cancel a scheduled export by ID', async () => {
      // Arrange
      const existingExports = [
        { id: 'export-1', format: 'csv' },
        { id: 'export-2', format: 'json' },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingExports));

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      await act(async () => {
        await result.current.cancelScheduledExport('export-1');
      });

      // Assert
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].id).toBe('export-2');
    });

    it('should handle cancel with non-existent ID', async () => {
      // Arrange
      const existingExports = [{ id: 'export-1', format: 'csv' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingExports));

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      await act(async () => {
        await result.current.cancelScheduledExport('non-existent');
      });

      // Assert - should not throw and should maintain existing exports
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].id).toBe('export-1');
    });

    it('should handle cancel scheduled export errors', async () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage read error');
      });

      const { result } = renderHook(() => useDataExport(profileId));

      // Act & Assert
      await act(async () => {
        await expect(result.current.cancelScheduledExport('export-1')).rejects.toThrow(
          'Failed to cancel scheduled export'
        );
      });
    });
  });

  describe('Get Scheduled Exports', () => {
    it('should retrieve all scheduled exports for profile', async () => {
      // Arrange
      const scheduledExports = [
        { id: 'export-1', format: 'csv', data: { workouts: true } },
        { id: 'export-2', format: 'json', data: { maxLogs: true } },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(scheduledExports));

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const exports = await act(async () => {
        return await result.current.getScheduledExports();
      });

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`scheduled_exports_${profileId}`);
      expect(exports).toEqual(scheduledExports);
    });

    it('should return empty array when no scheduled exports exist', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('[]');

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const exports = await act(async () => {
        return await result.current.getScheduledExports();
      });

      // Assert
      expect(exports).toEqual([]);
    });

    it('should handle get scheduled exports errors', async () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const exports = await act(async () => {
        return await result.current.getScheduledExports();
      });

      // Assert
      expect(exports).toEqual([]);
    });
  });

  describe('Export Status', () => {
    it('should initialize with isExporting false', () => {
      // Act
      const { result } = renderHook(() => useDataExport(profileId));

      // Assert
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty profile ID', () => {
      // Act
      const { result } = renderHook(() => useDataExport(''));

      // Assert
      expect(result.current.exportFormats).toHaveLength(5);
      expect(result.current.isExporting).toBe(false);
    });

    it('should handle malformed localStorage data', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useDataExport(profileId));

      // Act
      const exports = await act(async () => {
        return await result.current.getScheduledExports();
      });

      // Assert
      expect(exports).toEqual([]);
    });
  });
});
