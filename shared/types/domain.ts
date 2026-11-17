/**
 * CaféCost — domain model for the categorised supplier / recipe / asset
 * workspace.
 *
 * The model stays intentionally compact, but Phase 4 adds enough structure for
 * real recipe costing without turning the app into an accounting package. All
 * arithmetic lives in `shared/engine`; components only format engine output.
 */

/* -------------------------------------------------------------------------- */
/* Project settings                                                           */
/* -------------------------------------------------------------------------- */

export interface ProjectSettings {
  projectName: string;
  currencyCode: string; // ISO 4217 code (e.g. 'SAR', 'USD')
  currencySymbol: string; // Display symbol (e.g. 'SAR', 'ر.س', '$')
  exchangeRateToUSD: number; // Manual reference rate
  operatingHoursPerDay: number;
  operatingDaysPerWeek: number;
  socialInsuranceRate: number; // Employer contribution (%)
  endOfServiceRate: number; // End-of-service provision (%)
  /**
   * Policy target for raw-material cost as a share of revenue (0–100).
   *
   * The break-even target is deliberately fixed by this ratio instead of the
   * menu mix, so changing forecast volumes never moves the target.
   */
  TargetMaterialCostRatio: number;
  /** True when menu selling prices already include VAT. */
  PricesIncludeVAT: boolean;
  /** VAT percentage, e.g. 15 for 15%. */
  VATRate: number;
  lastUpdatedPresets: string; // ISO date (YYYY-MM-DD)
}

/* -------------------------------------------------------------------------- */
/* Suppliers                                                                  */
/* -------------------------------------------------------------------------- */

export type BuiltInSupplierCategory =
  | 'coffee'
  | 'dairy'
  | 'packaging'
  | 'bakery'
  | 'syrups'
  | 'raw_materials'
  | 'other';

/**
 * Built-in category or a user-created category name.
 *
 * The `string & {}` branch keeps editor autocomplete for the built-in values
 * while still accepting any persisted custom label.
 */
export type SupplierCategory = BuiltInSupplierCategory | (string & {});

/**
 * Units used by both supplier packages and recipe lines.
 *
 * Mass:   g  → kg
 * Volume: ml → l
 * Count:  pc
 */
export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'pc';

/**
 * A supplier package row.
 *
 * Multiple rows may share the `coffee` category (for example House Blend,
 * Colombia, and Yemeni). Menu items link to one of those rows by id so each
 * drink or retail bag can use its own bean price.
 *
 * `packageLabel` remains the human-readable label used by older exports and
 * printouts. Costing uses the structured `packageQuantity` + `packageUnit`
 * pair so a recipe can ask for grams while the supplier sells kilograms.
 */
export interface SupplierItem {
  id: string;
  name: string;
  category: SupplierCategory;
  packageLabel: string; // e.g. "1 kg", "1 L", "12 oz"
  packageQuantity: number; // e.g. 1, 500, 12
  packageUnit: IngredientUnit; // unit of the package quantity
  price: number; // price per package
  /**
   * Expected spoilage/loss percentage for this item (0–100).
   *
   * This is applied to the effective unit cost of every recipe line, so it is
   * part of menu COGS and scales with the forecast volume. It is deliberately
   * not charged again as a fixed cost, so the same loss is never counted twice.
   */
  wastePercentage: number;
}

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

export type BuiltInMenuItemCategory =
  | 'hot_drinks'
  | 'cold_drinks'
  | 'bakery'
  | 'desserts'
  | 'retail_beans';

/** Built-in category or a user-created category name. */
export type MenuItemCategory =
  | BuiltInMenuItemCategory
  | (string & {});

export type CostingMode = 'simple' | 'advanced';

/**
 * One ingredient line in an advanced recipe.
 *
 * The supplier is referenced by id so changing the supplier price immediately
 * changes every product that uses it.
 */
export interface RecipeIngredient {
  supplierId: string;
  quantityUsed: number;
  unit: IngredientUnit;
}

/**
 * One sellable menu row.
 *
 * Simple mode uses `estimatedCogsPercent`. Advanced mode ignores that percentage
 * and calculates COGS from `ingredients` and the linked supplier prices.
 */
export interface MenuItem {
  id: string;
  name: string;
  category: MenuItemCategory;
  sellingPrice: number;
  /**
   * Bottom-up break-even driver: how many units of this item the owner expects
   * to sell per day. Zero means the item is excluded from the expected mix.
   */
  expectedDailyUnits: number;
  costingMode: CostingMode;
  estimatedCogsPercent: number; // e.g. 30 = 30% of the selling price
  ingredients: RecipeIngredient[];
  /**
   * The specific coffee supplier row used by this item.
   *
   * Retail bags use it directly for per-gram costing. Simple drinks use it to
   * adjust the percentage estimate for the selected bean price. Advanced
   * drinks can use it to link every coffee ingredient line to one bean.
   */
  selectedBeanId?: string;
  /** Retail beans only: weight of one retail bag in grams. */
  bagWeightGrams?: number;
  /** Retail beans only: packaging cost per bag. */
  packagingCost?: number;
}

/* -------------------------------------------------------------------------- */
/* Fixed assets                                                               */
/* -------------------------------------------------------------------------- */

export type AssetCategory =
  | 'equipment'
  | 'furniture'
  | 'kitchen'
  | 'technology'
  | 'other';

/** Only straight-line is exposed today; the union leaves room for more. */
export type DepreciationMethod = 'straight_line';

export interface FixedAsset {
  id: string;
  name: string;
  category: AssetCategory;
  purchasePrice: number;
  shippingInstallation: number;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: DepreciationMethod;
}
