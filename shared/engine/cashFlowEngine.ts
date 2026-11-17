import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '../constants';
import type {
  AmortizationRow,
  CashFlowMonthRow,
  CashFlowProjection,
} from '../types';
import { clampNonNegative, safeDivide } from './math';

/* -------------------------------------------------------------------------- */
/* Loan amortization                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Constant monthly installment (annuity).
 *
 * rm = Annual Rate% / (12 × 100)
 * A  = Lp × [ rm(1 + rm)^n ] / [ (1 + rm)^n − 1 ]
 *
 * A zero-rate loan is a straight-line principal repayment.
 */
export function monthlyLoanInstallment(
  principal: number,
  annualInterestRatePercent: number,
  termMonths: number,
): number {
  const amount = clampNonNegative(principal);
  const months = Math.floor(clampNonNegative(termMonths));
  if (amount === 0 || months === 0) return 0;

  const monthlyRate = clampNonNegative(annualInterestRatePercent) / (12 * 100);
  if (monthlyRate === 0) return amount / months;

  const growth = (1 + monthlyRate) ** months;
  return (amount * (monthlyRate * growth)) / (growth - 1);
}

/** Month-by-month split of each installment into interest and principal. */
export function buildAmortizationSchedule(
  principal: number,
  annualInterestRatePercent: number,
  termMonths: number,
): AmortizationRow[] {
  const amount = clampNonNegative(principal);
  const months = Math.floor(clampNonNegative(termMonths));
  if (amount === 0 || months === 0) return [];

  const monthlyRate = clampNonNegative(annualInterestRatePercent) / (12 * 100);
  const installment = monthlyLoanInstallment(
    amount,
    annualInterestRatePercent,
    months,
  );
  const rows: AmortizationRow[] = [];

  let openingBalance = amount;
  for (let month = 1; month <= months; month += 1) {
    const interest = openingBalance * monthlyRate;
    const scheduledPrincipal = installment - interest;
    const principalPaid = Math.min(scheduledPrincipal, openingBalance);
    const closingBalance = Math.max(0, openingBalance - principalPaid);

    rows.push({
      month,
      openingBalance,
      installment: interest + principalPaid,
      interest,
      principal: principalPaid,
      closingBalance,
    });

    openingBalance = closingBalance;
    if (openingBalance === 0) break;
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* 12-month cash flow                                                         */
/* -------------------------------------------------------------------------- */

export interface CashFlowProjectionInput {
  /** Net (VAT-exclusive) menu revenue per operating day. */
  dailyNetRevenue: number;
  /** Gross (VAT-inclusive) menu revenue per operating day. */
  dailyGrossRevenue: number;
  /** Menu COGS per operating day. */
  dailyCogs: number;
  /** Monthly cash fixed costs, excluding the loan installment. */
  fixedCashCosts: number;
  /** Twelve ramp-up multipliers, month 1 → month 12 (e.g. 0.40 … 1.00). */
  rampUp: readonly number[];
  openingBankBalance: number;
  /** Loan principal drawn at the start, added to opening cash. */
  loanPrincipal?: number;
  /** Constant monthly loan installment. */
  loanInstallment?: number;
  /** Installments are charged only while month ≤ loanTermMonths. */
  loanTermMonths?: number;
}

/**
 * 12-month cash flow projection driven by the menu forecast.
 *
 * Grossm = DailyGross × 30.41 × RampUpm
 * Netm   = DailyNet   × 30.41 × RampUpm
 * VATm   = Grossm − Netm
 * COGSm  = DailyCogs  × 30.41 × RampUpm
 * Loanm  = LoanInstallment while month ≤ term, then 0
 * NCFm   = Netm − [ COGSm + FixedCash + Loanm ]
 * CBm    = CBm−1 + NCFm
 *
 * Month 1 opens with the opening bank balance plus any loan drawdown. VAT is
 * excluded from the cash the café keeps: it is collected and remitted.
 */
export function buildCashFlowProjection(
  input: CashFlowProjectionInput,
): CashFlowProjection {
  const dailyNetRevenue = clampNonNegative(input.dailyNetRevenue);
  const dailyGrossRevenue = clampNonNegative(input.dailyGrossRevenue);
  const dailyCogs = clampNonNegative(input.dailyCogs);
  const baseFixedCashCosts = clampNonNegative(input.fixedCashCosts);
  const loanPrincipal = clampNonNegative(input.loanPrincipal ?? 0);
  const loanInstallment = clampNonNegative(input.loanInstallment ?? 0);
  const loanTermMonths = Math.floor(clampNonNegative(input.loanTermMonths ?? 0));

  const months: CashFlowMonthRow[] = [];
  let previousClosing =
    clampNonNegative(input.openingBankBalance) + loanPrincipal;
  let cumulativeCashFlow = 0;

  for (let index = 0; index < MONTHS_PER_YEAR; index += 1) {
    const month = index + 1;
    const rampUpFactor = clampNonNegative(input.rampUp[index] ?? 1);

    const grossRevenue = dailyGrossRevenue * DAYS_PER_MONTH * rampUpFactor;
    const projectedRevenue = dailyNetRevenue * DAYS_PER_MONTH * rampUpFactor;
    const vatPayable = Math.max(0, grossRevenue - projectedRevenue);
    const directCosts = dailyCogs * DAYS_PER_MONTH * rampUpFactor;

    const loanThisMonth =
      month <= loanTermMonths ? loanInstallment : 0;
    const fixedCashCosts = baseFixedCashCosts + loanThisMonth;
    const netCashFlow = projectedRevenue - (directCosts + fixedCashCosts);

    const openingBalance = previousClosing;
    const closingBalance = openingBalance + netCashFlow;
    cumulativeCashFlow += netCashFlow;

    months.push({
      month,
      rampUpFactor,
      grossRevenue,
      vatPayable,
      projectedRevenue,
      directCosts,
      fixedCashCosts,
      loanInstallment: loanThisMonth,
      netCashFlow,
      openingBalance,
      closingBalance,
      cumulativeCashFlow,
    });

    previousClosing = closingBalance;
  }

  const totalNetRevenue = months.reduce(
    (sum, row) => sum + row.projectedRevenue,
    0,
  );
  const totalGrossRevenue = months.reduce(
    (sum, row) => sum + row.grossRevenue,
    0,
  );
  const totalVatPayable = months.reduce(
    (sum, row) => sum + row.vatPayable,
    0,
  );
  const totalDirectCosts = months.reduce((sum, row) => sum + row.directCosts, 0);
  const totalFixedCashCosts = months.reduce(
    (sum, row) => sum + row.fixedCashCosts,
    0,
  );
  const totalNetCashFlow = months.reduce((sum, row) => sum + row.netCashFlow, 0);
  const minimumClosingBalance = Math.min(
    ...months.map((row) => row.closingBalance),
  );
  const averageMonthlyNetCashFlow = totalNetCashFlow / MONTHS_PER_YEAR;
  const monthlyCashBurn = Math.max(0, -averageMonthlyNetCashFlow);
  const endingBankBalance =
    months.length > 0
      ? months[months.length - 1]!.closingBalance
      : clampNonNegative(input.openingBankBalance) + loanPrincipal;

  return {
    months,
    summary: {
      totalNetRevenue,
      totalGrossRevenue,
      totalVatPayable,
      totalDirectCosts,
      totalFixedCashCosts,
      totalNetCashFlow,
      endingBankBalance,
      minimumClosingBalance,
      requiredWorkingCapitalBuffer: Math.max(0, -minimumClosingBalance),
      averageMonthlyNetCashFlow,
      monthlyCashBurn,
      cashRunwayMonths: cashRunwayMonths(months),
    },
  };
}

/**
 * Cash runway measured from the actual closing balances.
 *
 * Returns the number of complete months before the first month that ends with
 * a negative balance. A negative month 1 returns 0; a projection that never
 * turns negative returns null (no finite runway limit inside the horizon).
 *
 * This deliberately avoids an average burn rate: a single deep month can
 * exhaust the bank even when the yearly average looks healthy.
 */
export function cashRunwayMonths(
  months: readonly CashFlowMonthRow[],
): number | null {
  const firstNegativeIndex = months.findIndex((row) => row.closingBalance < 0);
  if (firstNegativeIndex === -1) return null;
  return firstNegativeIndex;
}
