import type {
  IngredientUnit,
  MenuItem,
  MenuMetrics,
  RecipeIngredient,
  SupplierItem,
} from '../types';
import { clampNonNegative, safeDivide } from './math';
import {
  netSellingPrice as calculateNetSellingPrice,
  vatAmount as calculateVatAmount,
  type VatSettings,
} from './pricingEngine';

/* -------------------------------------------------------------------------- */
/* Unit conversion                                                            */
/* -------------------------------------------------------------------------- */

type UnitDimension = 'mass' | 'volume' | 'count';

interface UnitDefinition {
  dimension: UnitDimension;
  /** How many base units (g, ml, or pc) one of this unit represents. */
  baseFactor: number;
}

const UNITS: Record<IngredientUnit, UnitDefinition> = {
  g: { dimension: 'mass', baseFactor: 1 },
  kg: { dimension: 'mass', baseFactor: 1000 },
  ml: { dimension: 'volume', baseFactor: 1 },
  l: { dimension: 'volume', baseFactor: 1000 },
  pc: { dimension: 'count', baseFactor: 1 },
};

export function unitDimension(unit: IngredientUnit): UnitDimension {
  return UNITS[unit].dimension;
}

export function unitToBaseFactor(unit: IngredientUnit): number {
  return UNITS[unit].baseFactor;
}

export function unitsAreCompatible(
  ingredientUnit: IngredientUnit,
  packageUnit: IngredientUnit,
): boolean {
  return unitDimension(ingredientUnit) === unitDimension(packageUnit);
}

/* -------------------------------------------------------------------------- */
/* Supplier costing                                                           */
/* -------------------------------------------------------------------------- */

function clampPercent(value: number): number {
  return Math.min(100, clampNonNegative(value));
}

/**
 * Cost of one base unit (gram, millilitre, or piece) of a supplier package,
 * before any waste allowance.
 *
 * A 1 kg package priced at 120 has a base cost of 0.12 per gram.
 */
export function supplierBaseUnitCost(supplier: SupplierItem): number {
  const packageQuantity = clampNonNegative(supplier.packageQuantity);
  const baseQuantity = packageQuantity * unitToBaseFactor(supplier.packageUnit);
  return safeDivide(clampNonNegative(supplier.price), baseQuantity, 0);
}

/** Waste as a multiplier: a 10% waste rate returns 1.1. */
export function supplierWasteMultiplier(supplier: SupplierItem): number {
  return 1 + clampPercent(supplier.wastePercentage) / 100;
}

/**
 * Cost of one base unit once the supplier's declared waste is included.
 *
 *   EffectiveUnitCost = (PackagePrice ÷ PackageSize) × (1 + waste% ÷ 100)
 *
 * Waste is applied at the unit-cost layer so it flows into every recipe line
 * and scales with the forecast quantities. It is *not* charged again as a
 * fixed cost — see `wasteEngine.ts`.
 */
export function supplierEffectiveBaseUnitCost(
  supplier: SupplierItem,
): number {
  return supplierBaseUnitCost(supplier) * supplierWasteMultiplier(supplier);
}

/** Waste embedded in one base unit: effective cost − raw cost. */
export function supplierWasteUnitCost(supplier: SupplierItem): number {
  return supplierEffectiveBaseUnitCost(supplier) - supplierBaseUnitCost(supplier);
}

/**
 * Human-readable price per kilogram for a mass-based supplier package.
 *
 * The bean dropdowns use this for their helper text, so a 1 kg package priced
 * at 180 and a 500 g package priced at 90 both read as "180 per kg".
 */
export function supplierPricePerKilogram(supplier: SupplierItem): number {
  if (unitDimension(supplier.packageUnit) !== 'mass') return 0;
  return supplierBaseUnitCost(supplier) * 1000;
}

/** Every supplier row that can be selected as a coffee bean. */
export function coffeeBeanSuppliers(
  suppliers: readonly SupplierItem[],
): SupplierItem[] {
  return suppliers.filter((supplier) => supplier.category === 'coffee');
}

/** Coffee beans that can actually be costed by mass (g or kg). */
export function massCoffeeBeanSuppliers(
  suppliers: readonly SupplierItem[],
): SupplierItem[] {
  return coffeeBeanSuppliers(suppliers).filter(
    (supplier) => unitDimension(supplier.packageUnit) === 'mass',
  );
}

