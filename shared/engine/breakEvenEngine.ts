import { DAYS_PER_MONTH } from '../constants';
import type { BreakEvenResult, MenuItem, SupplierItem } from '../types';
import { clampNonNegative, safeDivide } from './math';
import {
  grossSellingPrice,
  netSellingPrice,
  type VatSettings,
} from './pricingEngine';
import { cogsForMenuItem } from './recipeCostEngine';

/* -------------------------------------------------------------------------- */
/* Fixed costs                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Total monthly cash fixed costs:
 * Rent + Loaded Payroll + Utilities + Marketing + Loan Installment (+ Other).
 *
 * Depreciation is intentionally excluded: it is a non-cash provision shown in
 * the asset register instead of the cash break-even.
 */
export interface CashFixedCostComponents {
  rent: number;
  loadedPayroll: number;
  utilities: number;
  marketing: number;
  loanInstallment: number;
  /** Explicit waste expenses only; supplier waste is inside menu COGS. */
  waste?: number;
  /** Any recurring cost that does not fit the named buckets. */
  other?: number;
}

export function totalCashFixedCosts(
  components: CashFixedCostComponents,
): number {
  return (
    clampNonNegative(components.rent) +
    clampNonNegative(components.loadedPayroll) +
    clampNonNegative(components.utilities) +
    clampNonNegative(components.marketing) +
    clampNonNegative(components.loanInstallment) +
    clampNonNegative(components.waste ?? 0) +
    clampNonNegative(components.other ?? 0)
  );
}

/* -------------------------------------------------------------------------- */
/* Break-even                                                                 */
/* -------------------------------------------------------------------------- */

export interface BreakEvenInput {
  fixedCashCosts: number;
  /** Policy target: raw-material cost as a percentage of revenue (0–100). */
  targetMaterialCostRatio: number;
  /** The full menu, including each item's expected daily sales volume. */
  menu: readonly MenuItem[];
  /** Supplier prices used to derive each item's projected COGS. */
  suppliers?: readonly SupplierItem[];
  /** VAT treatment of the menu prices. Defaults to no VAT. */
  vatSettings?: VatSettings;
}

const NO_VAT: VatSettings = { pricesIncludeVAT: false, vatRate: 0 };

/**
 * Fixed-target cash break-even on a net-of-VAT basis.
 *
 * The target is a policy decision, not a menu average:
 *
 * MarginRatio             = 1 − (TargetMaterialCostRatio ÷ 100)
 * MonthlyBreakEvenRevenue = FixedCashCosts ÷ MarginRatio   (net of VAT)
 * RequiredDailyRevenue    = MonthlyBreakEvenRevenue ÷ 30.41 (net of VAT)
 *
 * The menu forecast is reported separately and never feeds the target:
 *
 * ProjectedDailyRevenue   = Σ(netPrice × expectedDailyUnits)
 * ProjectedDailyGross     = Σ(grossPrice × expectedDailyUnits)
 * ProjectedDailyVat       = ProjectedDailyGross − ProjectedDailyRevenue
 *
 * VAT is money the café collects on behalf of the tax authority, so it can
 * never cover a fixed cost. Coverage therefore compares net revenue with the
 * net break-even target.
 *
 * The only way the target becomes unreachable is a target material ratio of
 * 100% (or higher), which leaves zero contribution margin.
 */
export function computeBreakEven(input: BreakEvenInput): BreakEvenResult {
  const fixedCashCosts = clampNonNegative(input.fixedCashCosts);
  const targetMaterialCostRatio = Math.min(
    100,
    clampNonNegative(input.targetMaterialCostRatio),
  );
  const marginRatio = 1 - targetMaterialCostRatio / 100;
  const isBreakEvenReachable = marginRatio > 0;

  const monthlyBreakEvenRevenue = isBreakEvenReachable
    ? safeDivide(fixedCashCosts, marginRatio, 0)
    : 0;
  const requiredDailyRevenue = monthlyBreakEvenRevenue / DAYS_PER_MONTH;

  const suppliers = input.suppliers ?? [];
  const vat = input.vatSettings ?? NO_VAT;
  let hasData = false;
  let projectedDailyRevenue = 0;
  let projectedDailyGrossRevenue = 0;
  let projectedDailyVat = 0;
  let projectedDailyCogs = 0;

  for (const item of input.menu) {
    const units = clampNonNegative(item.expectedDailyUnits ?? 0);
    if (units <= 0) continue;

    hasData = true;
    const listPrice = clampNonNegative(item.sellingPrice);
    const netPrice = netSellingPrice(
      listPrice,
      vat.pricesIncludeVAT,
      vat.vatRate,
    );
    const grossPrice = grossSellingPrice(
      listPrice,
      vat.pricesIncludeVAT,
      vat.vatRate,
    );

    projectedDailyRevenue += netPrice * units;
    projectedDailyGrossRevenue += grossPrice * units;
    projectedDailyVat += (grossPrice - netPrice) * units;
    projectedDailyCogs +=
      clampNonNegative(cogsForMenuItem(item, suppliers)) * units;
  }

  const projectedMonthlyRevenue = projectedDailyRevenue * DAYS_PER_MONTH;
  const projectedMonthlyGrossRevenue =
    projectedDailyGrossRevenue * DAYS_PER_MONTH;
  const projectedMonthlyVat = projectedDailyVat * DAYS_PER_MONTH;

  /* Selling below material cost destroys cash on every additional sale. */
  const negativeContribution =
    projectedDailyRevenue > 0 && projectedDailyCogs >= projectedDailyRevenue;

  const coversBreakEven =
    isBreakEvenReachable &&
    hasData &&
    !negativeContribution &&
    projectedDailyRevenue >= requiredDailyRevenue;
  const revenueGap =
    isBreakEvenReachable && !negativeContribution
      ? Math.max(0, requiredDailyRevenue - projectedDailyRevenue)
      : 0;

  return {
    fixedCashCosts,
    targetMaterialCostRatio,
    marginRatio,
    isCalculable: isBreakEvenReachable,
    isBreakEvenReachable,
    monthlyBreakEvenRevenue,
    requiredDailyRevenue,
    hasData,
    projectedDailyRevenue,
    projectedMonthlyRevenue,
    projectedDailyGrossRevenue,
    projectedMonthlyGrossRevenue,
    projectedDailyVat,
    projectedMonthlyVat,
    projectedDailyCogs,
    revenueGap,
    coversBreakEven,
    negativeContribution,
  };
}
