import { useState } from 'react';
import { ArrowRight, Plus, Recycle, Receipt, Sparkles, Trash2 } from 'lucide-react';
import { totalCashFixedCosts } from '@shared/engine';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import { formatCurrency, formatNumber } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Button } from '../common/Button';
import { NumericInput, Select, TextInput } from '../common/Field';
import { PageHeader } from '../common/PageHeader';
import {
  ResponsiveField,
  RowGrid,
  TableHeaderRow,
} from '../common/ResponsiveField';
import { SectionCard } from '../common/SectionCard';
import { StatCard } from '../common/StatCard';

const CATEGORY_KEYS = {
  rent: 'expenses.category.rent',
  utilities: 'expenses.category.utilities',
  marketing: 'expenses.category.marketing',
  waste: 'expenses.category.waste',
  other: 'expenses.category.other',
} as const;

type ExpenseFilter = 'operating' | 'waste';

const FILTERS: readonly {
  id: ExpenseFilter;
  label: 'expenses.filter.operating' | 'expenses.filter.waste';
  icon: typeof Receipt;
}[] = [
  { id: 'operating', label: 'expenses.filter.operating', icon: Receipt },
  { id: 'waste', label: 'expenses.filter.waste', icon: Recycle },
];

export function ExpensesTab() {
  const {
    state,
    addExpense,
    updateExpense,
    removeExpense,
    loadExpensePresets,
    setTab,
  } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t } = useI18n();
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [filter, setFilter] = useState<ExpenseFilter>('operating');
  const { expenses, settings } = state;
  const symbol = settings.currencySymbol;

  const monthlyOperatingExpenses = totalCashFixedCosts({
    rent: snapshot.monthlyRent,
    loadedPayroll: 0,
    utilities: snapshot.monthlyUtilities,
    marketing: snapshot.monthlyMarketing,
    loanInstallment: 0,
    other: snapshot.monthlyOther,
  });

  const filteredExpenses = expenses.filter((expense) =>
    filter === 'waste'
      ? expense.category === 'waste'
      : expense.category !== 'waste',
  );

  const categoryOptions = (
    ['rent', 'utilities', 'marketing', 'waste', 'other'] as const
  ).map((value) => ({
    value,
    label: t(CATEGORY_KEYS[value]),
  }));

  const loadPreset = () => {
    loadExpensePresets();
    setPresetLoaded(true);
  };

  const handleAdd = () => {
    addExpense(filter === 'waste' ? 'waste' : 'other');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('expenses.title')}
        description={t('expenses.subtitle')}
        action={
          <Button
            variant="secondary"
            size="md"
            onClick={loadPreset}
            iconStart={<Sparkles aria-hidden="true" />}
          >
            {t('common.loadPreset')}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('expenses.monthlyTotal')}
          value={formatCurrency(monthlyOperatingExpenses, symbol)}
        />
        <StatCard
          label={t('expenses.monthlyWaste')}
          value={formatCurrency(snapshot.monthlyWaste, symbol)}
          hint={t('expenses.monthlyWasteHint')}
        />
        <StatCard
          label={t('expenses.loadedPayroll')}
          value={formatCurrency(snapshot.loadedPayroll, symbol)}
          hint={t('expenses.payrollNote')}
        />
        <StatCard
          label={t('expenses.totalFixed')}
          value={formatCurrency(snapshot.totalCashFixedCosts, symbol)}
          tone="text-accent"
        />
      </div>

      <div
        role="tablist"
        aria-label={t('expenses.title')}
        className="scrollbar-none flex gap-2 overflow-x-auto pb-1"
      >
        {FILTERS.map(({ id, label, icon: Icon }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(id)}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-small-medium transition',
                'focus-visible:outline-none focus-visible:shadow-focus',
                active
                  ? 'border-strong bg-strong text-white'
                  : 'border-border bg-surface text-primary/65 hover:border-accent/40 hover:text-primary',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {t(label)}
            </button>
          );
        })}
      </div>

      <SectionCard
        id="expenses-list"
        title={
          filter === 'waste'
            ? t('expenses.wasteTitle')
            : t('expenses.operatingTitle')
        }
        description={t('expenses.presetHint')}
        icon={
          filter === 'waste' ? (
            <Recycle aria-hidden="true" className="size-4" />
          ) : (
            <Receipt aria-hidden="true" className="size-4" />
          )
        }
        action={
          <Button
            size="sm"
            onClick={handleAdd}
            iconStart={<Plus aria-hidden="true" />}
          >
            {t('expenses.add')}
          </Button>
        }
        bodyClassName="p-3 sm:p-5"
      >
        {presetLoaded ? (
          <p className="mb-3 rounded-lg bg-success-surface p-2.5 text-small text-success">
            {t('common.presetLoaded')}
          </p>
        ) : null}

        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-background text-primary/40">
              {filter === 'waste' ? (
                <Recycle aria-hidden="true" className="size-6" />
              ) : (
                <Receipt aria-hidden="true" className="size-6" />
              )}
            </span>
            <div>
              <p className="text-h3 text-primary">
                {filter === 'waste'
                  ? t('expenses.emptyWasteTitle')
                  : t('expenses.emptyTitle')}
              </p>
              <p className="mt-1 max-w-sm text-small text-primary/55">
                {filter === 'waste'
                  ? t('expenses.emptyWasteBody')
                  : t('expenses.emptyBody')}
              </p>
            </div>
            <Button
              size="md"
              onClick={handleAdd}
              iconStart={<Plus aria-hidden="true" />}
            >
              {t('expenses.add')}
            </Button>
          </div>
        ) : (
          <div>
            <TableHeaderRow className="sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <span>{t('expenses.name')}</span>
              <span>{t('expenses.category')}</span>
              <span>{t('expenses.amount')}</span>
              <span className="w-9" aria-hidden="true" />
            </TableHeaderRow>

            <div className="divide-y divide-border sm:divide-y-0">
              {filteredExpenses.map((expense) => (
                <RowGrid
                  key={expense.id}
                  className="sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <ResponsiveField
                    label={t('expenses.name')}
                    htmlFor={`expense-name-${expense.id}`}
                  >
                    <TextInput
                      id={`expense-name-${expense.id}`}
                      value={expense.name}
                      placeholder={t('expenses.namePlaceholder')}
                      onChange={(event) =>
                        updateExpense(expense.id, {
                          name: event.target.value,
                        })
                      }
                    />
                  </ResponsiveField>

                  <ResponsiveField
                    label={t('expenses.category')}
                    htmlFor={`expense-category-${expense.id}`}
                  >
                    <Select
                      id={`expense-category-${expense.id}`}
                      value={expense.category}
                      options={categoryOptions}
                      onChange={(value) =>
                        updateExpense(expense.id, {
                          category: value as typeof expense.category,
                        })
                      }
                    />
                  </ResponsiveField>

                  <ResponsiveField
                    label={t('expenses.amount')}
                    htmlFor={`expense-amount-${expense.id}`}
                  >
                    <NumericInput
                      id={`expense-amount-${expense.id}`}
                      value={expense.amount}
                      onChange={(value) =>
                        updateExpense(expense.id, { amount: value })
                      }
                      suffix={symbol}
                    />
                  </ResponsiveField>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(expense.id)}
                      aria-label={t('expenses.remove')}
                      title={t('expenses.remove')}
                      className="text-danger hover:bg-danger-surface"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </RowGrid>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-primary/55">
          {formatNumber(filteredExpenses.length)} ·{' '}
          {filter === 'waste'
            ? t('expenses.wasteTitle')
            : t('expenses.operatingTitle')}
        </p>
        <Button
          size="lg"
          onClick={() => setTab('staff')}
          iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          className="w-full sm:w-auto"
        >
          {t('expenses.next')}
        </Button>
      </div>
    </div>
  );
}