/**
 * Resolves a menu row's explicit bean selection.
 *
 * Only `coffee` suppliers are valid bean targets. A stale id returns null so
 * callers can decide whether to fall back or show a warning.
 */
export function findBeanSupplierById(
  suppliers: readonly SupplierItem[],
  id: string | undefined,
): SupplierItem | null {
  if (!id) return null;
  return (
    suppliers.find(
      (supplier) => supplier.id === id && supplier.category === 'coffee',
    ) ?? null
  );
}

/**
 * Cost of one recipe line, including the supplier's declared waste.
 *
 * The recipe unit is converted to the supplier's base dimension first, so
 * 0.018 kg of a 1 kg / 120 supplier package with 10% waste costs
 * 18 × 0.12 × 1.10 = 2.376.
 */
export function ingredientCost(
  ingredient: RecipeIngredient,
  supplier: SupplierItem | null | undefined,
): number {
  if (!supplier) return 0;
  if (!unitsAreCompatible(ingredient.unit, supplier.packageUnit)) return 0;

  const quantityInBaseUnits =
    clampNonNegative(ingredient.quantityUsed) *
    unitToBaseFactor(ingredient.unit);

  return quantityInBaseUnits * supplierEffectiveBaseUnitCost(supplier);
}

/** Cost of one recipe line before the supplier waste allowance. */
export function ingredientBaseCost(
  ingredient: RecipeIngredient,
  supplier: SupplierItem | null | undefined,
): number {
  if (!supplier) return 0;
  if (!unitsAreCompatible(ingredient.unit, supplier.packageUnit)) return 0;

  const quantityInBaseUnits =
    clampNonNegative(ingredient.quantityUsed) *
    unitToBaseFactor(ingredient.unit);

  return quantityInBaseUnits * supplierBaseUnitCost(supplier);
}

/* -------------------------------------------------------------------------- */
/* Retail bean sales                                                          */
/* -------------------------------------------------------------------------- */

export const RETAIL_BEANS_CATEGORY = 'retail_beans' as const;

export function isRetailBeansItem(
  item: Pick<MenuItem, 'category'>,
): boolean {
  return item.category === RETAIL_BEANS_CATEGORY;
}

/**
 * Finds the supplier row that represents the beans sold in retail bags.
 *
 * Preference order:
 * 1. A `coffee` category row whose name mentions beans/coffee.
 * 2. The first `coffee` category row.
 * 3. Any supplier whose name mentions coffee or beans.
 */
export function findCoffeeBeanSupplier(
  suppliers: readonly SupplierItem[],
): SupplierItem | null {
  const coffeeSuppliers = suppliers.filter(
    (supplier) => supplier.category === 'coffee',
  );

  const namedBean = coffeeSuppliers.find((supplier) =>
    /bean|coffee|بن/i.test(supplier.name),
  );
  if (namedBean) return namedBean;
  if (coffeeSuppliers.length > 0) return coffeeSuppliers[0]!;

  return (
    suppliers.find((supplier) => /coffee|bean|بن/i.test(supplier.name)) ??
    null
  );
}

export interface RetailBeanCostBreakdown {
  supplier: SupplierItem | null;
  /** True when the row points at a bean id that is no longer a coffee row. */
  selectedBeanMissing: boolean;
  /** Package price entered on the supplier row. */
  supplierPackagePrice: number;
  /** Package size converted to grams (mass units only). */
  packageSizeGrams: number;
  /** Supplier cost for one gram of beans = package price ÷ package grams. */
  pricePerGram: number;
  /** Bean portion of the bag cost = price per gram × bag weight. */
  beanCost: number;
  /** Packaging cost entered on the menu row. */
  packagingCost: number;
  /** Bean cost + packaging cost. */
  totalCost: number;
  /** False when no mass-based coffee supplier exists. */
  hasBeanPrice: boolean;
}

/**
 * Retail bean COGS audit.
 *
 *   costPerGram = supplierPackagePrice / packageSizeInGrams
 *   beanCost    = costPerGram × bagWeightGrams
 *   totalCOGS   = beanCost + packagingCost
 *
 * The supplier package is normalized to grams first, so a 1 kg package and a
 * 1000 g package produce exactly the same per-gram price. The bean price is
 * always taken from the Suppliers tab, so changing the supplier package price
 * immediately updates every retail bag linked to it.
 *
 * Selection order:
 * 1. `item.selectedBeanId` when it still points at a coffee supplier.
 * 2. The legacy generic coffee-bean finder, so older rows keep working.
 */
