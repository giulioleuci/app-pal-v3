/**
 * Defines the contract for a logging service.
 */
export interface ILogger {
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, error?: Error, data?: Record<string, any>): void;
}
