import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Coffee,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  beanPriceAdjustment,
  classifyMenuMargin,
  massCoffeeBeanSuppliers,
  menuItemEconomics,
  recipeCostBreakdown,
  retailBeanCostBreakdown,
  RETAIL_BEANS_CATEGORY,
  supplierPricePerKilogram,
  unitDimension,
  unitToBaseFactor,
} from '@shared/engine';
import type { MenuItem, RecipeIngredient } from '@shared/types';
import { useCalculator } from '../../context/CalculatorContext';
import { useFinancialSnapshot } from '../../hooks/useFinancialSnapshot';
import { useI18n } from '../../hooks/useI18n';
import {
  MENU_CATEGORIES,
  INGREDIENT_UNITS,
  UNIT_KEYS,
  menuCategoryLabel,
  mergeCategoryNames,
} from '../../lib/categories';
import { cn } from '../../lib/cn';
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatNumber,
  formatRatioPercent,
} from '../../lib/format';
import { Button } from '../common/Button';
import { Field, NumericInput, Select, TextInput } from '../common/Field';
import { PageHeader } from '../common/PageHeader';
import { AddMenuItemModal } from '../modals/AddMenuItemModal';
import { SectionCard } from '../common/SectionCard';
import { StatCard } from '../common/StatCard';

function modeButtonClass(active: boolean): string {
  return cn(
    'min-h-9 rounded-md px-3 text-small font-medium transition focus-visible:outline-none focus-visible:shadow-focus',
    active
      ? 'bg-surface text-primary shadow-sm'
      : 'text-primary/55 hover:text-primary',
  );
}

const MARGIN_DOT_CLASS = {
  healthy: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-danger',
  unknown: 'bg-disabled',
} as const;