export function retailBeanCostBreakdown(
  item: MenuItem,
  suppliers: readonly SupplierItem[],
): RetailBeanCostBreakdown {
  const selectedBean = findBeanSupplierById(suppliers, item.selectedBeanId);
  const supplier = selectedBean ?? findCoffeeBeanSupplier(suppliers);
  const selectedBeanMissing = Boolean(item.selectedBeanId && !selectedBean);
  const packagingCost = clampNonNegative(item.packagingCost ?? 0);
  const bagWeightGrams = clampNonNegative(item.bagWeightGrams ?? 0);

  if (!supplier || unitDimension(supplier.packageUnit) !== 'mass') {
    return {
      supplier,
      selectedBeanMissing,
      supplierPackagePrice: 0,
      packageSizeGrams: 0,
      pricePerGram: 0,
      beanCost: 0,
      packagingCost,
      totalCost: packagingCost,
      hasBeanPrice: false,
    };
  }

  const supplierPackagePrice = clampNonNegative(supplier.price);
  const packageSizeGrams =
    clampNonNegative(supplier.packageQuantity) *
    unitToBaseFactor(supplier.packageUnit);
  const pricePerGram = safeDivide(
    supplierPackagePrice,
    packageSizeGrams,
    0,
  );
  const beanCost = pricePerGram * bagWeightGrams;

  return {
    supplier,
    selectedBeanMissing,
    supplierPackagePrice,
    packageSizeGrams,
    pricePerGram,
    beanCost,
    packagingCost,
    totalCost: beanCost + packagingCost,
    hasBeanPrice: packageSizeGrams > 0,
  };
}

export function retailBeanCogs(
  item: MenuItem,
  suppliers: readonly SupplierItem[],
): number {
  return retailBeanCostBreakdown(item, suppliers).totalCost;
}

/* -------------------------------------------------------------------------- */
/* Recipe breakdown                                                           */
/* -------------------------------------------------------------------------- */

export interface RecipeLineCost {
  ingredient: RecipeIngredient;
  supplier: SupplierItem | null;
  /** Effective line cost, including the supplier waste allowance. */
  cost: number;
  /** Line cost before the waste allowance. */
  baseCost: number;
  /** Waste embedded in this line = cost − baseCost. */
  wasteCost: number;
  /** Supplier waste rate applied to this line (0–100). */
  wasteRate: number;
  /** False when the supplier is missing or the units use different dimensions. */
  compatible: boolean;
}

export interface RecipeCostBreakdown {
  lines: RecipeLineCost[];
  /** Effective recipe cost, including supplier waste. */
  totalCost: number;
  /** Recipe cost before the waste allowance. */
  baseCost: number;
  /** Supplier waste embedded in the recipe = totalCost − baseCost. */
  wasteCost: number;
  missingSupplierCount: number;
  incompatibleUnitCount: number;
  hasIngredients: boolean;
}

/**
 * Resolves every ingredient line against the current supplier list.
 *
 * Each line is costed with `supplierEffectiveBaseUnitCost`, so the supplier's
 * waste percentage is part of the recipe COGS rather than a separate monthly
 * provision. `baseCost` and `wasteCost` are exposed so the UI can explain the
 * difference without re-deriving it.
 *
 * The result is intentionally presentation-friendly: the UI can show a line
 * cost and a warning without doing arithmetic.
 */
export function recipeCostBreakdown(
  item: MenuItem,
  suppliers: readonly SupplierItem[],
): RecipeCostBreakdown {
  const byId = new Map(suppliers.map((supplier) => [supplier.id, supplier]));

  const lines = item.ingredients.map<RecipeLineCost>((ingredient) => {
    const supplier = byId.get(ingredient.supplierId) ?? null;
    const compatible = supplier
      ? unitsAreCompatible(ingredient.unit, supplier.packageUnit)
      : false;
    const cost = ingredientCost(ingredient, supplier);
    const baseCost = ingredientBaseCost(ingredient, supplier);

    return {
      ingredient,
      supplier,
      cost,
      baseCost,
      wasteCost: Math.max(0, cost - baseCost),
      wasteRate: supplier ? clampPercent(supplier.wastePercentage) : 0,
      compatible,
    };
  });

  const totalCost = lines.reduce((sum, line) => sum + line.cost, 0);
  const baseCost = lines.reduce((sum, line) => sum + line.baseCost, 0);

  return {
    lines,
    totalCost,
    baseCost,
    wasteCost: Math.max(0, totalCost - baseCost),
    missingSupplierCount: lines.filter((line) => !line.supplier).length,
    incompatibleUnitCount: lines.filter(
      (line) => line.supplier !== null && !line.compatible,
    ).length,
    hasIngredients: lines.length > 0,
  };
}

