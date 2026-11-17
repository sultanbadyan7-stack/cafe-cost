import type { HealthBand } from '@shared/types';

/**
 * Presentation-only formatting. No financial arithmetic happens here.
 */

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return numberFormatter.format(value);
}

export function formatCurrency(
  value: number | null,
  symbol: string,
): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${numberFormatter.format(value)} ${symbol}`;
}

const preciseFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Two-decimal currency used by the §4.3 numerator/denominator drawer. */
export function formatCurrencyPrecise(
  value: number | null,
  symbol: string,
): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${preciseFormatter.format(value)} ${symbol}`;
}

/** Two-decimal number used by live calculation steps. */
export function formatNumberPrecise(
  value: number | null,
  digits = 2,
): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(
  value: number | null,
  digits: number = 1,
): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const formatter =
    digits === 1
      ? decimalFormatter
      : new Intl.NumberFormat('en-US', {
          maximumFractionDigits: digits,
          minimumFractionDigits: digits,
        });
  return `${formatter.format(value)}%`;
}

export function formatRatioPercent(
  value: number | null,
  digits: number = 1,
): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return formatPercent(value * 100, digits);
}

export function formatDate(isoDate: string, language: 'en' | 'ar'): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(timestamp: number | null): string {
  if (timestamp === null) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function healthTone(band: HealthBand): string {
  switch (band) {
    case 'healthy':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'critical':
      return 'text-danger';
    default:
      return 'text-primary/50';
  }
}
