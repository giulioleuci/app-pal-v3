import { format } from 'date-fns';

/**
 * Formats a date into 'MM/dd/yyyy' format.
 * @param date The date to format.
 * @returns The formatted date string.
 */
export function formatDate(date: Date): string {
  return format(date, 'MM/dd/yyyy');
}

/**
 * Formats a date and time into 'MM/dd/yyyy p' format (e.g., '07/21/2024 5:30 PM').
 * @param date The date to format.
 * @returns The formatted date and time string.
 */
export function formatDateTime(date: Date): string {
  return format(date, 'MM/dd/yyyy p');
}