export function MenuTab() {
  const {
    state,
    updateMenuItem,
    removeMenuItem,
    loadMenuPresets,
    addCustomMenuCategory,
    setTab,
  } = useCalculator();
  const snapshot = useFinancialSnapshot();
  const { t } = useI18n();
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const { menu, suppliers, settings } = state;
  const symbol = settings.currencySymbol;
  const coffeeBeans = massCoffeeBeanSuppliers(suppliers);
  const vatSettings = {
    pricesIncludeVAT: settings.PricesIncludeVAT,
    vatRate: settings.VATRate,
  };

  const loadPreset = () => {
    loadMenuPresets();
    setPresetLoaded(true);
  };

  /* Built-ins, saved custom categories, and any legacy category in use. */
  const categoryNames = mergeCategoryNames(
    MENU_CATEGORIES,
    state.customMenuCategories,
    menu.map((item) => item.category),
  );

  const categoryOptions = categoryNames.map((value) => ({
    value,
    label: menuCategoryLabel(value, t),
  }));

  const unitOptions = INGREDIENT_UNITS.map((value) => ({
    value,
    label: t(UNIT_KEYS[value]),
  }));

  const supplierOptions = [
    { value: '', label: t('menu.selectSupplier') },
    ...suppliers.map((supplier) => {
      const pricePerKg =
        supplier.category === 'coffee'
          ? supplierPricePerKilogram(supplier)
          : 0;
      const beanPrice =
        pricePerKg > 0
          ? ` · ${formatCurrencyPrecise(pricePerKg, symbol)}/${t('units.kg')}`
          : '';
      return {
        value: supplier.id,
        label: `${supplier.name || t('suppliers.name')} (${supplier.packageLabel})${beanPrice}`,
      };
    }),
  ];

  const beanOptions = [
    { value: '', label: t('menu.selectBean') },
    ...coffeeBeans.map((bean) => ({
      value: bean.id,
      label: `${bean.name || t('suppliers.name')} (${bean.packageLabel})`,
    })),
  ];

  const beanOptionsFor = (beanId: string) => {
    if (beanId && !coffeeBeans.some((bean) => bean.id === beanId)) {
      return [...beanOptions, { value: beanId, label: t('menu.missingBean') }];
    }
    return beanOptions;
  };

  const beanHintFor = (beanId: string) => {
    const bean = coffeeBeans.find((entry) => entry.id === beanId);
    if (bean) {
      return t('menu.beanPricePerKg', {
        price: formatCurrencyPrecise(
          supplierPricePerKilogram(bean),
          symbol,
        ),
      });
    }
    if (beanId) return t('menu.beanMissing');
    return coffeeBeans.length === 0
      ? t('menu.noCoffeeBeans')
      : t('menu.beanPriceHint');
  };

  const groups = categoryNames
    .map((category) => ({
      category,
      items: menu.filter(
        (item) =>
          item.category === category &&
          (filter === 'all' || filter === category),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const handleAddCategory = () => {
    const raw = window.prompt(t('menu.addCategoryPrompt'));
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

    const added = addCustomMenuCategory(name);
    if (added) setFilter(added);
  };

  const updateIngredients = (
    item: MenuItem,
    ingredients: RecipeIngredient[],
  ) => {
    updateMenuItem(item.id, { ingredients });
  };

  const addIngredient = (item: MenuItem) => {
    const preferredSupplier =
      suppliers.find((supplier) => supplier.id === item.selectedBeanId) ??
      suppliers.find((supplier) => supplier.category === 'coffee') ??
      suppliers[0];
    updateIngredients(item, [
      ...item.ingredients,
      {
        supplierId: preferredSupplier?.id ?? '',
        quantityUsed: 0,
        unit: preferredSupplier?.packageUnit ?? 'g',
      },
    ]);
  };

  const updateIngredient = (
    item: MenuItem,
    index: number,
    patch: Partial<RecipeIngredient>,
  ) => {
    const linkedSupplier = patch.supplierId
      ? suppliers.find((supplier) => supplier.id === patch.supplierId)
      : null;

    updateMenuItem(item.id, {
      ingredients: item.ingredients.map((ingredient, position) => {
        if (position !== index) return ingredient;

        /* Changing the supplier keeps the physical quantity: 18 g becomes
           0.018 kg when the new package is priced per kilogram. */
        if (
          linkedSupplier &&
          patch.supplierId !== undefined &&
          patch.unit === undefined
        ) {
          const fromUnit = ingredient.unit;
          const toUnit = linkedSupplier.packageUnit;
          const quantityUsed =
            unitDimension(fromUnit) === unitDimension(toUnit)
              ? (ingredient.quantityUsed * unitToBaseFactor(fromUnit)) /
                unitToBaseFactor(toUnit)
              : ingredient.quantityUsed;
          return {
            ...ingredient,
            ...patch,
            unit: toUnit,
            quantityUsed,
          };
        }

        return { ...ingredient, ...patch };
      }),
      /* Keep the item-level bean selector in sync when a coffee line is
         changed directly inside the advanced recipe. */
      ...(linkedSupplier?.category === 'coffee'
        ? { selectedBeanId: linkedSupplier.id }
        : {}),
    });
  };

  const removeIngredient = (item: MenuItem, index: number) => {
    updateIngredients(
      item,
      item.ingredients.filter((_, position) => position !== index),
    );
  };

  /**
   * Links a menu row to one coffee supplier.
   *
   * Retail and simple items use the id directly. Advanced items also relink
   * every existing coffee ingredient line so the whole recipe follows the
   * chosen bean.
   */
  const handleBeanChange = (item: MenuItem, beanId: string) => {
    const bean = coffeeBeans.find((entry) => entry.id === beanId);
    const patch: Partial<Omit<MenuItem, 'id'>> = {
      selectedBeanId: beanId || undefined,
    };

    if (item.costingMode === 'advanced' && bean) {
      patch.ingredients = item.ingredients.map((ingredient) => {
        const supplier = suppliers.find(
          (entry) => entry.id === ingredient.supplierId,
        );
        return supplier?.category === 'coffee'
          ? { ...ingredient, supplierId: bean.id }
          : ingredient;
      });
    }

    updateMenuItem(item.id, patch);
  };

  const supplierOptionsFor = (supplierId: string) => {
    if (
      supplierId &&
      !suppliers.some((supplier) => supplier.id === supplierId)
    ) {
      return [
        ...supplierOptions,
        { value: supplierId, label: t('menu.missingSupplier') },
      ];
    }
    return supplierOptions;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('menu.title')}
        description={t('menu.subtitle')}
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
          label={t('menu.itemCount')}
          value={formatNumber(snapshot.menu.itemCount)}
          icon={<Coffee aria-hidden="true" className="size-4" />}
        />
        <StatCard
          label={t('menu.averagePrice')}
          value={formatCurrency(snapshot.menu.averageSellingPrice, symbol)}
        />
        <StatCard
          label={t('menu.averageCogs')}
          value={formatCurrencyPrecise(snapshot.menu.averageCogs, symbol)}
        />
        <StatCard
          label={t('menu.averageMargin')}
          value={formatCurrencyPrecise(
            snapshot.menu.averageContributionMargin,
            symbol,
          )}
          hint={formatRatioPercent(
            snapshot.menu.contributionMarginRatio,
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label={t('menu.filter')}
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
                  ? t('menu.filter.all')
                  : menuCategoryLabel(value, t)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddCategory}
          aria-label={t('menu.addCategory')}
          title={t('menu.addCategory')}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/30 bg-surface text-primary/70 transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>

      <SectionCard
        id="menu-list"
        title={t('menu.title')}
        description={t('menu.presetHint')}
        icon={<Coffee aria-hidden="true" className="size-4" />}
        action={
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            iconStart={<Plus aria-hidden="true" />}
          >
            {t('menu.add')}
          </Button>
        }
        bodyClassName="p-3 sm:p-5"
      >
        {presetLoaded ? (
          <p className="mb-3 rounded-lg bg-success-surface p-2.5 text-small text-success">
            {t('common.presetLoaded')}
          </p>
        ) : null}

        {menu.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-background text-primary/40">
              <Coffee aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-h3 text-primary">{t('menu.emptyTitle')}</p>
              <p className="mt-1 max-w-sm text-small text-primary/55">
                {t('menu.emptyBody')}
              </p>
            </div>
            <Button
              size="md"
              onClick={loadPreset}
              iconStart={<Sparkles aria-hidden="true" />}
            >
              {t('common.loadPreset')}
            </Button>
          </div>
        ) : (
          <div>
            {groups.length === 0 ? (
              <p className="rounded-lg border border-border bg-background p-6 text-center text-small text-primary/55">
                {t('menu.emptyFilter')}
              </p>
            ) : null}
            {groups.map((group) => (
              <div key={group.category} className="mb-6 last:mb-0">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h3 className="text-body-medium font-semibold text-primary">
                    {menuCategoryLabel(group.category, t)}
                  </h3>
                  <span className="text-small text-primary/50">
                    {t('menu.groupCount', { count: group.items.length })}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((item) => {
                    const isRetail = item.category === RETAIL_BEANS_CATEGORY;
                    const economics = menuItemEconomics(
                      item,
                      suppliers,
                      vatSettings,
                    );
                    const marginBand = classifyMenuMargin(
                      economics.contributionMarginRatio,
                      item.category,
                    );
                    const breakdown =
                      item.costingMode === 'advanced'
                        ? recipeCostBreakdown(item, suppliers)
                        : null;
                    const retailBreakdown = isRetail
                      ? retailBeanCostBreakdown(item, suppliers)
                      : null;
                    const itemHasCoffeeIngredient = item.ingredients.some(
                      (ingredient) => {
                        const supplier = suppliers.find(
                          (entry) => entry.id === ingredient.supplierId,
                        );
                        return supplier?.category === 'coffee';
                      },
                    );
                    const showBeanField =
                      !isRetail &&
                      (item.category === 'hot_drinks' ||
                        item.category === 'cold_drinks' ||
                        itemHasCoffeeIngredient);
                    const ingredientBeanId =
                      item.ingredients
                        .map((ingredient) =>
                          suppliers.find(
                            (supplier) =>
                              supplier.id === ingredient.supplierId,
                          ),
                        )
                        .find((supplier) => supplier?.category === 'coffee')
                        ?.id ?? '';
                    const beanValue = isRetail
                      ? item.selectedBeanId ??
                        retailBreakdown?.supplier?.id ??
                        ''
                      : item.selectedBeanId ?? ingredientBeanId;
                    const beanAdjustment = isRetail
                      ? 0
                      : beanPriceAdjustment(item, suppliers);
                    const beanMissing = Boolean(
                      item.selectedBeanId &&
                        !coffeeBeans.some(
                          (bean) => bean.id === item.selectedBeanId,
                        ),
                    );

                    return (
                      <article
                        key={item.id}
                        className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-4"
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          <Field
                            id={`menu-name-${item.id}`}
                            label={t('menu.name')}
                            className="min-w-[10rem] flex-1"
                          >
                            <TextInput
                              id={`menu-name-${item.id}`}
                              value={item.name}
                              placeholder={t('menu.namePlaceholder')}
                              onChange={(event) =>
                                updateMenuItem(item.id, {
                                  name: event.target.value,
                                })
                              }
                            />
                          </Field>

                          <Field
                            id={`menu-category-${item.id}`}
                            label={t('menu.category')}
                            className="w-full sm:w-44"
                          >
                            <Select
                              id={`menu-category-${item.id}`}
                              value={item.category}
                              options={categoryOptions}
                              onChange={(value) => {
                                updateMenuItem(item.id, {
                                  category: value,
                                });
                                /* Keep the edited row visible if a category
                                   filter is active. */
                                setFilter(value);
                              }}
                            />
                          </Field>

                          <Field
                            id={`menu-price-${item.id}`}
                            label={t('menu.price')}
                            className="w-full sm:w-36"
                          >
                            <NumericInput
                              id={`menu-price-${item.id}`}
                              value={item.sellingPrice}
                              onChange={(value) =>
                                updateMenuItem(item.id, {
                                  sellingPrice: value,
                                })
                              }
                              suffix={symbol}
                            />
                          </Field>

                          <Field
                            id={`menu-expected-units-${item.id}`}
                            label={t('menu.expectedDailyUnits')}
                            hint={t('menu.expectedDailyUnitsHint')}
                            className="w-full sm:w-56"
                          >
                            <NumericInput
                              id={`menu-expected-units-${item.id}`}
                              value={item.expectedDailyUnits ?? 0}
                              onChange={(value) =>
                                updateMenuItem(item.id, {
                                  expectedDailyUnits: value,
                                })
                              }
                              className="pe-4"
                            />
                          </Field>

                          <div className="flex pb-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMenuItem(item.id)}
                              aria-label={t('menu.remove')}
                              title={t('menu.remove')}
                              className="text-danger hover:bg-danger-surface"
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                          {isRetail ? (
                            <div>
                              <p className="mb-1 text-small font-medium text-primary/60">
                                {t('menu.retailBadge')}
                              </p>
                              <p className="max-w-sm text-small text-primary/55">
                                {t('menu.retailHint')}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="mb-1 text-small font-medium text-primary/60">
                                {t('menu.mode')}
                              </p>
                              <div
                                role="group"
                                aria-label={t('menu.mode')}
                                className="inline-flex rounded-lg border border-border bg-background p-0.5"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateMenuItem(item.id, {
                                      costingMode: 'simple',
                                    })
                                  }
                                  aria-pressed={item.costingMode === 'simple'}
                                  className={modeButtonClass(
                                    item.costingMode === 'simple',
                                  )}
                                >
                                  {t('menu.mode.simple')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateMenuItem(item.id, {
                                      costingMode: 'advanced',
                                    })
                                  }
                                  aria-pressed={item.costingMode === 'advanced'}
                                  className={modeButtonClass(
                                    item.costingMode === 'advanced',
                                  )}
                                >
                                  {t('menu.mode.advanced')}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="text-end">
                            <p className="text-legal text-primary/50">
                              {t('menu.cogs')}
                            </p>
                            <p className="font-numeric text-body-medium font-semibold text-primary">
                              {formatCurrencyPrecise(economics.cogs, symbol)}
                            </p>
                            <p className="text-legal text-success">
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'me-1 inline-block size-2 rounded-full align-middle',
                                  MARGIN_DOT_CLASS[marginBand],
                                )}
                              />
                              <span className="sr-only">
                                {t(
                                  (isRetail
                                    ? `menu.retailMarginBand.${marginBand}`
                                    : `menu.marginBand.${marginBand}`) as Parameters<
                                    typeof t
                                  >[0],
                                )}
                              </span>
                              {t('menu.margin')}:{' '}
                              {formatCurrencyPrecise(
                                economics.contributionMargin,
                                symbol,
                              )}{' '}
                              (
                              {formatRatioPercent(
                                economics.contributionMarginRatio,
                              )}
                              )
                            </p>
                          </div>
                        </div>

                        {isRetail && retailBreakdown ? (
                          <div className="mt-3 rounded-lg bg-background/60 p-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <Field
                                id={`menu-bean-${item.id}`}
                                label={t('menu.beanType')}
                                required
                                hint={beanHintFor(beanValue)}
                                error={
                                  beanMissing
                                    ? t('menu.beanMissing')
                                    : undefined
                                }
                              >
                                <Select
                                  id={`menu-bean-${item.id}`}
                                  value={beanValue}
                                  options={beanOptionsFor(beanValue)}
                                  invalid={beanMissing}
                                  onChange={(value) =>
                                    handleBeanChange(item, value)
                                  }
                                />
                              </Field>

                              <Field
                                id={`menu-bag-weight-${item.id}`}
                                label={t('menu.bagWeight')}
                                hint={t('menu.bagWeightHint')}
                              >
                                <NumericInput
                                  id={`menu-bag-weight-${item.id}`}
                                  value={item.bagWeightGrams ?? 0}
                                  onChange={(value) =>
                                    updateMenuItem(item.id, {
                                      bagWeightGrams: value,
                                    })
                                  }
                                  suffix={t('units.g')}
                                />
                              </Field>

                              <Field
                                id={`menu-packaging-${item.id}`}
                                label={t('menu.packagingCost')}
                                hint={t('menu.packagingCostHint')}
                              >
                                <NumericInput
                                  id={`menu-packaging-${item.id}`}
                                  value={item.packagingCost ?? 0}
                                  onChange={(value) =>
                                    updateMenuItem(item.id, {
                                      packagingCost: value,
                                    })
                                  }
                                  suffix={symbol}
                                />
                              </Field>

                              <div className="flex flex-col justify-center rounded-md border border-border bg-surface px-3 py-2">
                                <p className="text-small text-primary/55">
                                  {t('menu.retailFormula')}
                                </p>
                                <p className="mt-1 font-numeric text-body-medium font-semibold text-primary">
                                  {formatCurrencyPrecise(
                                    retailBreakdown.totalCost,
                                    symbol,
                                  )}
                                </p>
                              </div>
                            </div>

                            <dl className="mt-3 space-y-1.5 rounded-md border border-border bg-surface px-3 py-2 text-small">
                              <div className="flex items-center justify-between gap-3">
                                <dt className="text-primary/55">
                                  {t('menu.retailSupplier')}
                                </dt>
                                <dd className="font-medium text-primary">
                                  {retailBreakdown.supplier?.name ||
                                    t('menu.retailNoSupplier')}
                                </dd>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <dt className="text-primary/55">
                                  {t('menu.retailPricePerGram')}
                                </dt>
                                <dd className="font-numeric text-primary">
                                  {formatCurrencyPrecise(
                                    retailBreakdown.pricePerGram,
                                    symbol,
                                  )}
                                </dd>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <dt className="text-primary/55">
                                  {t('menu.retailBeanCost')}
                                </dt>
                                <dd className="font-numeric text-primary">
                                  {formatCurrencyPrecise(
                                    retailBreakdown.beanCost,
                                    symbol,
                                  )}
                                </dd>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <dt className="text-primary/55">
                                  {t('menu.packagingCost')}
                                </dt>
                                <dd className="font-numeric text-primary">
                                  {formatCurrencyPrecise(
                                    retailBreakdown.packagingCost,
                                    symbol,
                                  )}
                                </dd>
                              </div>
                              <div className="flex items-center justify-between gap-3 border-t border-border pt-1.5 font-semibold">
                                <dt>{t('menu.retailTotalCost')}</dt>
                                <dd className="font-numeric">
                                  {formatCurrencyPrecise(
                                    retailBreakdown.totalCost,
                                    symbol,
                                  )}
                                </dd>
                              </div>
                            </dl>

                            {/* Visible audit trail: supplier package → per gram
                                → bag cost → total. Keeps the retail math
                                explainable without opening a drawer. */}
                            <div className="mt-2 space-y-1 rounded-md border border-border bg-surface px-3 py-2 text-small">
                              {retailBreakdown.hasBeanPrice ? (
                                <>
                                  <p className="text-primary/60">
                                    {t('menu.retailPackageBreakdown', {
                                      price: formatCurrencyPrecise(
                                        retailBreakdown.supplierPackagePrice,
                                        symbol,
                                      ),
                                      grams: formatNumber(
                                        retailBreakdown.packageSizeGrams,
                                      ),
                                      rate: formatCurrencyPrecise(
                                        retailBreakdown.pricePerGram,
                                        symbol,
                                      ),
                                    })}
                                  </p>
                                  <p className="font-medium text-primary">
                                    {t('menu.retailBreakdown', {
                                      rate: formatCurrencyPrecise(
                                        retailBreakdown.pricePerGram,
                                        symbol,
                                      ),
                                      grams: formatNumber(
                                        item.bagWeightGrams ?? 0,
                                      ),
                                      beanCost: formatCurrencyPrecise(
                                        retailBreakdown.beanCost,
                                        symbol,
                                      ),
                                      packaging: formatCurrencyPrecise(
                                        retailBreakdown.packagingCost,
                                        symbol,
                                      ),
                                    })}
                                  </p>
                                </>
                              ) : (
                                <p className="text-warning">
                                  {t('menu.retailBreakdownMissing')}
                                </p>
                              )}
                            </div>

                            {retailBreakdown.totalCost >
                            economics.sellingPrice ? (
                              <p
                                role="alert"
                                className="mt-2 flex items-start gap-1.5 rounded-md border border-danger/40 bg-danger-surface p-3 text-small font-medium text-danger"
                              >
                                <AlertTriangle
                                  aria-hidden="true"
                                  className="mt-0.5 size-3.5 shrink-0"
                                />
                                {t('menu.retailLossWarning', {
                                  cogs: formatCurrencyPrecise(
                                    retailBreakdown.totalCost,
                                    symbol,
                                  ),
                                  price: formatCurrencyPrecise(
                                    economics.sellingPrice,
                                    symbol,
                                  ),
                                  loss: formatCurrencyPrecise(
                                    retailBreakdown.totalCost -
                                      economics.sellingPrice,
                                    symbol,
                                  ),
                                })}
                              </p>
                            ) : null}

                            {!retailBreakdown.hasBeanPrice ? (
                              <div className="mt-2 flex flex-col items-start gap-2 rounded-md border border-warning/30 bg-warning-surface p-3">
                                <p className="flex items-start gap-1.5 text-small text-warning">
                                  <AlertTriangle
                                    aria-hidden="true"
                                    className="mt-0.5 size-3.5 shrink-0"
                                  />
                                  {t('menu.retailNoSupplierHint')}
                                </p>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setTab('suppliers')}
                                >
                                  {t('menu.goToSuppliers')}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : item.costingMode === 'simple' ? (
                          <div className="mt-3 grid gap-3 rounded-lg bg-background/60 p-3 sm:grid-cols-2">
                            <Field
                              id={`menu-cogs-${item.id}`}
                              label={t('menu.cogsPercent')}
                            >
                              <NumericInput
                                id={`menu-cogs-${item.id}`}
                                value={item.estimatedCogsPercent}
                                onChange={(value) =>
                                  updateMenuItem(item.id, {
                                    estimatedCogsPercent: value,
                                  })
                                }
                                suffix="%"
                              />
                            </Field>

                            {showBeanField ? (
                              <Field
                                id={`menu-simple-bean-${item.id}`}
                                label={t('menu.beanTypeUsed')}
                                hint={
                                  beanMissing
                                    ? t('menu.beanMissing')
                                    : t('menu.beanSimpleHint')
                                }
                                error={
                                  beanMissing
                                    ? t('menu.beanMissing')
                                    : undefined
                                }
                              >
                                <Select
                                  id={`menu-simple-bean-${item.id}`}
                                  value={beanValue}
                                  options={beanOptionsFor(beanValue)}
                                  invalid={beanMissing}
                                  onChange={(value) =>
                                    handleBeanChange(item, value)
                                  }
                                />
                              </Field>
                            ) : null}

                            <div className="flex flex-col justify-center rounded-md border border-border bg-surface px-3 py-2 sm:col-span-2">
                              <p className="text-small text-primary/55">
                                {t('menu.simpleHint')}
                              </p>
                              <div className="mt-1 flex items-center justify-between gap-3 text-small">
                                <span className="text-primary/55">
                                  {t('menu.cogs')}
                                </span>
                                <span className="font-numeric font-medium text-primary">
                                  {formatCurrency(economics.cogs, symbol)}
                                </span>
                              </div>
                              {beanAdjustment !== 0 ? (
                                <p className="mt-1 text-legal text-primary/55">
                                  {t('menu.beanAdjustment', {
                                    amount: formatCurrencyPrecise(
                                      beanAdjustment,
                                      symbol,
                                    ),
                                  })}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-lg bg-background/60 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-body-medium font-medium text-primary">
                                  {t('menu.ingredients')}
                                </p>
                                <p className="text-small text-primary/55">
                                  {t('menu.advancedHint')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => addIngredient(item)}
                                disabled={suppliers.length === 0}
                                iconStart={<Plus aria-hidden="true" />}
                              >
                                {t('menu.addIngredient')}
                              </Button>
                            </div>

                            {showBeanField ? (
                              <Field
                                id={`menu-advanced-bean-${item.id}`}
                                label={t('menu.beanTypeUsed')}
                                hint={
                                  beanMissing
                                    ? t('menu.beanMissing')
                                    : t('menu.beanAdvancedHint')
                                }
                                error={
                                  beanMissing
                                    ? t('menu.beanMissing')
                                    : undefined
                                }
                                className="mt-3 max-w-sm"
                              >
                                <Select
                                  id={`menu-advanced-bean-${item.id}`}
                                  value={beanValue}
                                  options={beanOptionsFor(beanValue)}
                                  invalid={beanMissing}
                                  onChange={(value) =>
                                    handleBeanChange(item, value)
                                  }
                                />
                              </Field>
                            ) : null}

                            {suppliers.length === 0 ? (
                              <div className="mt-3 flex flex-col items-start gap-2 rounded-md border border-warning/30 bg-warning-surface p-3">
                                <p className="text-small text-warning">
                                  {t('menu.noSuppliers')}
                                </p>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setTab('suppliers')}
                                >
                                  {t('menu.goToSuppliers')}
                                </Button>
                              </div>
                            ) : item.ingredients.length === 0 ? (
                              <p className="mt-3 rounded-md border border-border bg-surface p-3 text-small text-primary/55">
                                {t('menu.noIngredients')}
                              </p>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {item.ingredients.map(
                                  (ingredient, index) => {
                                    const line = breakdown?.lines[index];
                                    return (
                                      <div
                                        key={`${item.id}-ingredient-${index}`}
                                        className="grid gap-2 rounded-md border border-border bg-surface p-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_auto] sm:items-end"
                                      >
                                        <Field
                                          label={t('menu.ingredientSupplier')}
                                        >
                                          <Select
                                            value={ingredient.supplierId}
                                            options={supplierOptionsFor(
                                              ingredient.supplierId,
                                            )}
                                            onChange={(value) => {
                                              updateIngredient(item, index, {
                                                supplierId: value,
                                              });
                                            }}
                                          />
                                        </Field>

                                        <Field
                                          label={t('menu.ingredientQuantity')}
                                        >
                                          <NumericInput
                                            value={ingredient.quantityUsed}
                                            onChange={(value) =>
                                              updateIngredient(item, index, {
                                                quantityUsed: value,
                                              })
                                            }
                                          />
                                        </Field>

                                        <Field label={t('menu.ingredientUnit')}>
                                          <Select
                                            value={ingredient.unit}
                                            options={unitOptions}
                                            onChange={(value) =>
                                              updateIngredient(item, index, {
                                                unit: value as typeof ingredient.unit,
                                              })
                                            }
                                          />
                                        </Field>

                                        <div className="min-w-0">
                                          <p className="text-small font-medium text-primary/60">
                                            {t('menu.ingredientCost')}
                                          </p>
                                          <p className="font-numeric text-body text-primary">
                                            {formatCurrencyPrecise(
                                              line?.cost ?? 0,
                                              symbol,
                                            )}
                                          </p>
                                          {line && line.wasteCost > 0 ? (
                                            <p className="font-numeric text-small text-primary/50">
                                              {t('menu.wasteIncluded')}: +
                                              {formatCurrencyPrecise(
                                                line.wasteCost,
                                                symbol,
                                              )}{' '}
                                              ({line.wasteRate}%)
                                            </p>
                                          ) : null}
                                        </div>

                                        <div className="flex justify-end">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              removeIngredient(item, index)
                                            }
                                            aria-label={t(
                                              'menu.ingredientRemove',
                                            )}
                                            title={t('menu.ingredientRemove')}
                                            className="text-danger hover:bg-danger-surface"
                                          >
                                            <Trash2 aria-hidden="true" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            )}

                            <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-small font-medium text-primary/60">
                                  {t('menu.recipeCost')}
                                </span>
                                <span className="font-numeric text-body-medium font-semibold text-primary">
                                  {formatCurrencyPrecise(
                                    economics.cogs,
                                    symbol,
                                  )}
                                </span>
                              </div>
                              {breakdown && breakdown.wasteCost > 0 ? (
                                <dl className="mt-1.5 space-y-0.5 border-t border-border pt-1.5 text-small text-primary/55">
                                  <div className="flex items-center justify-between gap-3">
                                    <dt>{t('menu.recipeBeforeWaste')}</dt>
                                    <dd className="font-numeric">
                                      {formatCurrencyPrecise(
                                        breakdown.baseCost,
                                        symbol,
                                      )}
                                    </dd>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <dt>{t('menu.wasteIncluded')}</dt>
                                    <dd className="font-numeric">
                                      +
                                      {formatCurrencyPrecise(
                                        breakdown.wasteCost,
                                        symbol,
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              ) : null}
                            </div>

                            {breakdown &&
                            (breakdown.missingSupplierCount > 0 ||
                              breakdown.incompatibleUnitCount > 0) ? (
                              <p className="mt-2 flex items-start gap-1.5 text-small text-warning">
                                <AlertTriangle
                                  aria-hidden="true"
                                  className="mt-0.5 size-3.5 shrink-0"
                                />
                                {t('menu.recipeWarning')}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="mt-3 px-2 text-small text-primary/50">
              {t('menu.cogsPercentHint')}
            </p>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setTab('suppliers')}
          iconEnd={<ArrowRight aria-hidden="true" className="icon-directional" />}
          className="w-full sm:w-auto"
        >
          {t('menu.next')}
        </Button>
      </div>

      {addOpen ? (
        <AddMenuItemModal
          defaultCategory={filter !== 'all' ? filter : undefined}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  );
}
