import type {
  AssetCategory,
  DepreciationMethod,
  IngredientUnit,
  MenuItemCategory,
  OperatingExpenseCategory,
  RecipeIngredient,
  SupplierCategory,
  SupplierItem,
} from '@shared/types';

/**
 * Editable starter templates.
 *
 * Presets only copy values into normal state; every field remains fully
 * editable. Loading a preset never duplicates an existing row with the same
 * name.
 */

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

export interface MenuPreset {
  name: string;
  category: MenuItemCategory;
  sellingPrice: number;
  costingMode: 'simple' | 'advanced';
  estimatedCogsPercent: number;
  ingredients: RecipeIngredient[];
}

export const MENU_PRESETS: readonly MenuPreset[] = [
  {
    name: 'Espresso',
    category: 'hot_drinks',
    sellingPrice: 7,
    costingMode: 'simple',
    estimatedCogsPercent: 15,
    ingredients: [],
  },
  {
    name: 'Flat White',
    category: 'hot_drinks',
    sellingPrice: 16,
    costingMode: 'advanced',
    estimatedCogsPercent: 30,
    ingredients: [
      { supplierId: 'coffee-beans', quantityUsed: 0.018, unit: 'kg' },
      { supplierId: 'fresh-milk', quantityUsed: 0.15, unit: 'l' },
      { supplierId: 'paper-cup-12oz', quantityUsed: 1, unit: 'pc' },
      { supplierId: 'cup-lid', quantityUsed: 1, unit: 'pc' },
    ],
  },
  {
    name: 'Iced Latte',
    category: 'cold_drinks',
    sellingPrice: 18,
    costingMode: 'advanced',
    estimatedCogsPercent: 32,
    ingredients: [
      { supplierId: 'coffee-beans', quantityUsed: 0.018, unit: 'kg' },
      { supplierId: 'fresh-milk', quantityUsed: 0.12, unit: 'l' },
      { supplierId: 'paper-cup-12oz', quantityUsed: 1, unit: 'pc' },
      { supplierId: 'cup-lid', quantityUsed: 1, unit: 'pc' },
      { supplierId: 'vanilla-syrup', quantityUsed: 0.02, unit: 'l' },
    ],
  },
  {
    name: 'V60 Pour Over',
    category: 'hot_drinks',
    sellingPrice: 22,
    costingMode: 'simple',
    estimatedCogsPercent: 25,
    ingredients: [],
  },
  {
    name: 'Hot Chocolate',
    category: 'hot_drinks',
    sellingPrice: 15,
    costingMode: 'simple',
    estimatedCogsPercent: 25,
    ingredients: [],
  },
  {
    name: 'Croissant',
    category: 'bakery',
    sellingPrice: 12,
    costingMode: 'simple',
    estimatedCogsPercent: 40,
    ingredients: [],
  },
  {
    name: 'Chocolate Cake',
    category: 'desserts',
    sellingPrice: 18,
    costingMode: 'simple',
    estimatedCogsPercent: 35,
    ingredients: [],
  },
];

/* -------------------------------------------------------------------------- */
/* Suppliers                                                                  */
/* -------------------------------------------------------------------------- */

export interface SupplierPreset {
  id: string;
  name: string;
  category: SupplierCategory;
  packageLabel: string;
  packageQuantity: number;
  packageUnit: IngredientUnit;
  price: number;
  wastePercentage: number;
}

export const SUPPLIER_PRESETS: readonly SupplierPreset[] = [
  {
    id: 'coffee-beans',
    name: 'Coffee Beans',
    category: 'coffee',
    packageLabel: '1 kg',
    packageQuantity: 1,
    packageUnit: 'kg',
    price: 120,
    wastePercentage: 2,
  },
  {
    id: 'fresh-milk',
    name: 'Fresh Milk',
    category: 'dairy',
    packageLabel: '1 L',
    packageQuantity: 1,
    packageUnit: 'l',
    price: 7,
    wastePercentage: 5,
  },
  {
    id: 'paper-cup-12oz',
    name: 'Paper Cup 12oz',
    category: 'packaging',
    packageLabel: '1 pc',
    packageQuantity: 1,
    packageUnit: 'pc',
    price: 0.6,
    wastePercentage: 1,
  },
  {
    id: 'cup-lid',
    name: 'Cup Lid',
    category: 'packaging',
    packageLabel: '1 pc',
    packageQuantity: 1,
    packageUnit: 'pc',
    price: 0.2,
    wastePercentage: 1,
  },
  {
    id: 'sugar',
    name: 'Sugar',
    category: 'other',
    packageLabel: '1 kg',
    packageQuantity: 1,
    packageUnit: 'kg',
    price: 5,
    wastePercentage: 1,
  },
  {
    id: 'chocolate-powder',
    name: 'Chocolate Powder',
    category: 'other',
    packageLabel: '1 kg',
    packageQuantity: 1,
    packageUnit: 'kg',
    price: 45,
    wastePercentage: 2,
  },
  {
    id: 'vanilla-syrup',
    name: 'Vanilla Syrup',
    category: 'syrups',
    packageLabel: '1 L',
    packageQuantity: 1,
    packageUnit: 'l',
    price: 35,
    wastePercentage: 1,
  },
  {
    id: 'butter-croissant',
    name: 'Butter Croissant',
    category: 'bakery',
    packageLabel: '1 pc',
    packageQuantity: 1,
    packageUnit: 'pc',
    price: 3,
    wastePercentage: 8,
  },
  {
    id: 'oat-milk',
    name: 'Oat Milk',
    category: 'raw_materials',
    packageLabel: '1 L',
    packageQuantity: 1,
    packageUnit: 'l',
    price: 12,
    wastePercentage: 4,
  },
  {
    id: 'cocoa-powder',
    name: 'Cocoa Powder',
    category: 'raw_materials',
    packageLabel: '1 kg',
    packageQuantity: 1,
    packageUnit: 'kg',
    price: 55,
    wastePercentage: 2,
  },
];

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function supplierPresetById(
  id: string,
): SupplierPreset | undefined {
  return SUPPLIER_PRESETS.find((preset) => preset.id === id);
}

