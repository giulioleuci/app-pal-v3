/**
 * Centralized data formatting utilities with full internationalization support.
 * Provides consistent, locale-aware formatting for dates, numbers, and other user-facing data.
 */

import { format, formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
import { enUS, it } from 'date-fns/locale';

/**
 * Available locales for date-fns formatting.
 */
const DATE_FNS_LOCALES = {
  en: enUS,
  it,
} as const;

/**
 * Get the current locale for formatting operations.
 * Falls back to 'en' if the current locale is not supported.
 */
function getCurrentLocale(): keyof typeof DATE_FNS_LOCALES {
  const currentLang = document.documentElement.lang || 'en';
  return (currentLang.split('-')[0] as keyof typeof DATE_FNS_LOCALES) || 'en';
}

/**
 * Get the date-fns locale object for the current language.
 */
function getDateFnsLocale() {
  return DATE_FNS_LOCALES[getCurrentLocale()];
}

/**
 * Formats a timestamp into a human-readable date string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param formatPattern - Optional format pattern (default: 'PPP' for long date)
 * @returns Formatted date string in the current locale
 *
 * @example
 * ```typescript
 * formatDate(1640995200000); // "December 31, 2021" (en) or "31 dicembre 2021" (it)
 * formatDate(1640995200000, 'PP'); // "Dec 31, 2021" (en) or "31 dic 2021" (it)
 * ```
 */
export function formatDate(timestamp: number, formatPattern: string = 'PPP'): string {
  try {
    return format(new Date(timestamp), formatPattern, {
      locale: getDateFnsLocale(),
    });
  } catch (_error) {
    console.error('Error formatting date:', _error);
    return 'Invalid Date';
  }
}

/**
 * Formats a timestamp into a short date string (MM/dd/yyyy or dd/MM/yyyy based on locale).
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Short formatted date string
 *
 * @example
 * ```typescript
 * formatShortDate(1640995200000); // "12/31/2021" (en) or "31/12/2021" (it)
 * ```
 */
export function formatShortDate(timestamp: number): string {
  const locale = getCurrentLocale();
  const formatPattern = locale === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
  return formatDate(timestamp, formatPattern);
}

/**
 * Formats a timestamp into a time string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param use24Hour - Whether to use 24-hour format (default: true for 'it', false for 'en')
 * @returns Formatted time string
 *
 * @example
 * ```typescript
 * formatTime(1640995200000); // "6:00 PM" (en) or "18:00" (it)
 * ```
 */
export function formatTime(timestamp: number, use24Hour?: boolean): string {
  const locale = getCurrentLocale();
  const shouldUse24Hour = use24Hour ?? locale === 'it';
  const formatPattern = shouldUse24Hour ? 'HH:mm' : 'h:mm a';

  return formatDate(timestamp, formatPattern);
}

/**
 * Formats a timestamp into a date and time string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string
 *
 * @example
 * ```typescript
 * formatDateTime(1640995200000); // "December 31, 2021 at 6:00 PM"
 * ```
 */
export function formatDateTime(timestamp: number): string {
  const locale = getCurrentLocale();
  const formatPattern = locale === 'en' ? "PPP 'at' p" : "PPP 'alle' HH:mm";

  return formatDate(timestamp, formatPattern);
}

/**
 * Formats a timestamp as a relative time (e.g., "2 hours ago").
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param addSuffix - Whether to add "ago" suffix (default: true)
 * @returns Relative time string
 *
 * @example
 * ```typescript
 * formatRelativeTime(Date.now() - 7200000); // "2 hours ago"
 * ```
 */
export function formatRelativeTime(timestamp: number, addSuffix: boolean = true): string {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix,
      locale: getDateFnsLocale(),
    });
  } catch (_error) {
    console.error('Error formatting relative time:', _error);
    return 'Invalid Date';
  }
}

/**
 * Formats a duration in seconds into a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @param format - Format options ('short', 'long', 'minimal')
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * formatDurationFromSeconds(3661); // "1h 1m 1s" (short)
 * formatDurationFromSeconds(3661, 'long'); // "1 hour 1 minute 1 second"
 * formatDurationFromSeconds(3661, 'minimal'); // "1:01:01"
 * ```
 */
