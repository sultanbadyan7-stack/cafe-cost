import { BENCHMARKS } from '../constants';
import type { HealthBand } from '../types';
import { clampNonNegative, safeDivide } from './math';

/**
 * Materials & labour cost as a share of revenue.
 *
 * MaterialsAndLabour% = (COGS ratio + loaded payroll ÷ revenue) × 100.
 * At the cash break-even revenue, monthly COGS equals
 * `revenue × cogsRatio`, so the ratio can be evaluated directly.
 * Passing a null/zero revenue returns null instead of Infinity.
 */
export function computeMaterialsAndLaborPercent(input: {
  cogsRatio: number;
  monthlyPayroll: number;
  monthlyRevenue: number | null;
}): number | null {
  const revenue = input.monthlyRevenue;
  if (revenue === null || revenue <= 0) return null;

  const labourRatio = safeDivide(
    clampNonNegative(input.monthlyPayroll),
    revenue,
    0,
  );
  return (clampNonNegative(input.cogsRatio) + labourRatio) * 100;
}

/**
 * Materials & labour health band.
 * Safe ≤ 60.0%, warning 60.1–65.0%, critical > 65.0%.
 */
export function classifyMaterialsAndLabor(
  percent: number | null,
): HealthBand {
  if (percent === null || !Number.isFinite(percent)) return 'unknown';
  if (percent <= BENCHMARKS.materialsAndLabor.safeMaxPercent) return 'healthy';
  if (percent <= BENCHMARKS.materialsAndLabor.warningMaxPercent) return 'warning';
  return 'critical';
}

/** Rent to revenue = (monthly rent ÷ monthly net revenue) × 100. */
export function computeRentToRevenuePercent(
  monthlyRent: number,
  monthlyRevenue: number | null,
): number | null {
  if (monthlyRevenue === null || monthlyRevenue <= 0) return null;
  return (
    safeDivide(clampNonNegative(monthlyRent), monthlyRevenue, 0) * 100
  );
}

export function classifyRentToRevenue(percent: number | null): HealthBand {
  if (percent === null || !Number.isFinite(percent)) return 'unknown';
  if (percent > BENCHMARKS.rentToRevenue.warningMaxPercent) return 'critical';
  if (percent > BENCHMARKS.rentToRevenue.safeMaxPercent) return 'warning';
  if (percent < BENCHMARKS.rentToRevenue.safeMinPercent) return 'warning';
  return 'healthy';
}

/** Cash runway health band: ≥6 months safe, 3–5.9 caution, <3 critical. */
export function classifyCashRunway(months: number | null): HealthBand {
  if (months === null || !Number.isFinite(months)) return 'unknown';
  if (months >= 6) return 'healthy';
  if (months >= 3) return 'warning';
  return 'critical';
}

/**
 * Menu margin guardrail.
 *
 * Input is a contribution-margin ratio (0.72 = 72%). Standard menu items use
 * the 65 / 50 thresholds. Retail bean bags are a resale product with packaging
 * cost, so they use the slightly wider 45 / 30 retail band.
 */
export function classifyMenuMargin(
  ratio: number | null,
  category?: string,
): HealthBand {
  if (ratio === null || !Number.isFinite(ratio)) return 'unknown';
  const percent = ratio * 100;
  const bands =
    category === 'retail_beans'
      ? BENCHMARKS.retailBeanMargin
      : BENCHMARKS.menuMargin;
  if (percent > bands.safeMinPercent) return 'healthy';
  if (percent >= bands.warningMinPercent) return 'warning';
  return 'critical';
}