/**
 * COGS split for one menu item.
 *
 * Advanced recipes carry supplier waste inside the effective unit cost.
 * Simple percentage estimates and retail bags carry no supplier-waste line: a
 * percentage is already a user estimate of the full material cost, and a
 * sealed retail bag is not consumed in production.
 */
export interface MenuItemCogsBreakdown {
  /** Material cost before the supplier waste allowance. */
  baseCogs: number;
  /** Supplier waste embedded in the material cost. */
  wasteCost: number;
  /** Effective material cost = baseCogs + wasteCost. */
  totalCogs: number;
}

export function menuItemCogsBreakdown(
  item: MenuItem,
  suppliers: readonly SupplierItem[] = [],
): MenuItemCogsBreakdown {
  if (isRetailBeansItem(item)) {
    const totalCogs = retailBeanCogs(item, suppliers);
    return { baseCogs: totalCogs, wasteCost: 0, totalCogs };
  }

  if (item.costingMode === 'advanced') {
    const breakdown = recipeCostBreakdown(item, suppliers);
    return {
      baseCogs: breakdown.baseCost,
      wasteCost: breakdown.wasteCost,
      totalCogs: breakdown.totalCost,
    };
  }

  const totalCogs = simpleCogsForMenuItem(item, suppliers);
  return { baseCogs: totalCogs, wasteCost: 0, totalCogs };
}

/* -------------------------------------------------------------------------- */
/* Menu economics                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reference coffee dose used only by the simple percentage estimator.
 *
 * Simple mode does not know the real recipe, so it uses a typical 18 g shot to
 * translate the selected bean's price into a COGS adjustment. Advanced mode
 * uses the actual ingredient quantities instead.
 */
export const SIMPLE_BEAN_REFERENCE_GRAMS = 18;

/** Average per-gram price across all mass-based coffee suppliers. */
export function averageCoffeePricePerGram(
  suppliers: readonly SupplierItem[],
): number {
  const beans = massCoffeeBeanSuppliers(suppliers);
  if (beans.length === 0) return 0;
  return (
    beans.reduce(
      (total, supplier) => total + supplierEffectiveBaseUnitCost(supplier),
      0,
    ) / beans.length
  );
}

/**
 * How much the selected bean moves the simple COGS estimate.
 *
 * The percentage estimate is treated as the cost of a typical drink using the
 * average coffee price. Selecting a dearer bean adds the price difference for
 * an 18 g reference dose; selecting a cheaper bean subtracts it. With a single
 * coffee supplier the adjustment is zero, so existing simple items are
 * unchanged until the user adds more beans.
 */
export function beanPriceAdjustment(
  item: MenuItem,
  suppliers: readonly SupplierItem[],
): number {
  if (!item.selectedBeanId) return 0;

  const selected = findBeanSupplierById(suppliers, item.selectedBeanId);
  if (!selected || unitDimension(selected.packageUnit) !== 'mass') return 0;

  const averageRate = averageCoffeePricePerGram(suppliers);
  return (
    (supplierEffectiveBaseUnitCost(selected) - averageRate) *
    SIMPLE_BEAN_REFERENCE_GRAMS
  );
}

/**
 * Simple-mode COGS = sellingPrice × estimatedCogsPercent / 100.
 *
 * When a bean is selected, the estimate is adjusted by that bean's price
 * difference versus the average coffee supplier. The base percentage still
 * covers milk, packaging, and other costs.
 */
export function simpleCogsForMenuItem(
  item: MenuItem,
  suppliers: readonly SupplierItem[] = [],
): number {
  const base =
    (clampNonNegative(item.sellingPrice) *
      clampNonNegative(item.estimatedCogsPercent)) /
    100;
  return Math.max(0, base + beanPriceAdjustment(item, suppliers));
}