export function formatDurationFromSeconds(
  seconds: number,
  format: 'short' | 'long' | 'minimal' = 'short'
): string {
  if (seconds < 0) return '0s';

  try {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });

    if (format === 'minimal') {
      const hours = duration.hours || 0;
      const minutes = duration.minutes || 0;
      const secs = duration.seconds || 0;

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      }
    }

    const formatStr = format === 'short' ? 'xS' : 'S';
    return formatDuration(duration, {
      format: [
        duration.hours ? 'hours' : null,
        duration.minutes ? 'minutes' : null,
        duration.seconds ? 'seconds' : null,
      ].filter(Boolean) as any,
      locale: getDateFnsLocale(),
    });
  } catch (_error) {
    console.error('Error formatting duration:', _error);
    return '0s';
  }
}

/**
 * Formats a number with locale-specific formatting.
 *
 * @param num - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1234.56); // "1,234.56" (en) or "1.234,56" (it)
 * formatNumber(0.85, { style: 'percent' }); // "85%" (en) or "85%" (it)
 * ```
 */
export function formatNumber(num: number, options: Intl.NumberFormatOptions = {}): string {
  try {
    const locale = getCurrentLocale() === 'en' ? 'en-US' : 'it-IT';
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (_error) {
    console.error('Error formatting number:', _error);
    return String(num);
  }
}

/**
 * Formats a number as a percentage.
 *
 * @param decimal - The decimal value (e.g., 0.85 for 85%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercentage(0.856); // "86%"
 * formatPercentage(0.856, 1); // "85.6%"
 * ```
 */
export function formatPercentage(decimal: number, decimals: number = 0): string {
  return formatNumber(decimal, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a weight value with appropriate units.
 *
 * @param weight - Weight value
 * @param unit - Weight unit ('kg', 'lbs')
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted weight string
 *
 * @example
 * ```typescript
 * formatWeight(75.5, 'kg'); // "75.5 kg"
 * formatWeight(165.3, 'lbs'); // "165.3 lbs"
 * ```
 */
export function formatWeight(weight: number, unit: 'kg' | 'lbs', decimals: number = 1): string {
  const formattedNumber = formatNumber(weight, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return `${formattedNumber} ${unit}`;
}

/**
 * Formats a currency value.
 *
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'EUR')
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(29.99); // "€29.99" (it) or "€29.99" (en)
 * formatCurrency(29.99, 'USD'); // "$29.99"
 * ```
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return formatNumber(amount, {
    style: 'currency',
    currency,
  });
}

/**
 * Formats file size in bytes to human-readable format.
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size string
 *
 * @example
 * ```typescript
 * formatFileSize(1024); // "1.0 KB"
 * formatFileSize(1536000); // "1.5 MB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const formattedSize = formatNumber(bytes / Math.pow(k, i), {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return `${formattedSize} ${sizes[i]}`;
}

/**
 * Formats a list of items with proper conjunctions based on locale.
 *
 * @param items - Array of string items to format
 * @param type - Type of conjunction ('and' or 'or')
 * @returns Formatted list string
 *
 * @example
 * ```typescript
 * formatList(['apples', 'bananas', 'oranges']); // "apples, bananas, and oranges" (en)
 * formatList(['mele', 'banane', 'arance']); // "mele, banane e arance" (it)
 * ```
 */
export function formatList(
  items: string[],
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];

  try {
    const locale = getCurrentLocale() === 'en' ? 'en-US' : 'it-IT';
    return new Intl.ListFormat(locale, { style: 'long', type }).format(items);
  } catch (_error) {
    console.error('Error formatting list:', _error);
    // Fallback formatting
    if (items.length === 2) {
      const conjunction = type === 'conjunction' ? 'and' : 'or';
      return `${items[0]} ${conjunction} ${items[1]}`;
    }
    const lastItem = items[items.length - 1];
    const conjunction = type === 'conjunction' ? ', and ' : ', or ';
    return `${items.slice(0, -1).join(', ')}${conjunction}${lastItem}`;
  }
}