/**
 * Re-links a preset recipe to the supplier rows that actually exist.
 *
 * Presets use stable ids, but an older workspace may already contain a supplier
 * with the same name and a generated id. In that case the name match wins.
 */
export function resolvePresetIngredients(
  preset: MenuPreset,
  suppliers: readonly SupplierItem[],
): RecipeIngredient[] {
  return preset.ingredients.map((ingredient) => {
    const direct = suppliers.find(
      (supplier) => supplier.id === ingredient.supplierId,
    );
    if (direct) return { ...ingredient };

    const presetSupplier = supplierPresetById(ingredient.supplierId);
    if (!presetSupplier) return { ...ingredient };

    const byName = suppliers.find(
      (supplier) =>
        normalizeName(supplier.name) === normalizeName(presetSupplier.name),
    );

    return byName
      ? { ...ingredient, supplierId: byName.id }
      : { ...ingredient };
  });
}

/**
 * Supplier presets required by a menu preset that are not in the workspace yet.
 * Used by the menu-preset loader so advanced recipes never arrive broken.
 */
export function requiredSupplierPresets(
  preset: MenuPreset,
  suppliers: readonly SupplierItem[],
): SupplierPreset[] {
  const required: SupplierPreset[] = [];

  preset.ingredients.forEach((ingredient) => {
    const direct = suppliers.some(
      (supplier) => supplier.id === ingredient.supplierId,
    );
    if (direct) return;

    const presetSupplier = supplierPresetById(ingredient.supplierId);
    if (!presetSupplier) return;

    const byName = suppliers.some(
      (supplier) =>
        normalizeName(supplier.name) === normalizeName(presetSupplier.name),
    );
    if (byName) return;

    if (!required.some((item) => item.id === presetSupplier.id)) {
      required.push(presetSupplier);
    }
  });

  return required;
}

/* -------------------------------------------------------------------------- */
/* Expenses                                                                   */
/* -------------------------------------------------------------------------- */

export interface ExpensePreset {
  name: string;
  category: OperatingExpenseCategory;
  amount: number;
}

export const EXPENSE_PRESETS: readonly ExpensePreset[] = [
  { name: 'Rent', category: 'rent', amount: 12000 },
  { name: 'Electricity & Water', category: 'utilities', amount: 3500 },
  { name: 'Internet', category: 'utilities', amount: 500 },
  { name: 'Marketing', category: 'marketing', amount: 1000 },
  { name: 'Spoilage & Waste', category: 'waste', amount: 800 },
  { name: 'Cleaning', category: 'other', amount: 300 },
  { name: 'Maintenance', category: 'other', amount: 500 },
];

/* -------------------------------------------------------------------------- */
/* Staffing                                                                   */
/* -------------------------------------------------------------------------- */

export interface StaffingPreset {
  roleName: string;
  count: number;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalInsurance: number;
  annualVisaCost: number;
  annualFlightCost: number;
}

/** Used by Quick Calculate so the example has a realistic payroll burden. */
export const STAFFING_PRESETS: readonly StaffingPreset[] = [
  {
    roleName: 'Barista',
    count: 2,
    baseSalary: 4000,
    housingAllowance: 800,
    transportAllowance: 300,
    medicalInsurance: 500,
    annualVisaCost: 2000,
    annualFlightCost: 3000,
  },
  {
    roleName: 'Cashier',
    count: 1,
    baseSalary: 3000,
    housingAllowance: 600,
    transportAllowance: 300,
    medicalInsurance: 400,
    annualVisaCost: 2000,
    annualFlightCost: 3000,
  },
  {
    roleName: 'Café Manager',
    count: 1,
    baseSalary: 7000,
    housingAllowance: 1500,
    transportAllowance: 500,
    medicalInsurance: 800,
    annualVisaCost: 3000,
    annualFlightCost: 5000,
  },
];

/* -------------------------------------------------------------------------- */
/* Fixed assets                                                               */
/* -------------------------------------------------------------------------- */

export interface AssetPreset {
  name: string;
  category: AssetCategory;
  purchasePrice: number;
  shippingInstallation: number;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: DepreciationMethod;
}

export const ASSET_PRESETS: readonly AssetPreset[] = [
  {
    name: 'Espresso Machine',
    category: 'equipment',
    purchasePrice: 45000,
    shippingInstallation: 2500,
    usefulLifeYears: 10,
    salvageValue: 5000,
    depreciationMethod: 'straight_line',
  },
  {
    name: 'Coffee Grinder',
    category: 'equipment',
    purchasePrice: 18000,
    shippingInstallation: 500,
    usefulLifeYears: 8,
    salvageValue: 2000,
    depreciationMethod: 'straight_line',
  },
  {
    name: 'Dining Furniture',
    category: 'furniture',
    purchasePrice: 30000,
    shippingInstallation: 3000,
    usefulLifeYears: 7,
    salvageValue: 3000,
    depreciationMethod: 'straight_line',
  },
  {
    name: 'POS & Tablets',
    category: 'technology',
    purchasePrice: 8000,
    shippingInstallation: 0,
    usefulLifeYears: 5,
    salvageValue: 500,
    depreciationMethod: 'straight_line',
  },
];
