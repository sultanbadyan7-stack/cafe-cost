import type { ProjectSettings } from '../types';

/**
 * Editable reference presets.
 *
 * These are starting points, never locked facts. Every field remains editable
 * in the General tab.
 */
export const REFERENCE_PRESETS = {
  SA: {
    label: 'Saudi Arabia — reference preset',
    currencyCode: 'SAR',
    currencySymbol: 'SAR',
    exchangeRateToUSD: 3.75,
    socialInsuranceRate: 11.75,
    endOfServiceRate: 8.33,
    disclaimer: 'Reference estimate — verify with official authorities.',
  },
} as const;

export const PRESET_DISCLAIMER =
  'Reference estimate — verify with official authorities.';

/** Neutral starting point for a new project. Every value remains editable. */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  projectName: '',
  currencyCode: REFERENCE_PRESETS.SA.currencyCode,
  currencySymbol: REFERENCE_PRESETS.SA.currencySymbol,
  exchangeRateToUSD: REFERENCE_PRESETS.SA.exchangeRateToUSD,
  operatingHoursPerDay: 16,
  operatingDaysPerWeek: 7,
  socialInsuranceRate: REFERENCE_PRESETS.SA.socialInsuranceRate,
  endOfServiceRate: REFERENCE_PRESETS.SA.endOfServiceRate,
  TargetMaterialCostRatio: 30,
  PricesIncludeVAT: true,
  VATRate: 15,
  lastUpdatedPresets: '2026-11-11',
};
