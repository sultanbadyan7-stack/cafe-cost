import { clampNonNegative } from './math';

/**
 * Currency conversion.
 *
 * Exchange rates are expressed as "units of this currency per one US dollar"
 * (for example SAR 3.75). Converting a value therefore moves through USD:
 *
 *   valueInUsd = amount ÷ fromRate
 *   converted  = valueInUsd × toRate = amount × (toRate ÷ fromRate)
 *
 * A missing or non-positive rate leaves the amount untouched, because there is
 * no trustworthy basis for conversion. Rates are never fetched from a network.
 */
export function convertCurrencyAmount(
  amount: number,
  fromRateToUsd: number,
  toRateToUsd: number,
): number {
  const value = Number.isFinite(amount) ? amount : 0;
  const fromRate = clampNonNegative(fromRateToUsd);
  const toRate = clampNonNegative(toRateToUsd);

  if (fromRate <= 0 || toRate <= 0) return value;
  return value * (toRate / fromRate);
}
