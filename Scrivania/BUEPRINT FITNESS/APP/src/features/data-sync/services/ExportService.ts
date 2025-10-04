import { inject, injectable } from 'tsyringe';

import { ILogger } from '@/app/services/ILogger';
import { ApplicationError } from '@/shared/errors/ApplicationError';
import { Result } from '@/shared/utils/Result';

export type ExportFormat = 'json' | 'csv' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  filename: string;
  data: string | Blob;
  mimeType: string;
}

/**
 * Application service responsible for data export functionality.
 * This service handles the conversion and export of various data types
 * to different formats like JSON, CSV, and Excel.
 */
@injectable()
export class ExportService {
  constructor(@inject('ILogger') private readonly logger: ILogger) {}

  /**
   * Exports data to the specified format
   * @param data The data to export
   * @param options Export options including format and filters
   * @returns A Result containing the export data or an error
   */
  async exportData<T>(
    data: T[],
    options: ExportOptions
  ): Promise<Result<ExportResult, ApplicationError>> {
    try {
      this.logger.info('Starting data export', {
        format: options.format,
        recordCount: data.length,
        includeMetadata: options.includeMetadata,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let exportResult: ExportResult;

      switch (options.format) {
        case 'json':
          exportResult = await this.exportToJson(data, options, timestamp);
          break;
        case 'csv':
          exportResult = await this.exportToCsv(data, options, timestamp);
          break;
        case 'xlsx':
          exportResult = await this.exportToExcel(data, options, timestamp);
          break;
        default:
          throw new ApplicationError(`Unsupported export format: ${options.format}`);
      }

      this.logger.info('Data export completed successfully', {
        format: options.format,
        filename: exportResult.filename,
      });

      return Result.success(exportResult);
    } catch (_error) {
      this.logger.error('Failed to export data', _error as Error, {
        format: options.format,
        recordCount: data.length,
      });
      return Result.failure(new ApplicationError('Failed to export data', _error));
    }
  }

  /**
   * Exports data to JSON format
   */
  private async exportToJson<T>(
    data: T[],
    options: ExportOptions,
    timestamp: string
  ): Promise<ExportResult> {
    const exportData = {
      exportDate: new Date().toISOString(),
      format: 'json',
      recordCount: data.length,
      ...(options.includeMetadata && {
        metadata: {
          dateRange: options.dateRange,
          exportOptions: options,
        },
      }),
      data,
    };

    return {
      filename: `export_${timestamp}.json`,
      data: JSON.stringify(exportData, null, 2),
      mimeType: 'application/json',
    };
  }

  /**
   * Exports data to CSV format
   */
  private async exportToCsv<T>(
    data: T[],
    options: ExportOptions,
    timestamp: string
  ): Promise<ExportResult> {
    if (data.length === 0) {
      return {
        filename: `export_${timestamp}.csv`,
        data: '',
        mimeType: 'text/csv',
      };
    }

    // Get headers from first object
    const firstItem = data[0] as Record<string, unknown>;
    const headers = Object.keys(firstItem);

    let csvContent = `${headers.join(',')}\n`;

    for (const item of data) {
      const record = item as Record<string, unknown>;
      const row = headers.map((header) => {
        const value = record[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (value instanceof Date) return value.toISOString();
        return String(value);
      });
      csvContent += `${row.join(',')}\n`;
    }

    if (options.includeMetadata) {
      csvContent =
        `# Export Date: ${new Date().toISOString()}\n` +
        `# Record Count: ${data.length}\n${csvContent}`;
    }

    return {
      filename: `export_${timestamp}.csv`,
      data: csvContent,
      mimeType: 'text/csv',
    };
  }

  /**
   * Exports data to Excel format (basic implementation)
   */
  private async exportToExcel<T>(
    data: T[],
    options: ExportOptions,
    timestamp: string
  ): Promise<ExportResult> {
    // For now, return CSV format with Excel MIME type
    // In a real implementation, you would use a library like xlsx or exceljs
    const csvResult = await this.exportToCsv(data, options, timestamp);

    return {
      filename: `export_${timestamp}.xlsx`,
      data: csvResult.data,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Validates export options
   * @param options The export options to validate
   * @returns A Promise resolving to a Result indicating success or validation errors
   */
  async validateExportOptions(options: ExportOptions): Promise<Result<void, ApplicationError>> {
    const supportedFormats: ExportFormat[] = ['json', 'csv', 'xlsx'];

    if (!supportedFormats.includes(options.format)) {
      return Result.failure(new ApplicationError(`Unsupported export format: ${options.format}`));
    }

    if (options.dateRange) {
      if (options.dateRange.start >= options.dateRange.end) {
        return Result.failure(
          new ApplicationError('Invalid date range: start date must be before end date')
        );
      }
    }

    return Result.success(undefined);
  }
}
