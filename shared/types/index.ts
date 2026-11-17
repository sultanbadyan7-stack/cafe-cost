/**
 * Public type surface for CaféCost.
 */
export type {
  ProjectSettings,
  SupplierItem,
  SupplierCategory,
  BuiltInSupplierCategory,
  IngredientUnit,
  MenuItem,
  MenuItemCategory,
  BuiltInMenuItemCategory,
  CostingMode,
  RecipeIngredient,
  FixedAsset,
  AssetCategory,
  DepreciationMethod,
} from './domain';

export type {
  OperatingExpenseCategory,
  OperatingExpenseItem,
  EmployeeRole,
  StaffingRole,
} from './expenses';

export type {
  FinancingStructure,
  CashFlowAssumptions,
} from './financing';

export type {
  HealthBand,
  MenuMetrics,
  BreakEvenResult,
  AssetMetrics,
  AmortizationRow,
  CashFlowMonthRow,
  CashFlowProjectionSummary,
  CashFlowProjection,
} from './results';
