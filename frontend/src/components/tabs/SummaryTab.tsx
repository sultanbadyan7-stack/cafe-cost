import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Coffee,
  FileSpreadsheet,
  Printer,
  Receipt,
  Send,
  Users,
} from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  classifyMenuMargin,
  employeeMonthlyCost,
  menuItemEconomics,
  monthlyDepreciation,
  roleMonthlyCost,
} from '@shared/engine';
import { useCalculator } from '../../context/CalculatorContext';
import { useTheme } from '../../context/ThemeContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import { exportWorkspaceToExcel } from '../../lib/exports';
import { TELEGRAM_URL } from '../../lib/links';
import {
  ASSET_CATEGORY_KEYS,
  menuCategoryLabel,
  menuCostingModeLabel,
} from '../../lib/categories';
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatNumber,
  formatPercent,
  formatRatioPercent,
  healthTone,
} from '../../lib/format';
import { cn } from '../../lib/cn';
import { Accordion } from '../common/Accordion';
import { Button } from '../common/Button';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';

const MARGIN_DOT_CLASS = {
  healthy: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-danger',
  unknown: 'bg-disabled',
} as const;

/* Chart fills are literal colours, so they need an explicit dark palette. */
const PIE_COLORS = ['#0F172A', '#2563EB', '#15803D', '#B45309', '#B91C1C'];
const PIE_COLORS_DARK = ['#94A3B8', '#60A5FA', '#4ADE80', '#FBBF24', '#F87171'];

