import { useState } from 'react';
import { ArrowRight, Plus, Sparkles, Users } from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import { formatCurrency } from '../../lib/format';
import { Button } from '../common/Button';
import { PageHeader } from '../common/PageHeader';
import { SectionCard } from '../common/SectionCard';
import { StatCard } from '../common/StatCard';
import { EmployeeCostCard } from '../staffing/EmployeeCostCard';

/**
 * Standalone staffing page. It owns the full cost-of-ownership editor that used
 * to live inside the Expenses tab.
 */
export function StaffTab() {
  const {
    state,
    addStaffingRole,
    updateStaffingRole,
    removeStaffingRole,
    loadStaffingPresets,
    setTab,
  } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t } = useI18n();
  const [presetLoaded, setPresetLoaded] = useState(false);
  const { staffing, settings } = state;
  const symbol = settings.currencySymbol;

  const loadStaffingPreset = () => {
    loadStaffingPresets();
    setPresetLoaded(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('staff.title')}
        description={t('staff.subtitle')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={loadStaffingPreset}
              iconStart={<Sparkles aria-hidden="true" />}
            >
              {t('expenses.loadStaffingPreset')}
            </Button>
            <Button
              size="md"
              onClick={addStaffingRole}
              iconStart={<Plus aria-hidden="true" />}
            >
              {t('expenses.addRole')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('expenses.baseSalaries')}
          value={formatCurrency(snapshot.baseSalaries, symbol)}
        />
        <StatCard
          label={t('expenses.basePayroll')}
          value={formatCurrency(snapshot.basePayroll, symbol)}
          hint={t('expenses.basePayrollHint')}
        />
        <StatCard
          label={t('expenses.insurance')}
          value={formatCurrency(snapshot.socialInsuranceAmount, symbol)}
        />
        <StatCard
          label={t('expenses.loadedPayroll')}
          value={formatCurrency(snapshot.loadedPayroll, symbol)}
          hint={t('expenses.payrollNote')}
          tone="text-accent"
        />
      </div>

      <SectionCard
        id="staffing-list"
        title={t('expenses.staffingTitle')}
        description={t('expenses.staffingHint')}
        icon={<Users aria-hidden="true" className="size-4" />}
        bodyClassName="p-3 sm:p-5"
      >
        {presetLoaded ? (
          <p className="mb-3 rounded-lg bg-success-surface p-2.5 text-small text-success">
            {t('common.presetLoaded')}
          </p>
        ) : null}

        {staffing.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-background text-primary/40">
              <Users aria-hidden="true" className="size-6" />
            </span>
            <p className="max-w-sm text-small text-primary/55">
              {t('expenses.emptyStaffing')}
            </p>
            <Button
              size="md"
              onClick={addStaffingRole}
              iconStart={<Plus aria-hidden="true" />}
            >
              {t('expenses.addRole')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {staffing.map((role) => (
              <EmployeeCostCard
                key={role.id}
                role={role}
                symbol={symbol}
                onUpdate={(patch) => updateStaffingRole(role.id, patch)}
                onRemove={() => removeStaffingRole(role.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <dl className="grid gap-2 text-small sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('expenses.baseSalaries')}</dt>
              <dd className="font-numeric text-primary">
                {formatCurrency(snapshot.baseSalaries, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('expenses.basePayroll')}</dt>
              <dd className="font-numeric font-medium text-primary">
                {formatCurrency(snapshot.basePayroll, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('expenses.insurance')}</dt>
              <dd className="font-numeric text-primary">
                {formatCurrency(snapshot.socialInsuranceAmount, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-primary/55">{t('expenses.endOfService')}</dt>
              <dd className="font-numeric text-primary">
                {formatCurrency(snapshot.endOfServiceAmount, symbol)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2 sm:col-span-2 sm:border-0 sm:pt-0">
              <dt className="font-medium text-primary">
                {t('expenses.loadedPayroll')}
              </dt>
              <dd className="font-numeric font-semibold text-primary">
                {formatCurrency(snapshot.loadedPayroll, symbol)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-legal text-primary/45">
            {t('expenses.payrollNote')}
          </p>
          <p className="mt-1 text-legal text-primary/45">
            {t('expenses.statutoryHint')}
          </p>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setTab('assets')}
          iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          className="w-full sm:w-auto"
        >
          {t('staff.next')}
        </Button>
      </div>
    </div>
  );
}
