import { Trash2 } from 'lucide-react';
import {
  employeeMonthlyCost,
  roleMonthlyCost,
} from '@shared/engine';
import type { EmployeeRole } from '@shared/types';
import { useI18n } from '../../hooks/useI18n';
import { formatCurrencyPrecise } from '../../lib/format';
import { Button } from '../common/Button';
import { Field, NumericInput, TextInput } from '../common/Field';

interface EmployeeCostCardProps {
  role: EmployeeRole;
  symbol: string;
  onUpdate: (patch: Partial<Omit<EmployeeRole, 'id'>>) => void;
  onRemove: () => void;
}

interface MoneyField {
  key:
    | 'baseSalary'
    | 'housingAllowance'
    | 'transportAllowance'
    | 'medicalInsurance'
    | 'annualVisaCost'
    | 'annualFlightCost';
  label:
    | 'expenses.baseSalary'
    | 'expenses.housingAllowance'
    | 'expenses.transportAllowance'
    | 'expenses.medicalInsurance'
    | 'expenses.annualVisaCost'
    | 'expenses.annualFlightCost';
}

const MONEY_FIELDS: readonly MoneyField[] = [
  { key: 'baseSalary', label: 'expenses.baseSalary' },
  { key: 'housingAllowance', label: 'expenses.housingAllowance' },
  { key: 'transportAllowance', label: 'expenses.transportAllowance' },
  { key: 'medicalInsurance', label: 'expenses.medicalInsurance' },
  { key: 'annualVisaCost', label: 'expenses.annualVisaCost' },
  { key: 'annualFlightCost', label: 'expenses.annualFlightCost' },
];

export function EmployeeCostCard({
  role,
  symbol,
  onUpdate,
  onRemove,
}: EmployeeCostCardProps) {
  const { t } = useI18n();
  const monthlyPerEmployee = employeeMonthlyCost(role);
  const totalMonthlyRoleCost = roleMonthlyCost(role);

  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <Field
          id={`role-name-${role.id}`}
          label={t('expenses.roleName')}
          className="min-w-[10rem] flex-1"
        >
          <TextInput
            id={`role-name-${role.id}`}
            value={role.roleName}
            placeholder={t('expenses.roleNamePlaceholder')}
            onChange={(event) => onUpdate({ roleName: event.target.value })}
          />
        </Field>

        <Field
          id={`role-count-${role.id}`}
          label={t('expenses.headcount')}
          className="w-full sm:w-28"
        >
          <NumericInput
            id={`role-count-${role.id}`}
            value={role.count}
            onChange={(value) => onUpdate({ count: Math.round(value) })}
          />
        </Field>

        <div className="flex pb-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={t('expenses.roleRemove')}
            title={t('expenses.roleRemove')}
            className="text-danger hover:bg-danger-surface"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MONEY_FIELDS.map((field) => (
          <Field
            key={field.key}
            id={`role-${field.key}-${role.id}`}
            label={t(field.label)}
          >
            <NumericInput
              id={`role-${field.key}-${role.id}`}
              value={role[field.key]}
              onChange={(value) =>
                onUpdate({
                  [field.key]: value,
                } as Partial<Omit<EmployeeRole, 'id'>>)
              }
              suffix={symbol}
            />
          </Field>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-background p-3 sm:grid-cols-2">
        <div>
          <p className="text-small text-primary/55">
            {t('expenses.monthlyPerEmployee')}
          </p>
          <p className="mt-1 font-numeric text-h3 text-primary">
            {formatCurrencyPrecise(monthlyPerEmployee, symbol)}
          </p>
        </div>
        <div>
          <p className="text-small text-primary/55">
            {t('expenses.roleMonthly')}
          </p>
          <p className="mt-1 font-numeric text-h3 text-primary">
            {formatCurrencyPrecise(totalMonthlyRoleCost, symbol)}
          </p>
        </div>
      </div>

      <p className="mt-2 text-legal text-primary/45">
        {t('expenses.tcoHint')}
      </p>
    </article>
  );
}
