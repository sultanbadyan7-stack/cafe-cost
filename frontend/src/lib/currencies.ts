/**
 * Supported display currencies.
 *
 * `referenceRate` is only a starting point for the manual "exchange rate to
 * USD" field. Users can always overwrite it; no network lookup is performed.
 */
export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  referenceRate: number;
}

export const CURRENCIES: readonly CurrencyOption[] = [
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', referenceRate: 3.75 },
  { code: 'USD', symbol: '$', name: 'US Dollar', referenceRate: 1 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', referenceRate: 3.6725 },
  { code: 'EUR', symbol: '€', name: 'Euro', referenceRate: 0.92 },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', referenceRate: 0.31 },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', referenceRate: 3.64 },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', referenceRate: 0.3845 },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar', referenceRate: 0.376 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', referenceRate: 48 },
  { code: 'JOD', symbol: 'د.أ', name: 'Jordanian Dinar', referenceRate: 0.709 },
];

export function currencyByCode(
  code: string,
): CurrencyOption | undefined {
  return CURRENCIES.find(
    (currency) => currency.code.toUpperCase() === code.toUpperCase(),
  );
}
