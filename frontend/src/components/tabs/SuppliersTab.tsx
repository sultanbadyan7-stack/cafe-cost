import { useState } from 'react';
import { ArrowRight, Package, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/cn';
import {
  INGREDIENT_UNITS,
  SUPPLIER_CATEGORIES,
  UNIT_KEYS,
  mergeCategoryNames,
  supplierCategoryLabel,
} from '../../lib/categories';
import { AddSupplierModal } from '../modals/AddSupplierModal';
import { Button } from '../common/Button';
import { NumericInput, Select, TextInput } from '../common/Field';
import { PageHeader } from '../common/PageHeader';
import {
  ResponsiveField,
  RowGrid,
  TableHeaderRow,
} from '../common/ResponsiveField';
import { SectionCard } from '../common/SectionCard';

const SUPPLIER_GRID =
  'sm:grid-cols-[minmax(11rem,1.5fr)_minmax(9rem,1fr)_minmax(11rem,1.3fr)_minmax(8rem,0.9fr)_minmax(6rem,0.6fr)_auto]';

export function SuppliersTab() {
  const {
    state,
    updateSupplier,
    removeSupplier,
    loadSupplierPresets,
    addCustomSupplierCategory,
    setTab,
  } = useCalculator();
  const { t } = useI18n();
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const { suppliers, settings } = state;

  const loadPreset = () => {
    loadSupplierPresets();
    setPresetLoaded(true);
  };

  /* Built-ins, saved custom categories, and any legacy category in use. */
  const categoryNames = mergeCategoryNames(
    SUPPLIER_CATEGORIES,
    state.customSupplierCategories,
    suppliers.map((supplier) => supplier.category),
  );

  const categoryOptions = categoryNames.map((value) => ({
    value,
    label: supplierCategoryLabel(value, t),
  }));

  const unitOptions = INGREDIENT_UNITS.map((value) => ({
    value,
    label: t(UNIT_KEYS[value]),
  }));

  const groups = categoryNames
    .map((category) => ({
      category,
      items: suppliers.filter(
        (supplier) =>
          supplier.category === category &&
          (filter === 'all' || filter === category),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const handleAddCategory = () => {
    const raw = window.prompt(t('suppliers.addCategoryPrompt'));
    if (!raw) return;
    const name = raw.trim();
    if (!name) return;

    const existing = categoryNames.find(
      (category) => category.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      setFilter(existing);
      return;
    }

    const added = addCustomSupplierCategory(name);
    if (added) setFilter(added);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('suppliers.title')}
        description={t('suppliers.subtitle')}
        action={
          <Button
            variant="secondary"
            size="md"
            onClick={loadPreset}
            iconStart={<Sparkles aria-hidden="true" />}
            className="whitespace-nowrap"
          >
            {t('common.loadPreset')}
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label={t('suppliers.filter')}
          className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1"
        >
          {(['all', ...categoryNames] as const).map((value) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(value)}
                className={cn(
                  'inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-small-medium transition',
                  'focus-visible:outline-none focus-visible:shadow-focus',
                  active
                    ? 'border-strong bg-strong text-white'
                    : 'border-border bg-surface text-primary/65 hover:border-accent/40 hover:text-primary',
                )}
              >
                {value === 'all'
                  ? t('suppliers.filter.all')
                  : supplierCategoryLabel(value, t)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddCategory}
          aria-label={t('suppliers.addCategory')}
          title={t('suppliers.addCategory')}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/30 bg-surface text-primary/70 transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>

      <SectionCard
        id="suppliers-list"
        title={t('suppliers.title')}
        description={t('suppliers.presetHint')}
        icon={<Package aria-hidden="true" className="size-4" />}
        action={
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            iconStart={<Plus aria-hidden="true" />}
            className="whitespace-nowrap"
          >
            {t('suppliers.add')}
          </Button>
        }
        bodyClassName="p-3 sm:p-5"
      >
        {presetLoaded ? (
          <p className="mb-3 rounded-lg bg-success-surface p-2.5 text-small text-success">
            {t('common.presetLoaded')}
          </p>
        ) : null}

        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-background text-primary/40">
              <Package aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-h3 text-primary">{t('suppliers.emptyTitle')}</p>
              <p className="mt-1 max-w-sm text-small text-primary/55">
                {t('suppliers.emptyBody')}
              </p>
            </div>
            <Button
              size="md"
              onClick={loadPreset}
              iconStart={<Sparkles aria-hidden="true" />}
              className="whitespace-nowrap"
            >
              {t('common.loadPreset')}
            </Button>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.category} className="mb-6 last:mb-0">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h3 className="text-body-medium font-semibold text-primary">
                    {supplierCategoryLabel(group.category, t)}
                  </h3>
                  <span className="shrink-0 whitespace-nowrap text-small text-primary/50">
                    {t('suppliers.count', { count: group.items.length })}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-full sm:min-w-[860px]">
                    <TableHeaderRow className={SUPPLIER_GRID}>
                      <span>{t('suppliers.name')}</span>
                      <span>{t('suppliers.category')}</span>
                      <span>{t('suppliers.package')}</span>
                      <span>{t('suppliers.price')}</span>
                      <span>{t('suppliers.waste')}</span>
                      <span className="w-9" aria-hidden="true" />
                    </TableHeaderRow>

                    <div className="divide-y divide-border sm:divide-y-0">
                      {group.items.map((supplier) => (
                        <RowGrid key={supplier.id} className={SUPPLIER_GRID}>
                          <ResponsiveField
                            label={t('suppliers.name')}
                            htmlFor={`supplier-name-${supplier.id}`}
                          >
                            <TextInput
                              id={`supplier-name-${supplier.id}`}
                              value={supplier.name}
                              placeholder={t('suppliers.namePlaceholder')}
                              onChange={(event) =>
                                updateSupplier(supplier.id, {
                                  name: event.target.value,
                                })
                              }
                            />
                          </ResponsiveField>

                          <ResponsiveField
                            label={t('suppliers.category')}
                            htmlFor={`supplier-category-${supplier.id}`}
                          >
                            <Select
                              id={`supplier-category-${supplier.id}`}
                              value={supplier.category}
                              options={categoryOptions}
                              onChange={(value) => {
                                updateSupplier(supplier.id, {
                                  category: value,
                                });
                                /* Keep the edited row visible if a category
                                   filter is active. */
                                setFilter(value);
                              }}
                            />
                          </ResponsiveField>

                          <ResponsiveField label={t('suppliers.package')}>
                            <div className="flex min-w-0 gap-2">
                              <div className="w-20 shrink-0">
                                <NumericInput
                                  value={supplier.packageQuantity}
                                  aria-label={t('suppliers.packageQuantity')}
                                  onChange={(value) =>
                                    updateSupplier(supplier.id, {
                                      packageQuantity: value,
                                    })
                                  }
                                />
                              </div>
                              <Select
                                value={supplier.packageUnit}
                                aria-label={t('suppliers.packageUnit')}
                                options={unitOptions}
                                onChange={(value) =>
                                  updateSupplier(supplier.id, {
                                    packageUnit:
                                      value as typeof supplier.packageUnit,
                                  })
                                }
                                className="min-w-0 flex-1"
                              />
                            </div>
                          </ResponsiveField>

                          <ResponsiveField
                            label={t('suppliers.price')}
                            htmlFor={`supplier-price-${supplier.id}`}
                          >
                            <NumericInput
                              id={`supplier-price-${supplier.id}`}
                              value={supplier.price}
                              onChange={(value) =>
                                updateSupplier(supplier.id, { price: value })
                              }
                              suffix={settings.currencySymbol}
                            />
                          </ResponsiveField>

                          <ResponsiveField
                            label={t('suppliers.waste')}
                            htmlFor={`supplier-waste-${supplier.id}`}
                          >
                            <NumericInput
                              id={`supplier-waste-${supplier.id}`}
                              value={supplier.wastePercentage}
                              onChange={(value) =>
                                updateSupplier(supplier.id, {
                                  wastePercentage: Math.max(
                                    0,
                                    Math.min(100, value),
                                  ),
                                })
                              }
                              suffix="%"
                            />
                          </ResponsiveField>

                          <div className="flex justify-end sm:pb-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSupplier(supplier.id)}
                              aria-label={t('suppliers.remove')}
                              title={t('suppliers.remove')}
                              className="text-danger hover:bg-danger-surface"
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                        </RowGrid>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <p className="mt-3 px-2 text-small text-primary/50">
              {t('suppliers.count', { count: suppliers.length })}
            </p>
            <p className="mt-1 px-2 text-legal text-primary/45">
              {t('suppliers.packageHint')}
            </p>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setTab('expenses')}
          iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          className="w-full whitespace-nowrap sm:w-auto"
        >
          {t('suppliers.next')}
        </Button>
      </div>

      {addOpen ? (
        <AddSupplierModal
          defaultCategory={filter !== 'all' ? filter : undefined}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  );
}
