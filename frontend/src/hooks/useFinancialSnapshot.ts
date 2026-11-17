import { useMemo } from 'react';
import {
  buildCashFlowProjection,
  classifyCashRunway,
  classifyMaterialsAndLabor,
  computeAssetMetrics,
  computeBreakEven,
  computeMenuMetrics,
  computeMaterialsAndLaborPercent,
  monthlyLoanInstallment as computeMonthlyLoanInstallment,
  payrollBreakdown,
  embeddedWasteMonthly,
  totalCashFixedCosts,
  totalMonthlyWaste,
  wasteExpenseTotal,
} from '@shared/engine';
import type { CashFlowProjection, OperatingExpenseCategory } from '@shared/types';
import { useCalculator } from '../context/CalculatorContext';
import type { FinancialSnapshot } from '../types/app';

/**
 * The single adapter between the persisted workspace and the pure engine.
 *
 * No arithmetic lives in components: this hook only selects engine outputs.
 */
export function useFinancialSnapshot(): FinancialSnapshot {
  const { state } = useCalculator();
  const { settings, suppliers, menu, expenses, staffing, assets, financing, cashFlow } =
    state;

  return useMemo(() => {
    /* -------------------------------------------------------------------- */
    /* Payroll                                                              */
    /* -------------------------------------------------------------------- */
    const payroll = payrollBreakdown(
      staffing,
      settings.socialInsuranceRate,
      settings.endOfServiceRate,
    );
    const baseSalaries = payroll.baseSalaries;
    const basePayroll = payroll.basePayroll;
    const loadedPayroll = payroll.loadedPayroll;

    /* -------------------------------------------------------------------- */
    /* Monthly cash fixed costs                                             */
    /* -------------------------------------------------------------------- */
    const recurring = (category: OperatingExpenseCategory) =>
      expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + Math.max(0, expense.amount), 0);

    const monthlyRent = recurring('rent');
    const monthlyUtilities = recurring('utilities');
    const monthlyMarketing = recurring('marketing');
    const monthlyOther = recurring('other');
    const monthlyOperatingExpenses =
      monthlyUtilities + monthlyMarketing + monthlyOther;
    const monthlyWasteExpenses = wasteExpenseTotal(expenses);
    /* Supplier waste is already inside COGS; this is a reporting figure only. */
    const wasteEmbeddedInCogs = embeddedWasteMonthly(menu, suppliers);
    const monthlyWaste = totalMonthlyWaste(expenses);
    const monthlyLoanInstallment = computeMonthlyLoanInstallment(
      financing.commercialLoanPrincipal,
      financing.annualInterestRate,
      financing.termMonths,
    );

    const totalFixedCosts = totalCashFixedCosts({
      rent: monthlyRent,
      loadedPayroll,
      utilities: monthlyUtilities,
      marketing: monthlyMarketing,
      loanInstallment: monthlyLoanInstallment,
      waste: monthlyWaste,
      other: monthlyOther,
    });

    /* -------------------------------------------------------------------- */
    /* Fixed assets                                                         */
    /* -------------------------------------------------------------------- */
    const assetMetrics = computeAssetMetrics(assets);

    /* -------------------------------------------------------------------- */
    /* Menu economics & break-even                                           */
    /* -------------------------------------------------------------------- */
    const vatSettings = {
      pricesIncludeVAT: settings.PricesIncludeVAT,
      vatRate: settings.VATRate,
    };
    const menuMetrics = computeMenuMetrics(menu, suppliers, vatSettings);
    const breakEven = computeBreakEven({
      fixedCashCosts: totalFixedCosts,
      targetMaterialCostRatio: settings.TargetMaterialCostRatio,
      menu,
      suppliers,
      vatSettings,
    });

    const hasBreakEven =
      breakEven.isCalculable && breakEven.isBreakEvenReachable;

    const monthlyBreakEvenRevenue = hasBreakEven
      ? breakEven.monthlyBreakEvenRevenue
      : null;
    const requiredDailyRevenue = hasBreakEven
      ? breakEven.requiredDailyRevenue
      : null;
    const projectedDailyRevenue = breakEven.projectedDailyRevenue;
    const projectedMonthlyRevenue = breakEven.projectedMonthlyRevenue;
    const projectedDailyGrossRevenue = breakEven.projectedDailyGrossRevenue;
    const projectedMonthlyGrossRevenue = breakEven.projectedMonthlyGrossRevenue;
    const projectedDailyVat = breakEven.projectedDailyVat;
    const projectedMonthlyVat = breakEven.projectedMonthlyVat;
    const breakEvenGap = breakEven.revenueGap;
    const coversBreakEven = breakEven.coversBreakEven;
    const hasForecastData = breakEven.hasData;
    const negativeContribution = breakEven.negativeContribution;

    /* Materials & labour uses the policy target ratio, because that is the
       margin the break-even target is built on. */
    const materialsAndLaborPercent = computeMaterialsAndLaborPercent({
      cogsRatio: breakEven.targetMaterialCostRatio / 100,
      monthlyPayroll: loadedPayroll,
      monthlyRevenue: monthlyBreakEvenRevenue,
    });
    const materialsAndLaborBand = classifyMaterialsAndLabor(
      materialsAndLaborPercent,
    );

    /* -------------------------------------------------------------------- */
    /* 12-month cash flow                                                   */
    /* -------------------------------------------------------------------- */
    /* The loan is charged separately so it stops after the loan term. */
    const fixedCostsExcludingLoan = Math.max(
      0,
      totalFixedCosts - monthlyLoanInstallment,
    );
    const hasCashFlowModel = menu.length > 0 && breakEven.hasData;

    let projection: CashFlowProjection | null = null;
    if (hasCashFlowModel) {
      projection = buildCashFlowProjection({
        dailyNetRevenue: breakEven.projectedDailyRevenue,
        dailyGrossRevenue: breakEven.projectedDailyGrossRevenue,
        dailyCogs: breakEven.projectedDailyCogs,
        fixedCashCosts: fixedCostsExcludingLoan,
        rampUp: cashFlow.rampUpPercent.map((percent) => percent / 100),
        openingBankBalance: cashFlow.openingLiquidCash,
        loanPrincipal: financing.commercialLoanPrincipal,
        loanInstallment: monthlyLoanInstallment,
        loanTermMonths: financing.termMonths,
      });
    }

    const cashRunwayMonths = projection?.summary.cashRunwayMonths ?? null;
    let cashRunwayBand = classifyCashRunway(cashRunwayMonths);
    if (!projection) {
      cashRunwayBand = 'unknown';
    } else if (cashRunwayMonths === null) {
      /* The balance never turns negative inside the horizon. */
      cashRunwayBand = 'healthy';
    }

    return {
      baseSalaries,
      basePayroll,
      socialInsuranceAmount: payroll.socialInsurance,
      endOfServiceAmount: payroll.endOfService,
      loadedPayroll,
      monthlyRent,
      monthlyUtilities,
      monthlyMarketing,
      monthlyOther,
      monthlyOperatingExpenses,
      monthlyWasteExpenses,
      wasteEmbeddedInCogs,
      monthlyWaste,
      monthlyLoanInstallment,
      totalCashFixedCosts: totalFixedCosts,
      assets: assetMetrics,
      menu: menuMetrics,
      breakEven,
      monthlyBreakEvenRevenue,
      requiredDailyRevenue,
      projectedDailyRevenue,
      projectedMonthlyRevenue,
      projectedDailyGrossRevenue,
      projectedMonthlyGrossRevenue,
      projectedDailyVat,
      projectedMonthlyVat,
      breakEvenGap,
      coversBreakEven,
      hasForecastData,
      negativeContribution,
      materialsAndLaborPercent,
      materialsAndLaborBand,
      hasBreakEven,
      projection,
      hasCashFlowModel,
      cashRunwayMonths,
      cashRunwayBand,
    };
  }, [settings, suppliers, menu, expenses, staffing, assets, financing, cashFlow]);
}
