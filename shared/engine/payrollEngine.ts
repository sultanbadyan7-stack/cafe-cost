import type { EmployeeRole } from '../types';
import { clampNonNegative } from './math';

/* -------------------------------------------------------------------------- */
/* Employee cost of ownership                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Monthly cost of one employee.
 *
 * baseSalary + housing + transport + medical
 * + annualVisa / 12 + annualFlight / 12.
 */
export function employeeMonthlyCost(role: EmployeeRole): number {
  return (
    clampNonNegative(role.baseSalary) +
    clampNonNegative(role.housingAllowance) +
    clampNonNegative(role.transportAllowance) +
    clampNonNegative(role.medicalInsurance) +
    clampNonNegative(role.annualVisaCost) / 12 +
    clampNonNegative(role.annualFlightCost) / 12
  );
}

/** Total monthly cost of a role = monthly cost per employee × headcount. */
export function roleMonthlyCost(role: EmployeeRole): number {
  return clampNonNegative(role.count) * employeeMonthlyCost(role);
}

/** Sum of every role's total monthly cost, before statutory rates. */
export function baseMonthlyPayroll(roles: readonly EmployeeRole[]): number {
  return roles.reduce((total, role) => total + roleMonthlyCost(role), 0);
}

/**
 * Statutory base = Σ(baseSalary × count).
 *
 * Social insurance and end-of-service are normally calculated on base salary
 * only, not on allowances or amortised annual benefits.
 */
export function baseMonthlySalaries(roles: readonly EmployeeRole[]): number {
  return roles.reduce(
    (total, role) =>
      total + clampNonNegative(role.baseSalary) * clampNonNegative(role.count),
    0,
  );
}

/**
 * Loaded payroll = total role cost + social insurance + end-of-service.
 *
 * The two statutory percentages are applied to `baseSalaries`, not to the full
 * role cost.
 */
export function loadedMonthlyPayroll(
  totalRoleMonthlyCost: number,
  baseSalaries: number,
  socialInsuranceRatePercent: number,
  endOfServiceRatePercent: number,
): number {
  const total = clampNonNegative(totalRoleMonthlyCost);
  const statutoryBase = clampNonNegative(baseSalaries);

  return (
    total +
    (statutoryBase * clampNonNegative(socialInsuranceRatePercent)) / 100 +
    (statutoryBase * clampNonNegative(endOfServiceRatePercent)) / 100
  );
}

export interface PayrollBreakdown {
  /** Sum of base salaries only — the statutory calculation base. */
  baseSalaries: number;
  /** Sum of every role's full monthly TCO, before statutory rates. */
  totalMonthlyRoleCost: number;
  /** Alias used by existing snapshot consumers. */
  basePayroll: number;
  socialInsurance: number;
  endOfService: number;
  loadedPayroll: number;
}

/** Full payroll bridge used by the Expenses tab and the snapshot. */
export function payrollBreakdown(
  roles: readonly EmployeeRole[],
  socialInsuranceRatePercent: number,
  endOfServiceRatePercent: number,
): PayrollBreakdown {
  const totalMonthlyRoleCost = baseMonthlyPayroll(roles);
  const baseSalaries = baseMonthlySalaries(roles);
  const socialInsurance =
    (baseSalaries * clampNonNegative(socialInsuranceRatePercent)) / 100;
  const endOfService =
    (baseSalaries * clampNonNegative(endOfServiceRatePercent)) / 100;

  return {
    baseSalaries,
    totalMonthlyRoleCost,
    basePayroll: totalMonthlyRoleCost,
    socialInsurance,
    endOfService,
    loadedPayroll:
      totalMonthlyRoleCost + socialInsurance + endOfService,
  };
}
