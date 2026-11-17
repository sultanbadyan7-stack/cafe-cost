/**
 * Commercial loan terms used to derive the monthly installment.
 */
export interface FinancingStructure {
  commercialLoanPrincipal: number;
  annualInterestRate: number; // Annual nominal rate (%)
  termMonths: number;
}

/**
 * Demand, liquidity, and ramp-up assumptions for the 12-month model.
 * Ramp-up values are stored as percentages (0–100).
 */
export interface CashFlowAssumptions {
  /** Expected number of paying customers/tickets per day. */
  dailyTargetCustomers: number;
  openingLiquidCash: number;
  rampUpPercent: number[]; // Twelve months, month 1 → month 12
}
