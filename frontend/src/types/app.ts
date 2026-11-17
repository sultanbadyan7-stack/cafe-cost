import type {
  AssetMetrics,
  BreakEvenResult,
  CashFlowAssumptions,
  CashFlowProjection,
  EmployeeRole,
  FinancingStructure,
  FixedAsset,
  HealthBand,
  MenuItem,
  MenuMetrics,
  OperatingExpenseItem,
  ProjectSettings,
  SupplierItem,
} from '@shared/types';
import type { Language } from '@i18n/index';

/** Top-level tabs — users can jump between them on mobile and desktop. */
export type AppTab =
  | 'general'
  | 'suppliers'
  | 'menu'
  | 'expenses'
  | 'staff'
  | 'assets'
  | 'summary';

export interface AppState {
  settings: ProjectSettings;
  suppliers: SupplierItem[];
  menu: MenuItem[];
  /** User-created menu category labels, in display order. */
  customMenuCategories: string[];
  /** User-created supplier category labels, in display order. */
  customSupplierCategories: string[];
  expenses: OperatingExpenseItem[];
  staffing: EmployeeRole[];
  assets: FixedAsset[];
  financing: FinancingStructure;
  cashFlow: CashFlowAssumptions;
  tab: AppTab;
  language: Language;
}

/**
 * Every value the view may display. The snapshot is produced exclusively by
 * the pure engine; components only format these fields.
 */
export interface FinancialSnapshot {
  /* Payroll */
  baseSalaries: number;
  basePayroll: number;
  socialInsuranceAmount: number;
  endOfServiceAmount: number;
  loadedPayroll: number;

  /* Fixed cost buckets */
  monthlyRent: number;
  monthlyUtilities: number;
  monthlyMarketing: number;
  monthlyOther: number;
  monthlyOperatingExpenses: number;
  /** Explicit waste expenses, the only fixed-cost waste bucket. */
  monthlyWasteExpenses: number;
  /** Supplier waste already embedded in menu COGS (not a fixed cost). */
  wasteEmbeddedInCogs: number;
  /** Fixed-cost waste = explicit waste expenses. */
  monthlyWaste: number;
  monthlyLoanInstallment: number;
  totalCashFixedCosts: number;

  /* Fixed assets */
  assets: AssetMetrics;

  /* Menu economics */
  menu: MenuMetrics;

  /* Break-even and menu forecast (all revenue is net of VAT) */
  breakEven: BreakEvenResult;
  monthlyBreakEvenRevenue: number | null;
  requiredDailyRevenue: number | null;
  projectedDailyRevenue: number;
  projectedMonthlyRevenue: number;
  projectedDailyGrossRevenue: number;
  projectedMonthlyGrossRevenue: number;
  projectedDailyVat: number;
  projectedMonthlyVat: number;
  breakEvenGap: number;
  coversBreakEven: boolean;
  hasForecastData: boolean;
  negativeContribution: boolean;
  materialsAndLaborPercent: number | null;
  materialsAndLaborBand: HealthBand;
  hasBreakEven: boolean;

  /* 12-month projection */
  projection: CashFlowProjection | null;
  hasCashFlowModel: boolean;
  cashRunwayMonths: number | null;
  cashRunwayBand: HealthBand;
}
