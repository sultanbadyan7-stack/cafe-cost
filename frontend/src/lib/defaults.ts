import { DEFAULT_PROJECT_SETTINGS } from '@shared/constants';
import type {
  AssetCategory,
  CashFlowAssumptions,
  DepreciationMethod,
  EmployeeRole,
  FinancingStructure,
  FixedAsset,
  IngredientUnit,
  MenuItem,
  MenuItemCategory,
  OperatingExpenseCategory,
  OperatingExpenseItem,
  RecipeIngredient,
  SupplierCategory,
  SupplierItem,
} from '@shared/types';
import { newId } from './cn';
import {
  ASSET_CATEGORIES,
  DEPRECIATION_METHODS,
  INGREDIENT_UNITS,
  MENU_CATEGORIES,
  SUPPLIER_CATEGORIES,
} from './categories';
import type { AppState } from '../types/app';

/** v2 is intentionally separate from the old 5-step workspace. */
export const STORAGE_KEY = 'cafecost.workspace.v2';

export { MENU_CATEGORIES, SUPPLIER_CATEGORIES } from './categories';

export const EXPENSE_CATEGORIES: readonly OperatingExpenseCategory[] = [
  'rent',
  'utilities',
  'marketing',
  'waste',
  'other',
];

/** Twelve-month ramp-up starting point. Month 1 opens at 40%. */
export const DEFAULT_RAMP_UP: readonly number[] = [
  40, 60, 80, 100, 100, 100, 100, 100, 100, 100, 100, 100,
];

export const DEFAULT_FINANCING: FinancingStructure = {
  commercialLoanPrincipal: 0,
  annualInterestRate: 0,
  termMonths: 0,
};

export const DEFAULT_CASH_FLOW: CashFlowAssumptions = {
  dailyTargetCustomers: 120,
  openingLiquidCash: 0,
  rampUpPercent: [...DEFAULT_RAMP_UP],
};

/* -------------------------------------------------------------------------- */
/* Package label helpers                                                      */
/* -------------------------------------------------------------------------- */

const UNIT_ALIASES: Record<string, IngredientUnit> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kgs: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  lt: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  pc: 'pc',
  pcs: 'pc',
  piece: 'pc',
  pieces: 'pc',
};

export function isIngredientUnit(value: unknown): value is IngredientUnit {
  return INGREDIENT_UNITS.includes(value as IngredientUnit);
}

