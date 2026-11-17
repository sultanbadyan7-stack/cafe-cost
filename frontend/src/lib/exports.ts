import type {
  Workbook as ExcelWorkbook,
  Worksheet,
} from 'exceljs';
import type { TranslationKey } from '@i18n/index';
import {
  employeeMonthlyCost,
  menuItemEconomics,
  monthlyDepreciation,
  roleMonthlyCost,
} from '@shared/engine';
import type { AppState, FinancialSnapshot } from '../types/app';
import {
  ASSET_CATEGORY_KEYS,
  DEPRECIATION_METHOD_KEYS,
  menuCategoryLabel,
  menuCostingModeLabel,
  supplierCategoryLabel,
} from './categories';

type Translate = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

export interface ExcelExportInput {
  state: AppState;
  snapshot: FinancialSnapshot;
  language: 'en' | 'ar';
  t: Translate;
}

const HEADER_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF0F172A' },
};

const CURRENCY_FORMAT = '#,##0.00';
const PERCENT_FORMAT = '0.0"%"';

function addHeaderRow(worksheet: Worksheet, values: string[]) {
  const row = worksheet.addRow(values);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: 'middle' };
  row.height = 22;
}

function setWidths(worksheet: Worksheet, widths: number[]) {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function styleCurrencyColumns(worksheet: Worksheet, columns: number[]) {
  columns.forEach((column) => {
    worksheet.getColumn(column).numFmt = CURRENCY_FORMAT;
  });
}

function addTitleRow(worksheet: Worksheet, title: string) {
  const row = worksheet.addRow([title]);
  row.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
  worksheet.addRow([]);
}

/**
 * Builds a free, multi-sheet Excel workbook and downloads it in the browser.
 *
 * ExcelJS is loaded on demand so it never inflates the initial bundle.
 */
export async function exportWorkspaceToExcel({
  state,
  snapshot,
  language,
  t,
}: ExcelExportInput): Promise<void> {
  const module = (await import('exceljs')) as unknown as {
    Workbook: new () => ExcelWorkbook;
    default?: { Workbook: new () => ExcelWorkbook };
  };
  const WorkbookCtor = module.Workbook ?? module.default?.Workbook;
  if (!WorkbookCtor) {
    throw new Error('ExcelJS workbook constructor is unavailable.');
  }

  const workbook = new WorkbookCtor();
  workbook.creator = 'CaféCost';
  workbook.created = new Date();

  const rtl = language === 'ar';
  const newSheet = (name: string) =>
    workbook.addWorksheet(name, {
      views: rtl ? [{ rightToLeft: true }] : undefined,
    });

  const symbol = state.settings.currencySymbol;
  const generated = new Date().toISOString().slice(0, 10);

  /* ---------------------------------------------------------------------- */
  /* Summary                                                                */
  /* ---------------------------------------------------------------------- */
  const summary = newSheet(t('excel.sheet.summary'));
  addTitleRow(
    summary,
    `${state.settings.projectName || t('app.name')} — ${t('summary.printTitle')}`,
  );
  addHeaderRow(summary, [t('excel.header.metric'), t('excel.header.value')]);

  const summaryRows: Array<[string, number | string | null]> = [
    [t('excel.generated'), generated],
    [t('common.currency'), `${state.settings.currencyCode} (${symbol})`],
    [t('summary.requiredDailyRevenue'), snapshot.requiredDailyRevenue],
    [t('summary.projectedDailyRevenue'), snapshot.projectedDailyRevenue],
    [t('summary.projectedMonthlyRevenue'), snapshot.projectedMonthlyRevenue],
    [
      t('summary.projectedDailyGrossRevenue'),
      snapshot.projectedDailyGrossRevenue,
    ],
    [
      t('summary.projectedMonthlyGrossRevenue'),
      snapshot.projectedMonthlyGrossRevenue,
    ],
    [t('summary.vatOnSales'), snapshot.projectedMonthlyVat],
    [t('summary.expectedDailyCogs'), snapshot.breakEven.projectedDailyCogs],
    [
      t('summary.targetMaterialCostRatio'),
      snapshot.breakEven.targetMaterialCostRatio,
    ],
    [t('summary.targetMarginRatio'), snapshot.breakEven.marginRatio],
    [t('summary.monthlyBreakEven'), snapshot.monthlyBreakEvenRevenue],
    [t('summary.materialsAndLabor'), snapshot.materialsAndLaborPercent],
    [t('general.vatRate'), state.settings.VATRate],
    [t('summary.averageNetPrice'), snapshot.menu.averageNetSellingPrice],
    [t('summary.fixedCosts'), snapshot.totalCashFixedCosts],
    [t('summary.rent'), snapshot.monthlyRent],
    [t('summary.payroll'), snapshot.loadedPayroll],
    [t('summary.utilities'), snapshot.monthlyUtilities],
    [t('summary.marketing'), snapshot.monthlyMarketing],
    [t('summary.waste'), snapshot.monthlyWaste],
    [t('summary.other'), snapshot.monthlyOther],
    [t('summary.loanInstallment'), snapshot.monthlyLoanInstallment],
    [t('summary.averagePrice'), snapshot.menu.averageSellingPrice],
    [t('summary.averageCogs'), snapshot.menu.averageCogs],
    [t('summary.contributionMargin'), snapshot.menu.averageContributionMargin],
    [t('summary.baseSalaries'), snapshot.baseSalaries],
    [t('summary.basePayroll'), snapshot.basePayroll],
    [t('expenses.insurance'), snapshot.socialInsuranceAmount],
    [t('expenses.endOfService'), snapshot.endOfServiceAmount],
    [t('summary.loadedPayroll'), snapshot.loadedPayroll],
    [t('expenses.totalAssetCost'), snapshot.assets.totalAssetCost],
    [
      t('expenses.monthlyDepreciation'),
      snapshot.assets.totalMonthlyDepreciation,
    ],
    [t('expenses.annualDepreciation'), snapshot.assets.totalAnnualDepreciation],
  ];

  if (snapshot.projection) {
    summaryRows.push(
      [
        t('summary.totalNetRevenue'),
        snapshot.projection.summary.totalNetRevenue,
      ],
      [
        t('summary.totalGrossRevenue'),
        snapshot.projection.summary.totalGrossRevenue,
      ],
      [t('summary.vatPayable'), snapshot.projection.summary.totalVatPayable],
      [t('summary.endingBalance'), snapshot.projection.summary.endingBankBalance],
      [t('summary.minBalance'), snapshot.projection.summary.minimumClosingBalance],
      [t('summary.monthlyBurn'), snapshot.projection.summary.monthlyCashBurn],
      [t('summary.cashRunway'), snapshot.cashRunwayMonths],
    );
  }

  summaryRows.forEach(([label, value]) => {
    summary.addRow([label, value ?? '—']);
  });

  setWidths(summary, [42, 24]);
  summary.getColumn(2).numFmt = CURRENCY_FORMAT;
  summary.getColumn(2).alignment = { horizontal: 'right' };

  /* ---------------------------------------------------------------------- */
  /* Menu                                                                   */
  /* ---------------------------------------------------------------------- */
  const menu = newSheet(t('excel.sheet.menu'));
  addHeaderRow(menu, [
    t('excel.header.name'),
    t('excel.header.category'),
    t('excel.header.mode'),
    t('excel.header.price'),
    t('menu.expectedDailyUnits'),
    t('excel.header.cogs'),
    t('menu.cogs'),
    t('menu.margin'),
  ]);
  state.menu.forEach((item) => {
    const economics = menuItemEconomics(item, state.suppliers, {
      pricesIncludeVAT: state.settings.PricesIncludeVAT,
      vatRate: state.settings.VATRate,
    });
    menu.addRow([
      item.name,
      menuCategoryLabel(item.category, t),
      menuCostingModeLabel(item.costingMode, item.category, t),
      item.sellingPrice,
      item.expectedDailyUnits ?? 0,
      item.category === 'retail_beans' || item.costingMode === 'advanced'
        ? '—'
        : item.estimatedCogsPercent,
      economics.cogs,
      economics.contributionMargin,
    ]);
  });
  setWidths(menu, [28, 18, 16, 16, 16, 14, 16, 18]);
  styleCurrencyColumns(menu, [4, 7, 8]);
  menu.getColumn(6).numFmt = PERCENT_FORMAT;

  /* ---------------------------------------------------------------------- */
  /* Suppliers                                                              */
  /* ---------------------------------------------------------------------- */
  const suppliers = newSheet(t('excel.sheet.suppliers'));
  addHeaderRow(suppliers, [
    t('excel.header.name'),
    t('suppliers.category'),
    t('suppliers.package'),
    t('excel.header.price'),
    t('suppliers.waste'),
  ]);
  state.suppliers.forEach((supplier) => {
    suppliers.addRow([
      supplier.name,
      supplierCategoryLabel(supplier.category, t),
      supplier.packageLabel,
      supplier.price,
      supplier.wastePercentage,
    ]);
  });
  setWidths(suppliers, [32, 18, 20, 16, 14]);
  styleCurrencyColumns(suppliers, [4]);
  suppliers.getColumn(5).numFmt = PERCENT_FORMAT;

  /* ---------------------------------------------------------------------- */
  /* Expenses                                                               */
  /* ---------------------------------------------------------------------- */
  const expenses = newSheet(t('excel.sheet.expenses'));
  addHeaderRow(expenses, [
    t('excel.header.name'),
    t('excel.header.category'),
    t('excel.header.amount'),
  ]);
  state.expenses.forEach((expense) => {
    const categoryKey =
      expense.category === 'rent'
        ? 'expenses.category.rent'
        : expense.category === 'utilities'
          ? 'expenses.category.utilities'
          : expense.category === 'marketing'
            ? 'expenses.category.marketing'
            : expense.category === 'waste'
              ? 'expenses.category.waste'
              : 'expenses.category.other';
    expenses.addRow([
      expense.name,
      t(categoryKey),
      expense.amount,
    ]);
  });
  setWidths(expenses, [32, 18, 16]);
  styleCurrencyColumns(expenses, [3]);

  /* ---------------------------------------------------------------------- */
  /* Staffing                                                               */
  /* ---------------------------------------------------------------------- */
  const staffing = newSheet(t('excel.sheet.staffing'));
  addHeaderRow(staffing, [
    t('excel.header.name'),
    t('excel.header.count'),
    t('expenses.baseSalary'),
    t('expenses.housingAllowance'),
    t('expenses.transportAllowance'),
    t('expenses.medicalInsurance'),
    t('expenses.annualVisaCost'),
    t('expenses.annualFlightCost'),
    t('expenses.monthlyPerEmployee'),
    t('excel.header.total'),
  ]);
  state.staffing.forEach((role) => {
    staffing.addRow([
      role.roleName,
      role.count,
      role.baseSalary,
      role.housingAllowance,
      role.transportAllowance,
      role.medicalInsurance,
      role.annualVisaCost,
      role.annualFlightCost,
      employeeMonthlyCost(role),
      roleMonthlyCost(role),
    ]);
  });
  setWidths(staffing, [24, 10, 14, 14, 14, 14, 14, 14, 18, 18]);
  styleCurrencyColumns(staffing, [3, 4, 5, 6, 7, 8, 9, 10]);

  /* ---------------------------------------------------------------------- */
  /* Fixed assets                                                           */
  /* ---------------------------------------------------------------------- */
  const assets = newSheet(t('excel.sheet.assets'));
  addHeaderRow(assets, [
    t('excel.header.name'),
    t('expenses.assetCategory'),
    t('expenses.purchasePrice'),
    t('expenses.shippingInstallation'),
    t('expenses.usefulLife'),
    t('expenses.salvageValue'),
    t('expenses.depreciationMethod'),
    t('expenses.monthlyDepreciation'),
  ]);
  state.assets.forEach((asset) => {
    assets.addRow([
      asset.name,
      t(ASSET_CATEGORY_KEYS[asset.category]),
      asset.purchasePrice,
      asset.shippingInstallation,
      asset.usefulLifeYears,
      asset.salvageValue,
      t(DEPRECIATION_METHOD_KEYS[asset.depreciationMethod]),
      monthlyDepreciation(asset),
    ]);
  });
  setWidths(assets, [28, 18, 16, 18, 14, 14, 18, 18]);
  styleCurrencyColumns(assets, [3, 4, 6, 8]);

  /* ---------------------------------------------------------------------- */
  /* Cash flow                                                              */
  /* ---------------------------------------------------------------------- */
  const cashFlow = newSheet(t('excel.sheet.cashFlow'));
  addHeaderRow(cashFlow, [
    t('excel.header.month'),
    t('summary.grossRevenue'),
    t('summary.vatPayable'),
    t('summary.netRevenue'),
    t('summary.cogs'),
    t('excel.header.fixed'),
    t('excel.header.netCash'),
    t('excel.header.closing'),
  ]);
  snapshot.projection?.months.forEach((row) => {
    cashFlow.addRow([
      row.month,
      row.grossRevenue,
      row.vatPayable,
      row.projectedRevenue,
      row.directCosts,
      row.fixedCashCosts,
      row.netCashFlow,
      row.closingBalance,
    ]);
  });
  setWidths(cashFlow, [12, 18, 18, 18, 18, 18, 18, 18]);
  styleCurrencyColumns(cashFlow, [2, 3, 4, 5, 6, 7, 8]);

  /* ---------------------------------------------------------------------- */
  /* Download                                                               */
  /* ---------------------------------------------------------------------- */
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${t('excel.fileName')}-${generated}.xlsx`;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
