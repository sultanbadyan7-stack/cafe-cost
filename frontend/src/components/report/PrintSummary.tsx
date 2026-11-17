import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  employeeMonthlyCost,
  menuItemEconomics,
  monthlyDepreciation,
  roleMonthlyCost,
} from '@shared/engine';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import { ASSET_CATEGORY_KEYS, menuCostingModeLabel } from '../../lib/categories';
import { TELEGRAM_URL } from '../../lib/links';
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatNumber,
  formatPercent,
  formatRatioPercent,
} from '../../lib/format';

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-primary/55">
        {label}
      </p>
      <p className="mt-1 font-numeric text-[18px] font-semibold leading-6 text-primary">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[9px] text-primary/50">{hint}</p> : null}
    </div>
  );
}

export function PrintSummary() {
  const { state } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t, language } = useI18n();
  const symbol = state.settings.currencySymbol;
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const before = () => document.body.classList.add('has-print-document');
    const after = () => document.body.classList.remove('has-print-document');
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      document.body.classList.remove('has-print-document');
    };
  }, []);

  const fixedRows: Array<[string, number]> = [
    [t('summary.rent'), snapshot.monthlyRent],
    [t('summary.payroll'), snapshot.loadedPayroll],
    [t('summary.utilities'), snapshot.monthlyUtilities],
    [t('summary.marketing'), snapshot.monthlyMarketing],
    [t('summary.waste'), snapshot.monthlyWaste],
    [t('summary.other'), snapshot.monthlyOther],
    [t('summary.loanInstallment'), snapshot.monthlyLoanInstallment],
  ];

  const vatSettings = {
    pricesIncludeVAT: state.settings.PricesIncludeVAT,
    vatRate: state.settings.VATRate,
  };

  return createPortal(
    <div
      className="print-document print-exact bg-white text-primary"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <section className="print-page">
        <header className="flex items-start justify-between gap-6 border-b border-border pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {t('app.name')}
            </p>
            <h1 className="mt-1 text-[24px] font-bold leading-8">
              {state.settings.projectName || t('summary.printTitle')}
            </h1>
            <p className="mt-1 text-[10px] text-primary/55">
              {t('summary.printTitle')} · {t('summary.generatedOn', {
                date: formatDate(today, language),
              })}
            </p>
          </div>
          <div className="text-end text-[10px] text-primary/55">
            <p className="font-medium text-primary">
              {state.settings.currencyCode} · {symbol}
            </p>
            <p className="mt-1">{t('summary.freeNote')}</p>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric
            label={t('summary.requiredDailyRevenue')}
            value={formatCurrency(snapshot.requiredDailyRevenue, symbol)}
            hint={t('common.perDay')}
          />
          <Metric
            label={t('summary.projectedDailyRevenue')}
            value={formatCurrency(snapshot.projectedDailyRevenue, symbol)}
            hint={t('summary.projectedDailyRevenueHint')}
          />
          <Metric
            label={t('summary.monthlyBreakEven')}
            value={formatCurrency(snapshot.monthlyBreakEvenRevenue, symbol)}
          />
          <Metric
            label={t('summary.projectedMonthlyRevenue')}
            value={formatCurrency(snapshot.projectedMonthlyRevenue, symbol)}
          />
          <Metric
            label={t('summary.projectedDailyGrossRevenue')}
            value={formatCurrency(snapshot.projectedDailyGrossRevenue, symbol)}
          />
          <Metric
            label={t('summary.vatOnSales')}
            value={formatCurrency(snapshot.projectedMonthlyVat, symbol)}
          />
          <Metric
            label={t('summary.targetMaterialCostRatio')}
            value={formatPercent(snapshot.breakEven.targetMaterialCostRatio)}
            hint={t('summary.targetMarginRatioHint')}
          />
          <Metric
            label={t('summary.materialsAndLabor')}
            value={formatPercent(snapshot.materialsAndLaborPercent)}
            hint={t('summary.materialsAndLaborHint')}
          />
        </div>

        {!snapshot.breakEven.isCalculable ? (
          <p className="mt-3 rounded-lg border border-border p-2 text-[10px] text-primary/60">
            {t('summary.breakEvenNotReachable')}
          </p>
        ) : !snapshot.hasForecastData ? (
          <p className="mt-3 rounded-lg border border-border p-2 text-[10px] text-primary/60">
            {t('summary.forecastNeedsUnits')}
          </p>
        ) : snapshot.negativeContribution ? (
          <p className="mt-3 rounded-lg border border-border p-2 text-[10px] font-medium text-primary">
            {t('summary.forecastNegativeContribution')}
          </p>
        ) : snapshot.coversBreakEven ? (
          <p className="mt-3 rounded-lg border border-border p-2 text-[10px] font-medium text-primary">
            {t('summary.forecastCovers')}
          </p>
        ) : (
          <p className="mt-3 rounded-lg border border-border p-2 text-[10px] font-medium text-primary">
            {t('summary.forecastShortfall', {
              amount: formatNumber(snapshot.breakEvenGap),
              currency: symbol,
            })}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-5">
          <div>
            <h2 className="border-b border-border pb-1 text-[12px] font-semibold">
              {t('summary.fixedCosts')}
            </h2>
            <table className="mt-2 w-full text-[10px]">
              <tbody>
                {fixedRows.map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-0.5 text-primary/60">{label}</td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrency(value, symbol)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border font-semibold">
                  <td className="pt-1.5">{t('common.total')}</td>
                  <td className="pt-1.5 text-end font-numeric">
                    {formatCurrency(snapshot.totalCashFixedCosts, symbol)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1 text-[8px] text-primary/45">
              {t('summary.depreciationExcluded')}
            </p>
          </div>

          <div>
            <h2 className="border-b border-border pb-1 text-[12px] font-semibold">
              {t('summary.menuEconomics')}
            </h2>
            <table className="mt-2 w-full text-[10px]">
              <tbody>
                <tr>
                  <td className="py-0.5 text-primary/60">
                    {t('summary.averagePrice')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(snapshot.menu.averageSellingPrice, symbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-primary/60">
                    {t('summary.averageCogs')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrencyPrecise(snapshot.menu.averageCogs, symbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-primary/60">
                    {t('summary.contributionMargin')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrencyPrecise(
                      snapshot.menu.averageContributionMargin,
                      symbol,
                    )}{' '}
                    ({formatRatioPercent(snapshot.menu.contributionMarginRatio)})
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-primary/60">
                    {t('menu.itemCount')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatNumber(snapshot.menu.itemCount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {state.menu.length > 0 ? (
          <div className="mt-4">
            <h2 className="border-b border-border pb-1 text-[12px] font-semibold">
              {t('summary.menuItems')}
            </h2>
            <table className="mt-2 w-full text-[10px]">
              <thead>
                <tr className="text-primary/50">
                  <th className="py-0.5 text-start font-medium">
                    {t('menu.name')}
                  </th>
                  <th className="py-0.5 text-start font-medium">
                    {t('menu.mode')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('menu.price')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('menu.expectedDailyUnits')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('summary.expectedDailyRevenue')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('menu.cogs')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('menu.margin')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.menu.map((item) => {
                  const economics = menuItemEconomics(
                    item,
                    state.suppliers,
                    vatSettings,
                  );
                  return (
                    <tr key={item.id}>
                      <td className="py-0.5">{item.name || '—'}</td>
                      <td className="py-0.5 text-primary/60">
                        {menuCostingModeLabel(
                          item.costingMode,
                          item.category,
                          t,
                        )}
                      </td>
                      <td className="py-0.5 text-end font-numeric">
                        {formatCurrency(item.sellingPrice, symbol)}
                      </td>
                      <td className="py-0.5 text-end font-numeric">
                        {formatNumber(item.expectedDailyUnits ?? 0)}
                      </td>
                      <td className="py-0.5 text-end font-numeric">
                        {formatCurrency(
                          item.sellingPrice * (item.expectedDailyUnits ?? 0),
                          symbol,
                        )}
                      </td>
                      <td className="py-0.5 text-end font-numeric">
                        {formatCurrencyPrecise(economics.cogs, symbol)}
                      </td>
                      <td className="py-0.5 text-end font-numeric">
                        {formatCurrencyPrecise(
                          economics.contributionMargin,
                          symbol,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {state.staffing.length > 0 ? (
          <div className="mt-4">
            <h2 className="border-b border-border pb-1 text-[12px] font-semibold">
              {t('summary.staffing')}
            </h2>
            <table className="mt-2 w-full text-[10px]">
              <thead>
                <tr className="text-primary/50">
                  <th className="py-0.5 text-start font-medium">
                    {t('expenses.roleName')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.headcount')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.monthlyPerEmployee')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.roleMonthly')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.staffing.map((role) => (
                  <tr key={role.id}>
                    <td className="py-0.5">{role.roleName || '—'}</td>
                    <td className="py-0.5 text-end font-numeric">{role.count}</td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrencyPrecise(employeeMonthlyCost(role), symbol)}
                    </td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrencyPrecise(roleMonthlyCost(role), symbol)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="pt-1 text-primary/60" colSpan={3}>
                    {t('summary.baseSalaries')}
                  </td>
                  <td className="pt-1 text-end font-numeric">
                    {formatCurrency(snapshot.baseSalaries, symbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-primary/60" colSpan={3}>
                    {t('expenses.basePayroll')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(snapshot.basePayroll, symbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-primary/60" colSpan={3}>
                    {t('expenses.insurance')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(snapshot.socialInsuranceAmount, symbol)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-primary/60" colSpan={3}>
                    {t('expenses.endOfService')}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(snapshot.endOfServiceAmount, symbol)}
                  </td>
                </tr>
                <tr className="font-semibold">
                  <td className="pt-1" colSpan={3}>
                    {t('expenses.loadedPayroll')}
                  </td>
                  <td className="pt-1 text-end font-numeric">
                    {formatCurrency(snapshot.loadedPayroll, symbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        {state.assets.length > 0 ? (
          <div className="mt-4">
            <h2 className="border-b border-border pb-1 text-[12px] font-semibold">
              {t('summary.assets')}
            </h2>
            <table className="mt-2 w-full text-[10px]">
              <thead>
                <tr className="text-primary/50">
                  <th className="py-0.5 text-start font-medium">
                    {t('expenses.assetName')}
                  </th>
                  <th className="py-0.5 text-start font-medium">
                    {t('expenses.assetCategory')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.purchasePrice')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.shippingInstallation')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.usefulLife')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.salvageValue')}
                  </th>
                  <th className="py-0.5 text-end font-medium">
                    {t('expenses.monthlyDepreciation')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="py-0.5">{asset.name || '—'}</td>
                    <td className="py-0.5 text-primary/60">
                      {t(ASSET_CATEGORY_KEYS[asset.category])}
                    </td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrency(asset.purchasePrice, symbol)}
                    </td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrency(asset.shippingInstallation, symbol)}
                    </td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatNumber(asset.usefulLifeYears)}
                    </td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrency(asset.salvageValue, symbol)}
                    </td>
                    <td className="py-0.5 text-end font-numeric">
                      {formatCurrencyPrecise(monthlyDepreciation(asset), symbol)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border font-semibold">
                  <td className="pt-1" colSpan={6}>
                    {t('expenses.totalAssetCost')} /{' '}
                    {t('expenses.monthlyDepreciation')}
                  </td>
                  <td className="pt-1 text-end font-numeric">
                    {formatCurrency(snapshot.assets.totalAssetCost, symbol)} /{' '}
                    {formatCurrencyPrecise(
                      snapshot.assets.totalMonthlyDepreciation,
                      symbol,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1 text-[8px] text-primary/45">
              {t('expenses.assetsFormula')}
            </p>
          </div>
        ) : null}

        <footer className="mt-6 border-t border-border pt-2 text-[9px] text-primary/45">
          {t('summary.printFooter')} · {TELEGRAM_URL}
        </footer>
      </section>

      {snapshot.projection ? (
        <section className="print-page">
          <header className="flex items-start justify-between gap-6 border-b border-border pb-3">
            <div>
              <h2 className="text-[18px] font-semibold">
                {t('summary.cashFlow')}
              </h2>
              <p className="mt-0.5 text-[9px] text-primary/55">
                {t('summary.cashFlowHint')}
              </p>
            </div>
            <p className="text-[10px] text-primary/55">
              {state.settings.projectName || t('app.name')}
            </p>
          </header>

          <table className="mt-3 w-full text-[9px]">
            <thead>
              <tr className="border-b border-border text-primary/55">
                <th className="py-1 text-start font-medium">{t('summary.month')}</th>
                <th className="py-1 text-end font-medium">{t('summary.grossRevenue')}</th>
                <th className="py-1 text-end font-medium">{t('summary.vatPayable')}</th>
                <th className="py-1 text-end font-medium">{t('summary.netRevenue')}</th>
                <th className="py-1 text-end font-medium">{t('summary.cogs')}</th>
                <th className="py-1 text-end font-medium">{t('summary.fixed')}</th>
                <th className="py-1 text-end font-medium">{t('summary.netCash')}</th>
                <th className="py-1 text-end font-medium">{t('summary.closing')}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.projection.months.map((row) => (
                <tr key={row.month} className="border-b border-border/60">
                  <td className="py-0.5">{row.month}</td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.grossRevenue, symbol)}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.vatPayable, symbol)}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.projectedRevenue, symbol)}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.directCosts, symbol)}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.fixedCashCosts, symbol)}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.netCashFlow, symbol)}
                  </td>
                  <td className="py-0.5 text-end font-numeric">
                    {formatCurrency(row.closingBalance, symbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric
              label={t('summary.totalNetRevenue')}
              value={formatCurrency(
                snapshot.projection.summary.totalNetRevenue,
                symbol,
              )}
              hint={t('summary.totalVatPayable', {
                amount: formatCurrency(
                  snapshot.projection.summary.totalVatPayable,
                  symbol,
                ),
              })}
            />
            <Metric
              label={t('summary.endingBalance')}
              value={formatCurrency(
                snapshot.projection.summary.endingBankBalance,
                symbol,
              )}
            />
            <Metric
              label={t('summary.cashRunway')}
              value={
                snapshot.cashRunwayMonths === null
                  ? '—'
                  : snapshot.cashRunwayMonths === 0
                    ? t('summary.lessThanOneMonth')
                    : `${formatNumber(snapshot.cashRunwayMonths)} ${t('common.months')}`
              }
              hint={
                snapshot.cashRunwayMonths === null
                  ? t('summary.healthy')
                  : undefined
              }
            />
          </div>

          <footer className="mt-6 border-t border-border pt-2 text-[9px] text-primary/45">
            {t('summary.printFooter')}
          </footer>
        </section>
      ) : null}
    </div>,
    document.body,
  );
}