export function isSupplierCategory(value: unknown): value is SupplierCategory {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isMenuItemCategory(value: unknown): value is MenuItemCategory {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Normalizes persisted custom category names. */
export function normalizeCustomCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: string[] = [];
  value.forEach((entry) => {
    if (typeof entry !== 'string') return;
    const name = entry.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(name);
  });
  return result;
}

export function isAssetCategory(value: unknown): value is AssetCategory {
  return ASSET_CATEGORIES.includes(value as AssetCategory);
}

export function isDepreciationMethod(
  value: unknown,
): value is DepreciationMethod {
  return DEPRECIATION_METHODS.includes(value as DepreciationMethod);
}

/** Parses legacy labels such as "1 kg", "500 g", or "12 oz". */
export function parsePackageLabel(label: string): {
  quantity: number;
  unit: IngredientUnit;
} {
  const match = label.trim().match(/^([\d.,]+)\s*([a-zA-Z]+)?/);
  if (!match) return { quantity: 1, unit: 'pc' };

  const parsedQuantity = Number((match[1] ?? '').replace(/,/g, ''));
  const unitToken = (match[2] ?? '').toLowerCase();

  return {
    quantity:
      Number.isFinite(parsedQuantity) && parsedQuantity > 0
        ? parsedQuantity
        : 1,
    unit: UNIT_ALIASES[unitToken] ?? 'pc',
  };
}

export function formatPackageLabel(
  quantity: number,
  unit: IngredientUnit,
): string {
  const rounded = Number.isFinite(quantity)
    ? Math.round(quantity * 1000) / 1000
    : 0;
  return `${rounded} ${unit}`;
}

/* -------------------------------------------------------------------------- */
/* Factories                                                                  */
/* -------------------------------------------------------------------------- */

export function createSupplierItem(
  overrides: Partial<SupplierItem> = {},
): SupplierItem {
  const parsed = overrides.packageLabel
    ? parsePackageLabel(overrides.packageLabel)
    : { quantity: 1, unit: 'pc' as IngredientUnit };

  const packageQuantity =
    overrides.packageQuantity !== undefined &&
    Number.isFinite(overrides.packageQuantity)
      ? Math.max(0, overrides.packageQuantity)
      : parsed.quantity;

  const packageUnit = isIngredientUnit(overrides.packageUnit)
    ? overrides.packageUnit
    : parsed.unit;

  const category =
    typeof overrides.category === 'string' && overrides.category.trim()
      ? overrides.category.trim()
      : 'other';

  return {
    id: overrides.id ?? newId(),
    name: overrides.name ?? '',
    category,
    packageLabel:
      overrides.packageLabel?.trim() ||
      formatPackageLabel(packageQuantity, packageUnit),
    packageQuantity,
    packageUnit,
    price: overrides.price ?? 0,
    wastePercentage:
      overrides.wastePercentage !== undefined &&
      Number.isFinite(overrides.wastePercentage)
        ? Math.max(0, Math.min(100, overrides.wastePercentage))
        : 0,
  };
}

function normalizeIngredient(
  ingredient: Partial<RecipeIngredient>,
): RecipeIngredient {
  return {
    supplierId:
      typeof ingredient.supplierId === 'string' ? ingredient.supplierId : '',
    quantityUsed:
      ingredient.quantityUsed !== undefined &&
      Number.isFinite(ingredient.quantityUsed)
        ? Math.max(0, ingredient.quantityUsed)
        : 0,
    unit: isIngredientUnit(ingredient.unit) ? ingredient.unit : 'g',
  };
}

const LEGACY_MENU_CATEGORIES: Record<string, MenuItemCategory> = {
  beverage: 'hot_drinks',
  bakery: 'bakery',
  dessert: 'desserts',
};

function normalizeMenuCategory(value: unknown): MenuItemCategory {
  if (typeof value === 'string') {
    const category = value.trim();
    if (!category) return 'hot_drinks';
    if (LEGACY_MENU_CATEGORIES[category]) {
      return LEGACY_MENU_CATEGORIES[category]!;
    }
    return category;
  }
  return 'hot_drinks';
}

function nonNegative(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

export function createMenuItem(
  overrides: Partial<MenuItem> = {},
): MenuItem {
  return {
    id: overrides.id ?? newId(),
    name: overrides.name ?? '',
    category: normalizeMenuCategory(overrides.category),
    sellingPrice: overrides.sellingPrice ?? 0,
    expectedDailyUnits: nonNegative(overrides.expectedDailyUnits),
    costingMode: overrides.costingMode === 'advanced' ? 'advanced' : 'simple',
    estimatedCogsPercent: overrides.estimatedCogsPercent ?? 0,
    ingredients: Array.isArray(overrides.ingredients)
      ? overrides.ingredients.map((ingredient) =>
          normalizeIngredient(ingredient),
        )
      : [],
    selectedBeanId:
      typeof overrides.selectedBeanId === 'string' &&
      overrides.selectedBeanId.trim().length > 0
        ? overrides.selectedBeanId.trim()
        : undefined,
    bagWeightGrams: nonNegative(overrides.bagWeightGrams),
    packagingCost: nonNegative(overrides.packagingCost),
  };
}

export function createOperatingExpense(
  overrides: Partial<OperatingExpenseItem> = {},
): OperatingExpenseItem {
  const category = EXPENSE_CATEGORIES.includes(
    overrides.category as OperatingExpenseCategory,
  )
    ? (overrides.category as OperatingExpenseCategory)
    : 'other';
  return {
    id: overrides.id ?? newId(),
    name: overrides.name ?? '',
    category,
    amount: overrides.amount ?? 0,
  };
}

export type StaffingRoleOverrides = Partial<EmployeeRole> & {
  /** Legacy v2 field migrated to `baseSalary`. */
  salaryPerEmployee?: number;
};

export function createStaffingRole(
  overrides: StaffingRoleOverrides = {},
): EmployeeRole {
  const legacySalary = overrides.salaryPerEmployee;
  const baseSalary =
    overrides.baseSalary ??
    (legacySalary !== undefined && Number.isFinite(legacySalary)
      ? Math.max(0, legacySalary)
      : 0);

  return {
    id: overrides.id ?? newId(),
    roleName: overrides.roleName ?? '',
    count:
      overrides.count !== undefined && Number.isFinite(overrides.count)
        ? Math.max(0, Math.round(overrides.count))
        : 1,
    baseSalary,
    housingAllowance: overrides.housingAllowance ?? 0,
    transportAllowance: overrides.transportAllowance ?? 0,
    medicalInsurance: overrides.medicalInsurance ?? 0,
    annualVisaCost: overrides.annualVisaCost ?? 0,
    annualFlightCost: overrides.annualFlightCost ?? 0,
  };
}

export function createFixedAsset(
  overrides: Partial<FixedAsset> = {},
): FixedAsset {
  return {
    id: overrides.id ?? newId(),
    name: overrides.name ?? '',
    category: isAssetCategory(overrides.category)
      ? overrides.category
      : 'equipment',
    purchasePrice: overrides.purchasePrice ?? 0,
    shippingInstallation: overrides.shippingInstallation ?? 0,
    usefulLifeYears: overrides.usefulLifeYears ?? 0,
    salvageValue: overrides.salvageValue ?? 0,
    depreciationMethod: isDepreciationMethod(overrides.depreciationMethod)
      ? overrides.depreciationMethod
      : 'straight_line',
  };
}

/** Fresh, anonymous workspace. No registration, no server state. */
export function createInitialState(): AppState {
  return {
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    suppliers: [],
    menu: [],
    customMenuCategories: [],
    customSupplierCategories: [],
    expenses: [],
    staffing: [],
    assets: [],
    financing: { ...DEFAULT_FINANCING },
    cashFlow: { ...DEFAULT_CASH_FLOW, rampUpPercent: [...DEFAULT_RAMP_UP] },
    tab: 'general',
    language: 'en',
  };
}
