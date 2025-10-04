import { injectable } from 'tsyringe';

import { ILogger } from './ILogger';

/**
 * A simple implementation of the ILogger interface that logs to the console.
 */
@injectable()
export class ConsoleLogger implements ILogger {
  public info(message: string, data?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, data || '');
  }

  public warn(message: string, data?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  public error(message: string, error?: Error, data?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, { error, ...data });
  }
}
