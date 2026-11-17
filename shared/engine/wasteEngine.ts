import { DAYS_PER_MONTH } from '../constants';
import type {
  MenuItem,
  OperatingExpenseItem,
  SupplierItem,
} from '../types';
import { clampNonNegative, safeDivide } from './math';
import { menuItemCogsBreakdown } from './recipeCostEngine';

/**
 * Waste model.
 *
 * There are now exactly two places waste can appear, and they never overlap:
 *
 * 1. Supplier `wastePercentage` values are folded into the *effective unit
 *    cost* of every ingredient (see `recipeCostEngine.ts`). That waste is part
 *    of menu COGS and therefore scales with the forecast quantities.
 * 2. Explicit `waste` expenses (spoilage, expired stock, breakage, etc.) stay
 *    in the monthly fixed-cost bucket.
 *
 * Supplier waste must never also be charged as a fixed cost — that would
 * double-count the same loss. The helpers below only *report* the waste that is
 * already embedded in COGS so the UI can explain it; they never add it to the
 * fixed-cost total.
 */

/** Explicit monthly waste expenses. This is the fixed-cost waste bucket. */
export function wasteExpenseTotal(
  expenses: readonly OperatingExpenseItem[],
): number {
  return expenses
    .filter((expense) => expense.category === 'waste')
    .reduce((total, expense) => total + clampNonNegative(expense.amount), 0);
}

/**
 * Total monthly fixed-cost waste.
 *
 * Only explicit waste expenses are counted. Supplier waste lives inside menu
 * COGS, so adding it here as well would double-charge it.
 */
export function totalMonthlyWaste(
  expenses: readonly OperatingExpenseItem[],
): number {
  return wasteExpenseTotal(expenses);
}

/**
 * Supplier waste embedded in one day of forecast production.
 *
 * This is presentation-only: the amount is already included in COGS. It is
 * derived from each item's selected recipe so it follows the same waste rates
 * and quantities the costing engine uses.
 */
export function embeddedWastePerDay(
  menu: readonly MenuItem[],
  suppliers: readonly SupplierItem[],
): number {
  return menu.reduce((total, item) => {
    const breakdown = menuItemCogsBreakdown(item, suppliers);
    const units = clampNonNegative(item.expectedDailyUnits ?? 0);
    return total + breakdown.wasteCost * units;
  }, 0);
}

/** Supplier waste embedded in one month of forecast production. */
export function embeddedWasteMonthly(
  menu: readonly MenuItem[],
  suppliers: readonly SupplierItem[],
): number {
  return embeddedWastePerDay(menu, suppliers) * DAYS_PER_MONTH;
}

/**
 * Share of forecast material cost that is embedded supplier waste.
 *
 * Useful for presentation-only explanations; `safeDivide` avoids division by
 * zero when there is no menu or no forecast volume.
 */
export function embeddedWasteShare(
  menu: readonly MenuItem[],
  suppliers: readonly SupplierItem[],
): number {
  let totalCogs = 0;
  let totalWaste = 0;

  for (const item of menu) {
    const breakdown = menuItemCogsBreakdown(item, suppliers);
    const units = clampNonNegative(item.expectedDailyUnits ?? 0);
    totalCogs += breakdown.totalCogs * units;
    totalWaste += breakdown.wasteCost * units;
  }

  return safeDivide(totalWaste, totalCogs, 0);
}
