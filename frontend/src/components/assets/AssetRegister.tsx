import { useState } from 'react';
import { Building2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { monthlyDepreciation } from '@shared/engine';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_KEYS,
  DEPRECIATION_METHODS,
  DEPRECIATION_METHOD_KEYS,
} from '../../lib/categories';
import { formatCurrency, formatCurrencyPrecise } from '../../lib/format';
import { AddAssetModal } from '../modals/AddAssetModal';
import { Button } from '../common/Button';
import { NumericInput, Select, TextInput } from '../common/Field';
import {
  ResponsiveField,
  RowGrid,
  TableHeaderRow,
} from '../common/ResponsiveField';
import { SectionCard } from '../common/SectionCard';

const ASSET_GRID =
  'sm:grid-cols-[minmax(11rem,1.5fr)_minmax(9rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(6rem,0.7fr)_minmax(8rem,1fr)_minmax(9rem,1fr)_minmax(8rem,0.9fr)_auto]';

export function AssetRegister() {
  const {
    state,
    updateAsset,
    removeAsset,
    loadAssetPresets,
  } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t } = useI18n();
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { assets, settings } = state;
  const symbol = settings.currencySymbol;

  const categoryOptions = ASSET_CATEGORIES.map((value) => ({
    value,
    label: t(ASSET_CATEGORY_KEYS[value]),
  }));

  const methodOptions = DEPRECIATION_METHODS.map((value) => ({
    value,
    label: t(DEPRECIATION_METHOD_KEYS[value]),
  }));

  const loadPreset = () => {
    loadAssetPresets();
    setPresetLoaded(true);
  };

  return (
    <>
      <SectionCard
        id="assets-list"
      title={t('expenses.assetsTitle')}
      description={t('expenses.assetsHint')}
      icon={<Building2 aria-hidden="true" className="size-4" />}
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadPreset}
            iconStart={<Sparkles aria-hidden="true" />}
            className="whitespace-nowrap"
          >
            {t('expenses.loadAssetPreset')}
          </Button>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            iconStart={<Plus aria-hidden="true" />}
            className="whitespace-nowrap"
          >
            {t('expenses.addAsset')}
          </Button>
        </div>
      }
      bodyClassName="p-3 sm:p-5"
    >
      {presetLoaded ? (
        <p className="mb-3 rounded-lg bg-success-surface p-2.5 text-small text-success">
          {t('common.presetLoaded')}
        </p>
      ) : null}

      {assets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-background text-primary/40">
            <Building2 aria-hidden="true" className="size-6" />
          </span>
          <p className="max-w-sm text-small text-primary/55">
            {t('expenses.emptyAssets')}
          </p>
          <Button
            size="md"
            onClick={loadPreset}
            iconStart={<Sparkles aria-hidden="true" />}
            className="whitespace-nowrap"
          >
            {t('expenses.loadAssetPreset')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-x-auto">
            <div className="min-w-full sm:min-w-[1040px]">
              <TableHeaderRow className={ASSET_GRID}>
                <span>{t('expenses.assetName')}</span>
                <span>{t('expenses.assetCategory')}</span>
                <span>{t('expenses.purchasePrice')}</span>
                <span>{t('expenses.shippingInstallation')}</span>
                <span>{t('expenses.usefulLife')}</span>
                <span>{t('expenses.salvageValue')}</span>
                <span>{t('expenses.depreciationMethod')}</span>
                <span className="text-end">
                  {t('expenses.monthlyDepreciation')}
                </span>
                <span className="w-9" aria-hidden="true" />
              </TableHeaderRow>

              <div className="divide-y divide-border sm:divide-y-0">
                {assets.map((asset) => (
                  <RowGrid key={asset.id} className={ASSET_GRID}>
                    <ResponsiveField
                      label={t('expenses.assetName')}
                      htmlFor={`asset-name-${asset.id}`}
                    >
                      <TextInput
                        id={`asset-name-${asset.id}`}
                        value={asset.name}
                        placeholder={t('expenses.assetNamePlaceholder')}
                        onChange={(event) =>
                          updateAsset(asset.id, {
                            name: event.target.value,
                          })
                        }
                      />
                    </ResponsiveField>

                    <ResponsiveField
                      label={t('expenses.assetCategory')}
                      htmlFor={`asset-category-${asset.id}`}
                    >
                      <Select
                        id={`asset-category-${asset.id}`}
                        value={asset.category}
                        options={categoryOptions}
                        onChange={(value) =>
                          updateAsset(asset.id, {
                            category: value as typeof asset.category,
                          })
                        }
                      />
                    </ResponsiveField>

                    <ResponsiveField
                      label={t('expenses.purchasePrice')}
                      htmlFor={`asset-purchase-${asset.id}`}
                    >
                      <NumericInput
                        id={`asset-purchase-${asset.id}`}
                        value={asset.purchasePrice}
                        onChange={(value) =>
                          updateAsset(asset.id, { purchasePrice: value })
                        }
                        suffix={symbol}
                      />
                    </ResponsiveField>

                    <ResponsiveField
                      label={t('expenses.shippingInstallation')}
                      htmlFor={`asset-shipping-${asset.id}`}
                    >
                      <NumericInput
                        id={`asset-shipping-${asset.id}`}
                        value={asset.shippingInstallation}
                        onChange={(value) =>
                          updateAsset(asset.id, {
                            shippingInstallation: value,
                          })
                        }
                        suffix={symbol}
                      />
                    </ResponsiveField>

                    <ResponsiveField
                      label={t('expenses.usefulLife')}
                      htmlFor={`asset-life-${asset.id}`}
                    >
                      <NumericInput
                        id={`asset-life-${asset.id}`}
                        value={asset.usefulLifeYears}
                        onChange={(value) =>
                          updateAsset(asset.id, { usefulLifeYears: value })
                        }
                        suffix={t('common.years')}
                      />
                    </ResponsiveField>

                    <ResponsiveField
                      label={t('expenses.salvageValue')}
                      htmlFor={`asset-salvage-${asset.id}`}
                    >
                      <NumericInput
                        id={`asset-salvage-${asset.id}`}
                        value={asset.salvageValue}
                        onChange={(value) =>
                          updateAsset(asset.id, { salvageValue: value })
                        }
                        suffix={symbol}
                      />
                    </ResponsiveField>

                    <ResponsiveField
                      label={t('expenses.depreciationMethod')}
                      htmlFor={`asset-method-${asset.id}`}
                    >
                      <Select
                        id={`asset-method-${asset.id}`}
                        value={asset.depreciationMethod}
                        options={methodOptions}
                        onChange={(value) =>
                          updateAsset(asset.id, {
                            depreciationMethod:
                              value as typeof asset.depreciationMethod,
                          })
                        }
                      />
                    </ResponsiveField>

                    <div className="flex min-w-0 flex-col gap-1.5 sm:justify-end sm:pb-2">
                      <span className="text-small font-medium text-primary/60 sm:sr-only">
                        {t('expenses.monthlyDepreciation')}
                      </span>
                      <span className="truncate font-numeric text-body font-medium text-primary sm:text-end">
                        {formatCurrencyPrecise(
                          monthlyDepreciation(asset),
                          symbol,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-end sm:pb-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAsset(asset.id)}
                        aria-label={t('expenses.assetRemove')}
                        title={t('expenses.assetRemove')}
                        className="text-danger hover:bg-danger-surface"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </RowGrid>
                ))}
              </div>
            </div>

            <p className="mt-2 text-legal text-primary/45">
              {t('expenses.assetsNonCash')}
            </p>
          </div>

          <aside className="rounded-xl border border-border bg-background p-4">
            <h3 className="text-body-medium font-semibold text-primary">
              {t('expenses.assetsSummary')}
            </h3>
            <dl className="mt-3 space-y-3 text-small">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-primary/55">
                  {t('expenses.totalAssetCost')}
                </dt>
                <dd className="font-numeric font-semibold text-primary">
                  {formatCurrency(snapshot.assets.totalAssetCost, symbol)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
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
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <dt className="text-primary/55">
                  {t('expenses.annualDepreciation')}
                </dt>
                <dd className="font-numeric text-primary">
                  {formatCurrency(
                    snapshot.assets.totalAnnualDepreciation,
                    symbol,
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-legal text-primary/45">
              {t('expenses.assetsFormula')}
            </p>
          </aside>
        </div>
      )}
      </SectionCard>

      {addOpen ? <AddAssetModal onClose={() => setAddOpen(false)} /> : null}
    </>
  );
}
