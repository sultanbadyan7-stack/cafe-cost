/**
 * Recurring monthly expenses, detailed staffing roles, and the payroll TCO
 * contract.
 *
 * Every expense amount is already a monthly amount. Annual employee costs are
 * divided by twelve inside the payroll engine, never in the UI.
 */

export type OperatingExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'marketing'
  | 'waste'
  | 'other';

export interface OperatingExpenseItem {
  id: string;
  name: string;
  category: OperatingExpenseCategory;
  amount: number; // Monthly amount
}

/**
 * A staffing role with a full monthly cost of ownership.
 *
 * Monthly cost per employee =
 *   baseSalary + housingAllowance + transportAllowance + medicalInsurance
 *   + annualVisaCost / 12 + annualFlightCost / 12.
 */
export interface EmployeeRole {
  id: string;
  roleName: string;
  count: number;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalInsurance: number;
  annualVisaCost: number;
  annualFlightCost: number;
}

/** Backwards-compatible alias for code that still refers to staffing roles. */
export type StaffingRole = EmployeeRole;
