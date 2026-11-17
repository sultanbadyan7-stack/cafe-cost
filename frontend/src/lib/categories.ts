import type { TranslationKey } from '@i18n/index';
import type {
  AssetCategory,
  BuiltInMenuItemCategory,
  BuiltInSupplierCategory,
  DepreciationMethod,
  IngredientUnit,
} from '@shared/types';

/**
 * Shared option order and translation keys for every categorised select.
 * Keeping these in one place stops the UI and exports from drifting apart.
 */

export const SUPPLIER_CATEGORIES: readonly BuiltInSupplierCategory[] = [
  'coffee',
  'dairy',
  'packaging',
  'bakery',
  'syrups',
  'raw_materials',
  'other',
];

export const SUPPLIER_CATEGORY_KEYS: Record<
  BuiltInSupplierCategory,
  TranslationKey
> = {
  coffee: 'suppliers.category.coffee',
  dairy: 'suppliers.category.dairy',
  packaging: 'suppliers.category.packaging',
  bakery: 'suppliers.category.bakery',
  syrups: 'suppliers.category.syrups',
  raw_materials: 'suppliers.category.rawMaterials',
  other: 'suppliers.category.other',
};

export const MENU_CATEGORIES: readonly BuiltInMenuItemCategory[] = [
  'hot_drinks',
  'cold_drinks',
  'bakery',
  'desserts',
  'retail_beans',
];

export const MENU_CATEGORY_KEYS: Record<
  BuiltInMenuItemCategory,
  TranslationKey
> = {
  hot_drinks: 'menu.category.hot_drinks',
  cold_drinks: 'menu.category.cold_drinks',
  bakery: 'menu.category.bakery',
  desserts: 'menu.category.desserts',
  retail_beans: 'menu.category.retail_beans',
};

export const INGREDIENT_UNITS: readonly IngredientUnit[] = [
  'kg',
  'g',
  'l',
  'ml',
  'pc',
];

export const UNIT_KEYS: Record<IngredientUnit, TranslationKey> = {
  g: 'units.g',
  kg: 'units.kg',
  ml: 'units.ml',
  l: 'units.l',
  pc: 'units.pc',
};

export const ASSET_CATEGORIES: readonly AssetCategory[] = [
  'equipment',
  'furniture',
  'kitchen',
  'technology',
  'other',
];

export const ASSET_CATEGORY_KEYS: Record<AssetCategory, TranslationKey> = {
  equipment: 'expenses.assetCategory.equipment',
  furniture: 'expenses.assetCategory.furniture',
  kitchen: 'expenses.assetCategory.kitchen',
  technology: 'expenses.assetCategory.technology',
  other: 'expenses.assetCategory.other',
};

export const DEPRECIATION_METHODS: readonly DepreciationMethod[] = [
  'straight_line',
];

export const DEPRECIATION_METHOD_KEYS: Record<
  DepreciationMethod,
  TranslationKey
> = {
  straight_line: 'expenses.method.straightLine',
};

/* -------------------------------------------------------------------------- */
/* Custom category helpers                                                    */
/* -------------------------------------------------------------------------- */

type Translator = (key: TranslationKey) => string;

/** Resolves a built-in category to its translation; custom names pass through. */
export function menuCategoryLabel(
  category: string,
  t: Translator,
): string {
  const key = MENU_CATEGORY_KEYS[
    category as BuiltInMenuItemCategory
  ] as TranslationKey | undefined;
  return key ? t(key) : category;
}

export function supplierCategoryLabel(
  category: string,
  t: Translator,
): string {
  const key = SUPPLIER_CATEGORY_KEYS[
    category as BuiltInSupplierCategory
  ] as TranslationKey | undefined;
  return key ? t(key) : category;
}

/** Costing-mode label; retail bags are neither simple nor advanced recipes. */
export function menuCostingModeLabel(
  mode: 'simple' | 'advanced',
  category: string,
  t: Translator,
): string {
  if (category === 'retail_beans') return t('menu.mode.retailShort');
  return mode === 'advanced'
    ? t('menu.mode.advancedShort')
    : t('menu.mode.simpleShort');
}

export function isBuiltInMenuCategory(
  value: unknown,
): value is BuiltInMenuItemCategory {
  return MENU_CATEGORIES.includes(value as BuiltInMenuItemCategory);
}

export function isBuiltInSupplierCategory(
  value: unknown,
): value is BuiltInSupplierCategory {
  return SUPPLIER_CATEGORIES.includes(value as BuiltInSupplierCategory);
}

/**
 * Builds a stable, de-duplicated category list from built-ins, saved custom
 * categories, and any category currently used by a row (legacy hydration).
 */
export function mergeCategoryNames(
  builtIns: readonly string[],
  custom: readonly string[],
  used: readonly string[] = [],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  [...builtIns, ...custom, ...used].forEach((raw) => {
    if (typeof raw !== 'string') return;
    const name = raw.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(name);
  });

  return result;
}
