import { clampNonNegative, safeDivide } from './math';

/**
 * VAT / net-pricing helpers.
 *
 * Menu prices can be entered either VAT-inclusive or VAT-exclusive. Every
 * margin and break-even calculation uses the VAT-exclusive (net) price, while
 * the menu keeps showing the price the customer actually pays.
 */

export interface VatSettings {
  pricesIncludeVAT: boolean;
  vatRate: number;
}

export const DEFAULT_VAT_SETTINGS: VatSettings = {
  pricesIncludeVAT: true,
  vatRate: 15,
};

/** VAT-exclusive price for a single menu item. */
export function netSellingPrice(
  sellingPrice: number,
  pricesIncludeVAT: boolean = false,
  vatRate: number = 0,
): number {
  const price = clampNonNegative(sellingPrice);
  const rate = clampNonNegative(vatRate);

  if (!pricesIncludeVAT) return price;
  return safeDivide(price, 1 + rate / 100, 0);
}

/** VAT collected on one sale: gross price − net price. */
export function salesVatAmount(
  sellingPrice: number,
  pricesIncludeVAT: boolean = false,
  vatRate: number = 0,
): number {
  return (
    grossSellingPrice(sellingPrice, pricesIncludeVAT, vatRate) -
    netSellingPrice(sellingPrice, pricesIncludeVAT, vatRate)
  );
}

/** VAT amount embedded in (or added to) a single menu price. */
export function vatAmount(
  sellingPrice: number,
  pricesIncludeVAT: boolean = false,
  vatRate: number = 0,
): number {
  const price = clampNonNegative(sellingPrice);
  const net = netSellingPrice(price, pricesIncludeVAT, vatRate);
  return clampNonNegative(price - net);
}

/**
 * Price the customer actually pays for a list selling price.
 *
 * When prices already include VAT the list price is the gross price. When
 * they exclude VAT, VAT is added on top of the list price.
 */
export function grossSellingPrice(
  sellingPrice: number,
  pricesIncludeVAT: boolean = false,
  vatRate: number = 0,
): number {
  const price = clampNonNegative(sellingPrice);
  if (pricesIncludeVAT) return price;
  return price * (1 + clampNonNegative(vatRate) / 100);
}
