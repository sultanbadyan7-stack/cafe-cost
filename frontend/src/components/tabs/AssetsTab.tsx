import { ArrowRight } from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import { formatCurrency } from '../../lib/format';
import { AssetRegister } from '../assets/AssetRegister';
import { Button } from '../common/Button';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';

/** Standalone fixed-asset register and depreciation summary. */
export function AssetsTab() {
  const { state, setTab } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t } = useI18n();
  const symbol = state.settings.currencySymbol;

  return (
    <div className="space-y-5">
      <PageHeader title={t('assets.title')} description={t('assets.subtitle')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t('assets.totalCost')}
          value={formatCurrency(snapshot.assets.totalAssetCost, symbol)}
        />
        <StatCard
          label={t('assets.salvage')}
          value={formatCurrency(snapshot.assets.totalSalvageValue, symbol)}
        />
        <StatCard
          label={t('assets.depreciation')}
          value={formatCurrency(snapshot.assets.totalMonthlyDepreciation, symbol)}
          hint={t('assets.depreciationHint')}
        />
        <StatCard
          label={t('assets.bookValue')}
          value={formatCurrency(snapshot.assets.totalDepreciableBase, symbol)}
          tone="text-accent"
        />
      </div>

      <AssetRegister />

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setTab('summary')}
          iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          className="w-full sm:w-auto"
        >
          {t('assets.next')}
        </Button>
      </div>
    </div>
  );
}
