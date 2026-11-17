import {
  BarChart3,
  Building2,
  Coffee,
  Package,
  Receipt,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { TranslationKey } from '@i18n/index';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/cn';
import type { AppTab } from '../../types/app';

interface TabDefinition {
  id: AppTab;
  label: TranslationKey;
  hint: TranslationKey;
  icon: LucideIcon;
}

const TABS: readonly TabDefinition[] = [
  { id: 'general', label: 'nav.general', hint: 'nav.generalHint', icon: Settings2 },
  { id: 'menu', label: 'nav.menu', hint: 'nav.menuHint', icon: Coffee },
  { id: 'suppliers', label: 'nav.suppliers', hint: 'nav.suppliersHint', icon: Package },
  { id: 'expenses', label: 'nav.expenses', hint: 'nav.expensesHint', icon: Receipt },
  { id: 'staff', label: 'nav.staff', hint: 'nav.staffHint', icon: Users },
  { id: 'assets', label: 'nav.assets', hint: 'nav.assetsHint', icon: Building2 },
  { id: 'summary', label: 'nav.summary', hint: 'nav.summaryHint', icon: BarChart3 },
];

export function TabNav() {
  const { state, setTab } = useCalculator();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t('app.tagline')}
      className="border-b border-border bg-surface/95 backdrop-blur"
    >
      <div
        role="tablist"
        className="scrollbar-none mx-auto flex w-full max-w-content gap-1 overflow-x-auto px-2 sm:px-4"
      >
        {TABS.map(({ id, label, hint, icon: Icon }) => {
          const active = state.tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              title={t(hint)}
              onClick={() => setTab(id)}
              className={cn(
                'relative inline-flex min-h-12 shrink-0 items-center gap-2 rounded-t-md px-3 text-body-medium transition',
                'focus-visible:outline-none focus-visible:shadow-focus',
                active
                  ? 'text-accent'
                  : 'text-primary/60 hover:bg-background hover:text-primary',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span>{t(label)}</span>
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
