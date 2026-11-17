/**
 * Result contracts produced by the pure engine modules.
 *
 * Every computed field is returned at full precision. Presentation rounding
 * belongs to the UI layer, never to the engine.
 */

/** Advisory band used by the simple validation layer. */
export type HealthBand = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface MenuMetrics {
  itemCount: number;
  /** Average list/gross selling price shown in the menu. */
  averageSellingPrice: number;
  /** Average VAT-exclusive selling price used by break-even. */
  averageNetSellingPrice: number;
  /** Average VAT amount per item. */
  averageVatAmount: number;
  averageCogs: number;
  averageContributionMargin: number;
  contributionMarginRatio: number;
  cogsRatio: number;
}

export interface BreakEvenResult {
  fixedCashCosts: number;
  /** Policy target: raw-material cost as a percentage of revenue (0–100). */
  targetMaterialCostRatio: number;
  /** 1 − (targetMaterialCostRatio ÷ 100), used to gross up fixed costs. */
  marginRatio: number;
  /** False only when the target ratio leaves no contribution margin. */
  isCalculable: boolean;
  /** True only when `marginRatio` is positive (target ratio below 100%). */
  isBreakEvenReachable: boolean;
  /** Net (VAT-exclusive) monthly revenue required to cover fixed costs. */
  monthlyBreakEvenRevenue: number;
  /** Net (VAT-exclusive) daily revenue required to cover fixed costs. */
  requiredDailyRevenue: number;
  /** True when at least one menu item has a positive expected daily volume. */
  hasData: boolean;
  /** Σ(net selling price × expectedDailyUnits) across the menu. */
  projectedDailyRevenue: number;
  /** Projected net daily revenue × 30.41. */
  projectedMonthlyRevenue: number;
  /** Σ(list price × expectedDailyUnits); the cash the customer pays. */
  projectedDailyGrossRevenue: number;
  /** Projected gross daily revenue × 30.41. */
  projectedMonthlyGrossRevenue: number;
  /** Σ(VAT per unit × expectedDailyUnits); VAT collected on forecast sales. */
  projectedDailyVat: number;
  /** Projected daily VAT × 30.41. */
  projectedMonthlyVat: number;
  /** Σ(cogs × expectedDailyUnits); reporting only, not used for the target. */
  projectedDailyCogs: number;
  /** Positive shortfall when projected net revenue is below the fixed target. */
  revenueGap: number;
  /** True when projected net daily revenue covers the required daily target. */
  coversBreakEven: boolean;
  /**
   * True when forecast material cost is at or above forecast net revenue, so
   * every additional sale destroys cash. Such a menu must never show a
   * positive "covers" message.
   */
  negativeContribution: boolean;
}

export interface AssetMetrics {
  assetCount: number;
  totalAssetCost: number;
  totalSalvageValue: number;
  totalDepreciableBase: number;
  totalMonthlyDepreciation: number;
  totalAnnualDepreciation: number;
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  installment: number;
  interest: number;
  principal: number;
  closingBalance: number;
}

export interface CashFlowMonthRow {
  month: number;
  rampUpFactor: number;
  /** VAT-inclusive sales collected from customers. */
  grossRevenue: number;
  /** VAT collected on sales and payable to the tax authority. */
  vatPayable: number;
  /** VAT-exclusive revenue the café keeps. */
  projectedRevenue: number;
  directCosts: number;
  /** Base fixed costs plus the loan installment charged this month. */
  fixedCashCosts: number;
  /** Loan installment charged this month (0 after the loan term). */
  loanInstallment: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  cumulativeCashFlow: number;
}

export interface CashFlowProjectionSummary {
  /** Total VAT-exclusive revenue across the projection. */
  totalNetRevenue: number;
  /** Total VAT-inclusive revenue across the projection. */
  totalGrossRevenue: number;
  /** Total VAT collected on sales across the projection. */
  totalVatPayable: number;
  totalDirectCosts: number;
  totalFixedCashCosts: number;
  totalNetCashFlow: number;
  endingBankBalance: number;
  minimumClosingBalance: number;
  requiredWorkingCapitalBuffer: number;
  averageMonthlyNetCashFlow: number;
  monthlyCashBurn: number;
  /**
   * Number of complete months before the first negative closing balance.
   * 0 means the balance is already negative at the end of month 1; null means
   * it never turns negative inside the projection.
   */
  cashRunwayMonths: number | null;
}

export interface CashFlowProjection {
  months: CashFlowMonthRow[];
  summary: CashFlowProjectionSummary;
}
