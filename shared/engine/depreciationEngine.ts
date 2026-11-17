import type { AssetMetrics, FixedAsset } from '../types';
import { clampNonNegative, safeDivide } from './math';

/* -------------------------------------------------------------------------- */
/* Straight-line depreciation                                                 */
/* -------------------------------------------------------------------------- */

/** Total capitalised cost = purchase price + shipping & installation. */
export function assetTotalCost(asset: FixedAsset): number {
  return (
    clampNonNegative(asset.purchasePrice) +
    clampNonNegative(asset.shippingInstallation)
  );
}

/** Depreciable base = purchase + shipping − salvage, floored at zero. */
export function assetDepreciableBase(asset: FixedAsset): number {
  return Math.max(
    0,
    assetTotalCost(asset) - clampNonNegative(asset.salvageValue),
  );
}

/**
 * Monthly straight-line depreciation:
 * (purchase + shipping − salvage) / (useful life years × 12).
 */
export function monthlyDepreciation(asset: FixedAsset): number {
  if (asset.depreciationMethod !== 'straight_line') return 0;

  const usefulLifeMonths =
    clampNonNegative(asset.usefulLifeYears) * 12;

  return safeDivide(assetDepreciableBase(asset), usefulLifeMonths, 0);
}

export function annualDepreciation(asset: FixedAsset): number {
  return monthlyDepreciation(asset) * 12;
}

/** Asset-register summary used by the Expenses tab, Summary, and Excel. */
export function computeAssetMetrics(
  assets: readonly FixedAsset[],
): AssetMetrics {
  const totalAssetCost = assets.reduce(
    (sum, asset) => sum + assetTotalCost(asset),
    0,
  );
  const totalSalvageValue = assets.reduce(
    (sum, asset) => sum + clampNonNegative(asset.salvageValue),
    0,
  );
  const totalDepreciableBase = assets.reduce(
    (sum, asset) => sum + assetDepreciableBase(asset),
    0,
  );
  const totalMonthlyDepreciation = assets.reduce(
    (sum, asset) => sum + monthlyDepreciation(asset),
    0,
  );

  return {
    assetCount: assets.length,
    totalAssetCost,
    totalSalvageValue,
    totalDepreciableBase,
    totalMonthlyDepreciation,
    totalAnnualDepreciation: totalMonthlyDepreciation * 12,
  };
}
