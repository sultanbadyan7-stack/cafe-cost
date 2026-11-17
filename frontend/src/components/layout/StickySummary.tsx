import { ArrowRight, ChevronUp, Send } from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import {
  formatCurrency,
  formatPercent,
  healthTone,
} from '../../lib/format';
import { cn } from '../../lib/cn';
import { TELEGRAM_URL } from '../../lib/links';
import { Button } from '../common/Button';

function useSummaryValues() {
  const snapshot = useFinancialSnapshot();
  const { state } = useCalculator();
  const { t } = useI18n();
  return { snapshot, symbol: state.settings.currencySymbol, t };
}

function materialsMessageKey(
  band: ReturnType<typeof useFinancialSnapshot>['materialsAndLaborBand'],
) {
  switch (band) {
    case 'healthy':
      return 'summary.materialsHealthy' as const;
    case 'warning':
      return 'summary.materialsWarning' as const;
    case 'critical':
      return 'summary.materialsCritical' as const;
    default:
      return 'summary.materialsUnknown' as const;
  }
}

function TelegramCard() {
  const { t } = useI18n();
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-primary shadow-sm transition hover:border-accent/30 hover:bg-accent/5 focus-visible:outline-none focus-visible:shadow-focus"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
        <Send aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-body-medium font-medium">
          {t('summary.telegram')}
        </span>
        <span className="mt-0.5 block text-small text-primary/55">
          {t('summary.telegramHint')}
        </span>
      </span>
    </a>
  );
}

export function SummaryRail() {
  const { snapshot, symbol, t } = useSummaryValues();
  const { setTab } = useCalculator();

  return (
    <div className="sticky top-32 space-y-3">
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-small font-medium text-primary/55">
          {t('summary.requiredDailyRevenue')}
        </p>
        <p className="mt-2 font-numeric text-display text-primary">
          {formatCurrency(snapshot.requiredDailyRevenue, symbol)}
        </p>
        <p className="mt-1 text-small text-primary/50">
          {t('common.perDay')}
        </p>
        <p className="mt-3 text-small leading-5 text-primary/60">
          {t('summary.requiredDailyRevenueHint')}
        </p>

        {snapshot.hasBreakEven ? (
          <Button
            fullWidth
            className="mt-4"
            onClick={() => setTab('summary')}
            iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          >
            {t('summary.title')}
          </Button>
        ) : (
          <p className="mt-4 rounded-lg bg-warning-surface p-3 text-small text-warning">
            {t('summary.breakEvenNotReachable')}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <dl className="space-y-3 text-small">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-primary/55">{t('summary.monthlyBreakEven')}</dt>
            <dd className="font-numeric font-medium text-primary">
              {formatCurrency(snapshot.monthlyBreakEvenRevenue, symbol)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-primary/55">{t('summary.materialsAndLabor')}</dt>
            <dd
              className={cn(
                'font-numeric font-medium',
                healthTone(snapshot.materialsAndLaborBand),
              )}
            >
              {formatPercent(snapshot.materialsAndLaborPercent)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-primary/55">
              {t('summary.projectedDailyRevenue')}
            </dt>
            <dd className="font-numeric font-medium text-primary">
              {formatCurrency(snapshot.projectedDailyRevenue, symbol)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-border pt-3 text-legal leading-4 text-primary/50">
          {t(materialsMessageKey(snapshot.materialsAndLaborBand))}
        </p>
      </section>

      <TelegramCard />
    </div>
  );
}

export function MobileSummaryBar() {
  const { snapshot, symbol, t } = useSummaryValues();
  const { state, setTab } = useCalculator();

  if (state.tab === 'summary') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-content items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-legal font-medium text-primary/55">
            {t('summary.requiredDailyRevenue')}
          </p>
          <p className="font-numeric text-h3 leading-6 text-primary">
            {formatCurrency(snapshot.requiredDailyRevenue, symbol)}
            <span className="ms-1 text-small font-normal text-primary/50">
              / {t('common.perDay')}
            </span>
          </p>
        </div>
        <Button
          size="md"
          onClick={() => setTab('summary')}
          iconEnd={<ChevronUp aria-hidden="true" />}
          className="shrink-0"
        >
          {t('summary.title')}
        </Button>
      </div>
    </div>
  );
}