export function SummaryTab() {
  const { state } = useCalculator();
  const { isDark } = useTheme();
  const snapshot = useFinancialSnapshot();
  const { t, language } = useI18n();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const symbol = state.settings.currencySymbol;
  const vatSettings = {
    pricesIncludeVAT: state.settings.PricesIncludeVAT,
    vatRate: state.settings.VATRate,
  };
  const breakEven = snapshot.breakEven;

  const handleExport = async () => {
    setExporting(true);
    setExportError(false);
    try {
      await exportWorkspaceToExcel({
        state,
        snapshot,
        language,
        t,
      });
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const fixedRows: Array<[string, number]> = [
    [t('summary.rent'), snapshot.monthlyRent],
    [t('summary.payroll'), snapshot.loadedPayroll],
    [t('summary.utilities'), snapshot.monthlyUtilities],
    [t('summary.marketing'), snapshot.monthlyMarketing],
    [t('summary.waste'), snapshot.monthlyWaste],
    [t('summary.other'), snapshot.monthlyOther],
    [t('summary.loanInstallment'), snapshot.monthlyLoanInstallment],
  ];

  const pieData = [
    { name: t('summary.rent'), value: snapshot.monthlyRent },
    { name: t('summary.payroll'), value: snapshot.loadedPayroll },
    { name: t('summary.opex'), value: snapshot.monthlyOperatingExpenses },
    { name: t('summary.waste'), value: snapshot.monthlyWaste },
    { name: t('summary.loanInstallment'), value: snapshot.monthlyLoanInstallment },
  ].filter((entry) => entry.value > 0);

  const pieColors = isDark ? PIE_COLORS_DARK : PIE_COLORS;
  const chartSurface = 'rgb(var(--color-surface))';
  const chartBorder = 'rgb(var(--color-border))';
  const chartText = 'rgb(var(--color-primary))';

  return (
    <div id="summary-content" className="space-y-5">
      <PageHeader
        title={t('summary.title')}
        description={t('summary.subtitle')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.print()}
              iconStart={<Printer aria-hidden="true" />}
            >
              {t('summary.print')}
            </Button>
            <Button
              size="md"
              onClick={handleExport}
              loading={exporting}
              iconStart={<FileSpreadsheet aria-hidden="true" />}
            >
              {exporting ? t('summary.exporting') : t('summary.exportExcel')}
            </Button>
          </div>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-strong p-5 text-white shadow-rail sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-small font-medium text-white/65">
              {t('summary.targetVsForecast')}
            </p>
            <p className="mt-1 max-w-xl text-small text-white/55">
              {t('summary.targetVsForecastHint')}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-small font-medium text-white/80">
            <BarChart3 aria-hidden="true" className="size-3.5" />
            {t('summary.live')}
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-small font-medium text-white/65">
              {t('summary.requiredDailyRevenue')}
            </p>
            <p className="mt-2 break-words font-numeric text-display">
              {formatCurrency(snapshot.requiredDailyRevenue, symbol)}
            </p>
            <p className="mt-1 text-small text-white/60">
              {t('summary.requiredDailyRevenueHint')}
            </p>
            <p className="mt-2 text-legal text-white/50">
              {t('summary.monthlyBreakEven')}:{' '}
              {formatCurrency(snapshot.monthlyBreakEvenRevenue, symbol)}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-small font-medium text-white/65">
              {t('summary.projectedDailyRevenue')}
            </p>
            <p className="mt-2 break-words font-numeric text-display">
              {formatCurrency(snapshot.projectedDailyRevenue, symbol)}
            </p>
            <p className="mt-1 text-small text-white/60">
              {t('summary.projectedDailyRevenueHint')}
            </p>
            <p className="mt-2 text-legal text-white/50">
              {t('summary.projectedMonthlyRevenue')}:{' '}
              {formatCurrency(snapshot.projectedMonthlyRevenue, symbol)}
            </p>
            <p className="mt-1 text-legal text-white/50">
              {t('summary.projectedDailyGrossRevenue')}:{' '}
              {formatCurrency(snapshot.projectedDailyGrossRevenue, symbol)}
            </p>
            <p className="mt-1 text-legal text-white/50">
              {t('summary.vatOnSales')}:{' '}
              {formatCurrency(snapshot.projectedMonthlyVat, symbol)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-legal text-white/60">
              {t('summary.targetMaterialCostRatio')}
            </p>
            <p className="mt-1 font-numeric text-h3">
              {formatPercent(breakEven.targetMaterialCostRatio)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-legal text-white/60">
              {t('summary.targetMarginRatio')}
            </p>
            <p className="mt-1 font-numeric text-h3">
              {formatRatioPercent(breakEven.marginRatio)}
            </p>
            <p className="mt-0.5 text-legal text-white/50">
              {t('summary.targetMarginRatioHint')}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-legal text-white/60">
              {t('summary.materialsAndLabor')}
            </p>
            <p className="mt-1 font-numeric text-h3">
              {formatPercent(snapshot.materialsAndLaborPercent)}
            </p>
          </div>
        </div>
      </section>

      {!breakEven.isCalculable ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-surface p-4 text-body text-warning"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {t('summary.breakEvenNotReachable')}
        </p>
      ) : !snapshot.hasForecastData ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-border bg-background p-4 text-body text-primary/70"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-warning"
          />
          {t('summary.forecastNeedsUnits')}
        </p>
      ) : snapshot.negativeContribution ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-surface p-4 text-body font-medium text-danger"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {t('summary.forecastNegativeContribution')}
        </p>
      ) : snapshot.coversBreakEven ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-surface p-4 text-body font-medium text-success"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {t('summary.forecastCovers')}
        </p>
      ) : (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-surface p-4 text-body font-medium text-danger"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {t('summary.forecastShortfall', {
            amount: formatNumber(snapshot.breakEvenGap),
            currency: symbol,
          })}
        </p>
      )}

      {exportError ? (
        <p className="rounded-xl border border-danger/30 bg-danger-surface p-3 text-small text-danger">
          {t('summary.exportError')}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('summary.monthlyBreakEven')}
          value={formatCurrency(snapshot.monthlyBreakEvenRevenue, symbol)}
          hint={t('summary.monthlyBreakEvenHint')}
        />
        <StatCard
          label={t('summary.projectedMonthlyRevenue')}
          value={formatCurrency(snapshot.projectedMonthlyRevenue, symbol)}
          hint={t('summary.projectedMonthlyRevenueHint')}
        />
        <StatCard
          label={t('summary.targetMaterialCostRatio')}
          value={formatPercent(breakEven.targetMaterialCostRatio)}
          hint={t('summary.targetMarginRatioHint')}
        />
        <StatCard
          label={t('summary.fixedCosts')}
          value={formatCurrency(snapshot.totalCashFixedCosts, symbol)}
          hint={t('summary.fixedCostsHint')}
        />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-h3 text-primary">{t('summary.fixedPieTitle')}</h2>
            <p className="mt-0.5 text-small text-primary/55">
              {t('summary.fixedPieHint')}
            </p>
          </div>
          <span className="font-numeric text-body-medium font-semibold text-primary">
            {formatCurrency(snapshot.totalCashFixedCosts, symbol)}
          </span>
        </div>

        {pieData.length === 0 ? (
          <p className="mt-4 text-small text-primary/55">
            {t('summary.fixedPieEmpty')}
          </p>
        ) : (
          <div className="mt-2 h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value), symbol)
                  }
                  contentStyle={{
                    backgroundColor: chartSurface,
                    border: `1px solid ${chartBorder}`,
                    borderRadius: 8,
                    color: chartText,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: chartText }}
                  labelStyle={{ color: chartText, fontWeight: 600 }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: chartText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="space-y-3">
        <Accordion
          title={t('summary.fixedCosts')}
          description={t('summary.fixedCostsHint')}
          defaultOpen
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-body">
              <tbody>
                {fixedRows.map(([label, value]) => (
                  <tr key={label} className="border-b border-border/60 last:border-0">
                    <th scope="row" className="py-2 text-start font-normal text-primary/60">
                      {label}
                    </th>
                    <td className="py-2 text-end font-numeric text-primary">
                      {formatCurrency(value, symbol)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <th scope="row" className="py-2.5 text-start font-semibold text-primary">
                    {t('common.total')}
                  </th>
                  <td className="py-2.5 text-end font-numeric font-semibold text-primary">
                    {formatCurrency(snapshot.totalCashFixedCosts, symbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-legal text-primary/45">
            {t('summary.depreciationExcluded')}
          </p>
        </Accordion>

        <Accordion
          title={t('summary.menuEconomics')}
          description={t('menu.subtitle')}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-body">
              <thead>
                <tr className="border-b border-border text-small text-primary/55">
                  <th className="py-2 text-start font-medium">{t('menu.name')}</th>
                  <th className="py-2 text-start font-medium">{t('menu.mode')}</th>
                  <th className="py-2 text-end font-medium">{t('menu.price')}</th>
                  <th className="py-2 text-end font-medium">
                    {t('menu.expectedDailyUnits')}
                  </th>
                  <th className="py-2 text-end font-medium">
                    {t('summary.expectedDailyRevenue')}
                  </th>
                  <th className="py-2 text-end font-medium">{t('menu.cogs')}</th>
                  <th className="py-2 text-end font-medium">{t('menu.margin')}</th>
                </tr>
              </thead>
              <tbody>
                {state.menu.map((item) => {
                  const economics = menuItemEconomics(
                    item,
                    state.suppliers,
                    vatSettings,
                  );
                  const marginBand = classifyMenuMargin(
                    economics.contributionMarginRatio,
                    item.category,
                  );
                  return (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="py-2 text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <Coffee aria-hidden="true" className="size-3.5 text-primary/40" />
                          {item.name || '—'}
                        </span>
                        <span className="mt-0.5 block text-legal text-primary/45">
                          {menuCategoryLabel(item.category, t)}
                        </span>
                      </td>
                      <td className="py-2 text-primary/60">
                        {menuCostingModeLabel(
                          item.costingMode,
                          item.category,
                          t,
                        )}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrency(item.sellingPrice, symbol)}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatNumber(item.expectedDailyUnits ?? 0)}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrency(
                          item.sellingPrice * (item.expectedDailyUnits ?? 0),
                          symbol,
                        )}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrencyPrecise(economics.cogs, symbol)}
                      </td>
                      <td className="py-2 text-end font-numeric text-success">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'me-1 inline-block size-2 rounded-full align-middle',
                            MARGIN_DOT_CLASS[marginBand],
                          )}
                        />
                        {formatCurrencyPrecise(
                          economics.contributionMargin,
                          symbol,
                        )}{' '}
                        ({formatRatioPercent(economics.contributionMarginRatio)})
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border">
                  <th scope="row" className="py-2.5 text-start font-semibold">
                    {t('menu.averagePrice')}
                  </th>
                  <td className="py-2.5" />
                  <td className="py-2.5 text-end font-numeric font-semibold">
                    {formatCurrency(snapshot.menu.averageSellingPrice, symbol)}
                  </td>
                  <td className="py-2.5" />
                  <td className="py-2.5" />
                  <td className="py-2.5 text-end font-numeric font-semibold">
                    {formatCurrencyPrecise(snapshot.menu.averageCogs, symbol)}
                  </td>
                  <td className="py-2.5 text-end font-numeric font-semibold text-success">
                    {formatCurrencyPrecise(
                      snapshot.menu.averageContributionMargin,
                      symbol,
                    )}{' '}
                    ({formatRatioPercent(snapshot.menu.contributionMarginRatio)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Accordion>

        <Accordion
          title={t('summary.staffing')}
          description={t('expenses.staffingHint')}
        >
          {state.staffing.length === 0 ? (
            <p className="text-small text-primary/55">{t('expenses.emptyStaffing')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-body">
                <thead>
                  <tr className="border-b border-border text-small text-primary/55">
                    <th className="py-2 text-start font-medium">
                      {t('expenses.roleName')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.headcount')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.monthlyPerEmployee')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.roleMonthly')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.staffing.map((role) => (
                    <tr key={role.id} className="border-b border-border/60">
                      <td className="py-2 text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <Users aria-hidden="true" className="size-3.5 text-primary/40" />
                          {role.roleName || '—'}
                        </span>
                      </td>
                      <td className="py-2 text-end font-numeric">{role.count}</td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrencyPrecise(employeeMonthlyCost(role), symbol)}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrencyPrecise(roleMonthlyCost(role), symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-3 grid gap-2 rounded-lg bg-background p-3 text-small sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('summary.baseSalaries')}</dt>
              <dd className="font-numeric">
                {formatCurrency(snapshot.baseSalaries, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('summary.basePayroll')}</dt>
              <dd className="font-numeric font-medium">
                {formatCurrency(snapshot.basePayroll, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('summary.insurance')}</dt>
              <dd className="font-numeric">
                {formatCurrency(snapshot.socialInsuranceAmount, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('summary.endOfService')}</dt>
              <dd className="font-numeric">
                {formatCurrency(snapshot.endOfServiceAmount, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2 sm:col-span-2 sm:border-0 sm:pt-0">
              <dt className="font-medium text-primary">{t('summary.loadedPayroll')}</dt>
              <dd className="font-numeric font-semibold">
                {formatCurrency(snapshot.loadedPayroll, symbol)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-legal text-primary/45">
            {t('expenses.statutoryHint')}
          </p>
        </Accordion>

        <Accordion
          title={t('summary.assets')}
          description={t('expenses.assetsHint')}
        >
          {state.assets.length === 0 ? (
            <p className="text-small text-primary/55">{t('expenses.emptyAssets')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-body">
                <thead>
                  <tr className="border-b border-border text-small text-primary/55">
                    <th className="py-2 text-start font-medium">
                      {t('expenses.assetName')}
                    </th>
                    <th className="py-2 text-start font-medium">
                      {t('expenses.assetCategory')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.purchasePrice')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.shippingInstallation')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.usefulLife')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.salvageValue')}
                    </th>
                    <th className="py-2 text-end font-medium">
                      {t('expenses.monthlyDepreciation')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-border/60">
                      <td className="py-2 text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2
                            aria-hidden="true"
                            className="size-3.5 text-primary/40"
                          />
                          {asset.name || '—'}
                        </span>
                      </td>
                      <td className="py-2 text-primary/60">
                        {t(ASSET_CATEGORY_KEYS[asset.category])}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrency(asset.purchasePrice, symbol)}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrency(asset.shippingInstallation, symbol)}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatNumber(asset.usefulLifeYears)}
                      </td>
                      <td className="py-2 text-end font-numeric">
                        {formatCurrency(asset.salvageValue, symbol)}
                      </td>
                      <td className="py-2 text-end font-numeric text-accent">
                        {formatCurrencyPrecise(monthlyDepreciation(asset), symbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-3 grid gap-2 rounded-lg bg-background p-3 text-small sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('expenses.totalAssetCost')}</dt>
              <dd className="font-numeric font-medium">
                {formatCurrency(snapshot.assets.totalAssetCost, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">
                {t('expenses.monthlyDepreciation')}
              </dt>
              <dd className="font-numeric font-semibold text-accent">
                {formatCurrencyPrecise(
                  snapshot.assets.totalMonthlyDepreciation,
                  symbol,
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-legal text-primary/45">
            {t('expenses.assetsFormula')}
          </p>
        </Accordion>

        <Accordion
          title={t('summary.cashFlow')}
          description={t('summary.cashFlowHint')}
        >
          {snapshot.projection ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-body">
                  <thead>
                    <tr className="border-b border-border text-small text-primary/55">
                      <th className="py-2 text-start font-medium">
                        {t('summary.month')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.grossRevenue')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.vatPayable')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.netRevenue')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.cogs')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.fixed')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.netCash')}
                      </th>
                      <th className="py-2 text-end font-medium">
                        {t('summary.closing')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.projection.months.map((row) => (
                      <tr key={row.month} className="border-b border-border/60">
                        <td className="py-2 text-primary">{row.month}</td>
                        <td className="py-2 text-end font-numeric">
                          {formatCurrency(row.grossRevenue, symbol)}
                        </td>
                        <td className="py-2 text-end font-numeric text-primary/60">
                          {formatCurrency(row.vatPayable, symbol)}
                        </td>
                        <td className="py-2 text-end font-numeric">
                          {formatCurrency(row.projectedRevenue, symbol)}
                        </td>
                        <td className="py-2 text-end font-numeric">
                          {formatCurrency(row.directCosts, symbol)}
                        </td>
                        <td className="py-2 text-end font-numeric">
                          {formatCurrency(row.fixedCashCosts, symbol)}
                        </td>
                        <td
                          className={cn(
                            'py-2 text-end font-numeric',
                            row.netCashFlow >= 0 ? 'text-success' : 'text-danger',
                          )}
                        >
                          {formatCurrency(row.netCashFlow, symbol)}
                        </td>
                        <td className="py-2 text-end font-numeric">
                          {formatCurrency(row.closingBalance, symbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
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
                <StatCard
                  label={t('summary.endingBalance')}
                  value={formatCurrency(
                    snapshot.projection.summary.endingBankBalance,
                    symbol,
                  )}
                />
                <StatCard
                  label={t('summary.minBalance')}
                  value={formatCurrency(
                    snapshot.projection.summary.minimumClosingBalance,
                    symbol,
                  )}
                />
                <StatCard
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
                      : snapshot.cashRunwayMonths === 0
                        ? t('summary.runwayNegativeHint')
                        : undefined
                  }
                  tone={healthTone(snapshot.cashRunwayBand)}
                />
              </div>
            </>
          ) : (
            <p className="text-small text-primary/55">{t('summary.pendingHint')}</p>
          )}
        </Accordion>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <Send aria-hidden="true" className="size-4" />
          </span>
          <div>
            <p className="text-body-medium font-medium text-primary">
              {t('summary.telegram')}
            </p>
            <p className="mt-0.5 text-small text-primary/55">
              {t('summary.telegramHint')}
            </p>
            <p className="mt-1 text-legal text-primary/45">
              {t('summary.freeNote')}
            </p>
          </div>
        </div>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-body-medium font-medium text-primary transition hover:bg-background focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Send aria-hidden="true" className="size-4 text-accent" />
          {t('summary.telegram')}
        </a>
      </section>

      <p className="flex items-center gap-2 text-legal text-primary/45">
        <Receipt aria-hidden="true" className="size-3.5" />
        {t('app.disclaimer')}
      </p>
    </div>
  );
}
