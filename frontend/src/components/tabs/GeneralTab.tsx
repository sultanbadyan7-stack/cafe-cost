import {
  ArrowRight,
  CalendarClock,
  Landmark,
  Percent,
  RotateCcw,
  Store,
  TrendingUp,
} from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import { CURRENCIES, currencyByCode } from '../../lib/currencies';
import { formatCurrency, formatPercent } from '../../lib/format';
import { Button } from '../common/Button';
import {
  Field,
  NumericInput,
  Select,
  Switch,
  TextInput,
} from '../common/Field';
import { PageHeader } from '../common/PageHeader';
import { SectionCard } from '../common/SectionCard';

export function GeneralTab() {
  const {
    state,
    updateSettings,
    changeCurrency,
    updateFinancing,
    updateCashFlow,
    updateRampUpMonth,
    resetWorkspace,
    setTab,
  } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t } = useI18n();
  const { settings, financing, cashFlow } = state;

  const currencyOptions = CURRENCIES.map((currency) => ({
    value: currency.code,
    label: `${currency.code} — ${currency.symbol}`,
  }));

  /* Preserve a legacy/custom code that predates the supported list. */
  if (!currencyByCode(settings.currencyCode)) {
    currencyOptions.unshift({
      value: settings.currencyCode,
      label: `${settings.currencyCode} — ${settings.currencySymbol}`,
    });
  }

  const handleCurrencyChange = (code: string) => {
    const currency = currencyByCode(code);
    changeCurrency(
      code,
      currency?.symbol ?? settings.currencySymbol,
      currency?.referenceRate ?? settings.exchangeRateToUSD,
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('general.title')} description={t('general.subtitle')} />

      <SectionCard
        id="general-identity"
        title={t('general.identity')}
        description={t('general.identityHint')}
        icon={<Store aria-hidden="true" className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="project-name"
            label={t('general.projectName')}
            className="sm:col-span-2"
          >
            <TextInput
              id="project-name"
              value={settings.projectName}
              placeholder={t('general.projectNamePlaceholder')}
              autoComplete="organization"
              onChange={(event) =>
                updateSettings({ projectName: event.target.value })
              }
            />
          </Field>

          <Field
            id="currency-code"
            label={t('common.currency')}
            hint={t('general.currencyHint')}
          >
            <Select
              id="currency-code"
              value={settings.currencyCode}
              options={currencyOptions}
              onChange={handleCurrencyChange}
            />
          </Field>

          <Field
            id="exchange-rate"
            label={t('general.exchangeRate')}
            hint={t('currency.disclaimer')}
          >
            <NumericInput
              id="exchange-rate"
              value={settings.exchangeRateToUSD}
              onChange={(value) =>
                changeCurrency(
                  settings.currencyCode,
                  settings.currencySymbol,
                  value,
                )
              }
              suffix={settings.currencyCode}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background p-3">
          <span className="text-small text-primary/55">
            {t('currency.preview')}
          </span>
          <span className="font-numeric text-body-medium font-semibold text-primary" dir="ltr">
            1 USD = {settings.exchangeRateToUSD} {settings.currencyCode}
          </span>
          <span className="rounded-md bg-surface px-2.5 py-1 font-numeric text-small font-medium text-primary">
            {formatCurrency(1, settings.currencySymbol)}
          </span>
        </div>
      </SectionCard>

      <SectionCard
        id="general-schedule"
        title={t('general.schedule')}
        icon={<CalendarClock aria-hidden="true" className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="hours-per-day" label={t('general.hoursPerDay')}>
            <NumericInput
              id="hours-per-day"
              value={settings.operatingHoursPerDay}
              onChange={(value) =>
                updateSettings({ operatingHoursPerDay: value })
              }
              suffix={t('common.hours')}
            />
          </Field>
          <Field id="days-per-week" label={t('general.daysPerWeek')}>
            <NumericInput
              id="days-per-week"
              value={settings.operatingDaysPerWeek}
              onChange={(value) =>
                updateSettings({ operatingDaysPerWeek: value })
              }
              suffix={t('common.days')}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        id="general-rates"
        title={t('general.rates')}
        description={t('general.ratesHint')}
        icon={<Percent aria-hidden="true" className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="social-insurance" label={t('general.socialInsurance')}>
            <NumericInput
              id="social-insurance"
              value={settings.socialInsuranceRate}
              onChange={(value) =>
                updateSettings({ socialInsuranceRate: value })
              }
              suffix="%"
            />
          </Field>
          <Field id="end-of-service" label={t('general.endOfService')}>
            <NumericInput
              id="end-of-service"
              value={settings.endOfServiceRate}
              onChange={(value) => updateSettings({ endOfServiceRate: value })}
              suffix="%"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        id="general-targets"
        title={t('general.targets')}
        description={t('general.targetsHint')}
        icon={<Percent aria-hidden="true" className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="target-material-cost-ratio"
            label={t('general.targetMaterialCostRatio')}
            hint={t('general.targetMaterialCostRatioHint')}
            required
          >
            <NumericInput
              id="target-material-cost-ratio"
              value={settings.TargetMaterialCostRatio}
              onChange={(value) =>
                updateSettings({
                  TargetMaterialCostRatio: Math.min(100, value),
                })
              }
              suffix="%"
            />
          </Field>

          <div className="flex flex-col justify-center rounded-lg bg-background p-3">
            <p className="text-small text-primary/55">
              {t('general.targetMarginRatio')}
            </p>
            <p className="mt-1 font-numeric text-h3 text-primary">
              {formatPercent(100 - settings.TargetMaterialCostRatio)}
            </p>
            <p className="mt-0.5 text-legal text-primary/45">
              {t('general.targetMarginRatioHint')}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="general-vat"
        title={t('general.vat')}
        description={t('general.vatHint')}
        icon={<Percent aria-hidden="true" className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="vat-rate" label={t('general.vatRate')}>
            <NumericInput
              id="vat-rate"
              value={settings.VATRate}
              onChange={(value) => updateSettings({ VATRate: value })}
              suffix="%"
            />
          </Field>
          <div className="flex flex-col justify-center gap-2">
            <Switch
              id="prices-include-vat"
              checked={settings.PricesIncludeVAT}
              onChange={(checked) =>
                updateSettings({ PricesIncludeVAT: checked })
              }
              label={t('general.pricesIncludeVat')}
              description={t('general.pricesIncludeVatHint')}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-2 rounded-lg bg-background p-3 text-small sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-primary/55">{t('general.netPrice')}</span>
            <span className="font-numeric font-medium text-primary">
              {formatCurrency(
                snapshot.menu.averageNetSellingPrice,
                settings.currencySymbol,
              )}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-primary/55">{t('general.vatPerTicket')}</span>
            <span className="font-numeric font-medium text-primary">
              {formatCurrency(
                snapshot.menu.averageVatAmount,
                settings.currencySymbol,
              )}
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="general-loan"
        title={t('general.loan')}
        description={t('general.loanHint')}
        icon={<Landmark aria-hidden="true" className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="loan-amount" label={t('general.loanAmount')}>
            <NumericInput
              id="loan-amount"
              value={financing.commercialLoanPrincipal}
              onChange={(value) =>
                updateFinancing({ commercialLoanPrincipal: value })
              }
              suffix={settings.currencySymbol}
            />
          </Field>
          <Field id="loan-interest" label={t('general.interestRate')}>
            <NumericInput
              id="loan-interest"
              value={financing.annualInterestRate}
              onChange={(value) =>
                updateFinancing({ annualInterestRate: value })
              }
              suffix="%"
            />
          </Field>
          <Field id="loan-term" label={t('general.termMonths')}>
            <NumericInput
              id="loan-term"
              value={financing.termMonths}
              onChange={(value) =>
                updateFinancing({ termMonths: Math.round(value) })
              }
              suffix={t('common.months')}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-background p-3">
          <span className="text-small text-primary/60">
            {t('general.monthlyInstallment')}
          </span>
          <span className="font-numeric text-body-medium font-semibold text-primary">
            {formatCurrency(
              snapshot.monthlyLoanInstallment,
              settings.currencySymbol,
            )}
          </span>
        </div>
      </SectionCard>

      <SectionCard
        id="general-demand"
        title={t('general.demand')}
        description={t('general.demandHint')}
        icon={<TrendingUp aria-hidden="true" className="size-4" />}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              updateCashFlow({
                rampUpPercent: cashFlow.rampUpPercent.map((value, index) =>
                  index >= 2 ? 100 : value,
                ),
              })
            }
          >
            {t('general.setSteady')}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="daily-target-customers"
            label={t('general.dailyTargetCustomers')}
          >
            <NumericInput
              id="daily-target-customers"
              value={cashFlow.dailyTargetCustomers}
              onChange={(value) =>
                updateCashFlow({ dailyTargetCustomers: value })
              }
            />
          </Field>
          <Field id="opening-cash" label={t('general.openingCash')}>
            <NumericInput
              id="opening-cash"
              value={cashFlow.openingLiquidCash}
              onChange={(value) =>
                updateCashFlow({ openingLiquidCash: value })
              }
              suffix={settings.currencySymbol}
            />
          </Field>
        </div>

        <div className="mt-4">
          <p className="text-body-medium font-medium text-primary">
            {t('general.rampUp')}
          </p>
          <p className="mt-0.5 text-small text-primary/55">
            {t('general.rampHint')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {cashFlow.rampUpPercent.map((value, index) => (
              <label
                key={index}
                className="flex flex-col gap-1 rounded-lg border border-border p-2"
              >
                <span className="text-legal font-medium text-primary/55">
                  {t('general.rampMonth', { n: index + 1 })}
                </span>
                <NumericInput
                  value={value}
                  onChange={(next) => updateRampUpMonth(index, next)}
                  suffix="%"
                />
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              if (window.confirm(t('general.resetConfirm'))) resetWorkspace();
            }}
            iconStart={<RotateCcw aria-hidden="true" />}
            className="text-danger hover:bg-danger-surface"
          >
            {t('general.reset')}
          </Button>
          <p className="mt-1 text-legal text-primary/45">{t('general.resetHint')}</p>
        </div>
        <Button
          size="lg"
          onClick={() => setTab('menu')}
          iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          className="w-full sm:w-auto"
        >
          {t('general.next')}
        </Button>
      </div>

    </div>
  );
}