/**
 * COGS for one menu item.
 *
 * Advanced items use linked supplier prices. Simple items use the percentage
 * estimate plus the selected-bean adjustment. The default `suppliers` argument
 * keeps callers that only use simple items concise.
 */
export function cogsForMenuItem(
  item: MenuItem,
  suppliers: readonly SupplierItem[] = [],
): number {
  /* Retail bags are costed from the supplier bean price, never from a recipe
     percentage or ingredient list. */
  if (isRetailBeansItem(item)) {
    return retailBeanCogs(item, suppliers);
  }

  if (item.costingMode === 'advanced') {
    return recipeCostBreakdown(item, suppliers).totalCost;
  }
  return simpleCogsForMenuItem(item, suppliers);
}

export interface MenuItemEconomics {
  /** Price shown to the customer (VAT-inclusive when configured). */
  sellingPrice: number;
  /** VAT-exclusive price used for margins and break-even. */
  netSellingPrice: number;
  /** VAT amount embedded in or added to the list price. */
  vatAmount: number;
  cogs: number;
  contributionMargin: number;
  contributionMarginRatio: number;
}

const NO_VAT: VatSettings = { pricesIncludeVAT: false, vatRate: 0 };

function vatSettingsOrDefault(settings?: VatSettings): VatSettings {
  return settings ?? NO_VAT;
}

/** Per-row economics used by the Menu tab and Summary. */
export function menuItemEconomics(
  item: MenuItem,
  suppliers: readonly SupplierItem[] = [],
  vatSettings: VatSettings = NO_VAT,
): MenuItemEconomics {
  const sellingPrice = clampNonNegative(item.sellingPrice);
  const settings = vatSettingsOrDefault(vatSettings);
  const netPrice = calculateNetSellingPrice(
    sellingPrice,
    settings.pricesIncludeVAT,
    settings.vatRate,
  );
  const cogs = cogsForMenuItem(item, suppliers);
  const contributionMargin = netPrice - cogs;

  return {
    sellingPrice,
    netSellingPrice: netPrice,
    vatAmount: calculateVatAmount(
      sellingPrice,
      settings.pricesIncludeVAT,
      settings.vatRate,
    ),
    cogs,
    contributionMargin,
    contributionMarginRatio: safeDivide(contributionMargin, netPrice, 0),
  };
}

/**
 * Simple averages across the menu. There is no mix-ratio balancing in the
 * simplified model: every menu row counts equally.
 */
export function computeMenuMetrics(
  items: readonly MenuItem[],
  suppliers: readonly SupplierItem[] = [],
  vatSettings: VatSettings = NO_VAT,
): MenuMetrics {
  const itemCount = items.length;
  if (itemCount === 0) {
    return {
      itemCount: 0,
      averageSellingPrice: 0,
      averageNetSellingPrice: 0,
      averageVatAmount: 0,
      averageCogs: 0,
      averageContributionMargin: 0,
      contributionMarginRatio: 0,
      cogsRatio: 0,
    };
  }

  const settings = vatSettingsOrDefault(vatSettings);
  const totalPrice = items.reduce(
    (sum, item) => sum + clampNonNegative(item.sellingPrice),
    0,
  );
  const totalNetPrice = items.reduce(
    (sum, item) =>
      sum +
      calculateNetSellingPrice(
        item.sellingPrice,
        settings.pricesIncludeVAT,
        settings.vatRate,
      ),
    0,
  );
  const totalVat = items.reduce(
    (sum, item) =>
      sum +
      calculateVatAmount(
        item.sellingPrice,
        settings.pricesIncludeVAT,
        settings.vatRate,
      ),
    0,
  );
  const totalCogs = items.reduce(
    (sum, item) => sum + cogsForMenuItem(item, suppliers),
    0,
  );
  const averageSellingPrice = totalPrice / itemCount;
  const averageNetSellingPrice = totalNetPrice / itemCount;
  const averageVatAmount = totalVat / itemCount;
  const averageCogs = totalCogs / itemCount;
  const averageContributionMargin =
    averageNetSellingPrice - averageCogs;

  return {
    itemCount,
    averageSellingPrice,
    averageNetSellingPrice,
    averageVatAmount,
    averageCogs,
    averageContributionMargin,
    contributionMarginRatio: safeDivide(
      averageContributionMargin,
      averageNetSellingPrice,
      0,
    ),
    cogsRatio: safeDivide(averageCogs, averageNetSellingPrice, 0),
  };
}
