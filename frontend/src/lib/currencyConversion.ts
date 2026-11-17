import { convertCurrencyAmount } from '@shared/engine';
import type { AppState } from '../types/app';

/** Keeps converted inputs readable without losing cent-level precision. */
function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Converts every monetary field in the workspace from one currency to another.
 *
 * Rates are units per US dollar. Non-monetary fields (quantities, percentages,
 * headcounts, useful life, loan term) are left untouched. The settings block is
 * also untouched; the caller is responsible for writing the new code, symbol,
 * and rate after the conversion.
 */
export function convertWorkspaceCurrency(
  state: AppState,
  fromRateToUsd: number,
  toRateToUsd: number,
): AppState {
  const convert = (amount: number) =>
    roundMoney(convertCurrencyAmount(amount, fromRateToUsd, toRateToUsd));

  return {
    ...state,
    suppliers: state.suppliers.map((supplier) => ({
      ...supplier,
      price: convert(supplier.price),
    })),
    menu: state.menu.map((item) => ({
      ...item,
      sellingPrice: convert(item.sellingPrice),
      packagingCost: convert(item.packagingCost ?? 0),
    })),
    expenses: state.expenses.map((expense) => ({
      ...expense,
      amount: convert(expense.amount),
    })),
    staffing: state.staffing.map((role) => ({
      ...role,
      baseSalary: convert(role.baseSalary),
      housingAllowance: convert(role.housingAllowance),
      transportAllowance: convert(role.transportAllowance),
      medicalInsurance: convert(role.medicalInsurance),
      annualVisaCost: convert(role.annualVisaCost),
      annualFlightCost: convert(role.annualFlightCost),
    })),
    assets: state.assets.map((asset) => ({
      ...asset,
      purchasePrice: convert(asset.purchasePrice),
      shippingInstallation: convert(asset.shippingInstallation),
      salvageValue: convert(asset.salvageValue),
    })),
    financing: {
      ...state.financing,
      commercialLoanPrincipal: convert(state.financing.commercialLoanPrincipal),
    },
    cashFlow: {
      ...state.cashFlow,
      openingLiquidCash: convert(state.cashFlow.openingLiquidCash),
    },
  };
}
