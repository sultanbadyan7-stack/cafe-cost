import { useState } from 'react';
import {
  massCoffeeBeanSuppliers,
  RETAIL_BEANS_CATEGORY,
  supplierPricePerKilogram,
} from '@shared/engine';
import type { MenuItem } from '@shared/types';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import {
  MENU_CATEGORIES,
  mergeCategoryNames,
  menuCategoryLabel,
} from '../../lib/categories';
import { createMenuItem } from '../../lib/defaults';
import { formatCurrencyPrecise } from '../../lib/format';
import { Button } from '../common/Button';
import { Field, NumericInput, Select, TextInput } from '../common/Field';
import { Modal } from '../common/Modal';

interface AddMenuItemModalProps {
  defaultCategory?: string;
  onClose: () => void;
}

interface MenuDraft {
  name: string;
  category: string;
  sellingPrice: number;
  costingMode: MenuItem['costingMode'];
  estimatedCogsPercent: number;
  selectedBeanId: string;
  bagWeightGrams: number;
  packagingCost: number;
}

/**
 * Centered add-menu-item dialog.
 *
 * The row is only appended when Save is pressed. Retail bags swap the costing
 * mode controls for bag weight and packaging, matching the retail audit.
 */
export function AddMenuItemModal({
  defaultCategory,
  onClose,
}: AddMenuItemModalProps) {
  const { state, addMenuItem, updateMenuItem } = useCalculator();
  const { t } = useI18n();

  const [draft, setDraft] = useState<MenuDraft>(() => {
    const base = createMenuItem(
      defaultCategory ? { category: defaultCategory } : {},
    );
    return {
      name: '',
      category: base.category,
      sellingPrice: 0,
      costingMode: 'simple',
      estimatedCogsPercent: 0,
      selectedBeanId: '',
      bagWeightGrams: 0,
      packagingCost: 0,
    };
  });

  const coffeeBeans = massCoffeeBeanSuppliers(state.suppliers);
  const beanOptions = [
    { value: '', label: t('menu.selectBean') },
    ...coffeeBeans.map((bean) => ({
      value: bean.id,
      label: `${bean.name || t('suppliers.name')} (${bean.packageLabel})`,
    })),
  ];
  const selectedBean =
    coffeeBeans.find((bean) => bean.id === draft.selectedBeanId) ?? null;
  const beanHint = selectedBean
    ? t('menu.beanPricePerKg', {
        price: formatCurrencyPrecise(
          supplierPricePerKilogram(selectedBean),
          state.settings.currencySymbol,
        ),
      })
    : coffeeBeans.length === 0
      ? t('menu.noCoffeeBeans')
      : t('menu.beanPriceHint');

  const categoryNames = mergeCategoryNames(
    MENU_CATEGORIES,
    state.customMenuCategories,
    state.menu.map((item) => item.category),
  );
  const categoryOptions = categoryNames.map((value) => ({
    value,
    label: menuCategoryLabel(value, t),
  }));
  const modeOptions = [
    { value: 'simple', label: t('menu.mode.simple') },
    { value: 'advanced', label: t('menu.mode.advanced') },
  ] as const;

  const isRetail = draft.category === RETAIL_BEANS_CATEGORY;
  const isDrink =
    draft.category === 'hot_drinks' || draft.category === 'cold_drinks';
  const showSimpleBean = !isRetail && isDrink && draft.costingMode === 'simple';
  const canSave =
    draft.name.trim().length > 0 &&
    (!isRetail || draft.selectedBeanId.length > 0);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const update = <K extends keyof MenuDraft>(key: K, value: MenuDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    if (!canSave) {
      setSaveAttempted(true);
      return;
    }
    const id = addMenuItem(draft.category);
    updateMenuItem(id, {
      name: draft.name.trim(),
      category: draft.category,
      sellingPrice: draft.sellingPrice,
      costingMode: draft.costingMode,
      estimatedCogsPercent: draft.estimatedCogsPercent,
      selectedBeanId: draft.selectedBeanId || undefined,
      bagWeightGrams: draft.bagWeightGrams,
      packagingCost: draft.packagingCost,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('menu.addTitle')}
      description={t('menu.addSubtitle')}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={draft.name.trim().length === 0}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="add-menu-name"
          label={t('menu.name')}
          className="sm:col-span-2"
          hint={
            draft.name.trim().length === 0
              ? t('common.requiredHint')
              : undefined
          }
        >
          <TextInput
            id="add-menu-name"
            autoFocus
            value={draft.name}
            placeholder={t('menu.namePlaceholder')}
            onChange={(event) => update('name', event.target.value)}
          />
        </Field>

        <Field id="add-menu-category" label={t('menu.category')}>
          <Select
            id="add-menu-category"
            value={draft.category}
            options={categoryOptions}
            onChange={(value) => update('category', value)}
          />
        </Field>

        <Field id="add-menu-price" label={t('menu.price')}>
          <NumericInput
            id="add-menu-price"
            value={draft.sellingPrice}
            onChange={(value) => update('sellingPrice', value)}
            suffix={state.settings.currencySymbol}
          />
        </Field>

        {isRetail ? (
          <>
            <div className="sm:col-span-2">
              <p className="rounded-lg border border-border bg-background p-3 text-small text-primary/65">
                {t('menu.addRetailHint')}
              </p>
            </div>

            <Field
              id="add-menu-bean"
              label={t('menu.beanType')}
              required
              hint={beanHint}
              error={
                saveAttempted && !draft.selectedBeanId
                  ? t('menu.beanRequired')
                  : undefined
              }
              className="sm:col-span-2"
            >
              <Select
                id="add-menu-bean"
                value={draft.selectedBeanId}
                options={beanOptions}
                invalid={saveAttempted && !draft.selectedBeanId}
                onChange={(value) => update('selectedBeanId', value)}
              />
            </Field>

            <Field
              id="add-menu-bag-weight"
              label={t('menu.bagWeight')}
              hint={t('menu.bagWeightHint')}
            >
              <NumericInput
                id="add-menu-bag-weight"
                value={draft.bagWeightGrams}
                onChange={(value) => update('bagWeightGrams', value)}
                suffix={t('units.g')}
              />
            </Field>

            <Field
              id="add-menu-packaging"
              label={t('menu.packagingCost')}
              hint={t('menu.packagingCostHint')}
            >
              <NumericInput
                id="add-menu-packaging"
                value={draft.packagingCost}
                onChange={(value) => update('packagingCost', value)}
                suffix={state.settings.currencySymbol}
              />
            </Field>
          </>
        ) : (
          <>
            <Field id="add-menu-mode" label={t('menu.mode')}>
              <Select
                id="add-menu-mode"
                value={draft.costingMode}
                options={modeOptions}
                onChange={(value) =>
                  update('costingMode', value as MenuItem['costingMode'])
                }
              />
            </Field>

            {draft.costingMode === 'simple' ? (
              <>
                <Field
                  id="add-menu-cogs"
                  label={t('menu.cogsPercent')}
                  hint={t('menu.cogsPercentHint')}
                >
                  <NumericInput
                    id="add-menu-cogs"
                    value={draft.estimatedCogsPercent}
                    onChange={(value) =>
                      update(
                        'estimatedCogsPercent',
                        Math.max(0, Math.min(100, value)),
                      )
                    }
                    suffix="%"
                  />
                </Field>

                {showSimpleBean ? (
                  <Field
                    id="add-menu-simple-bean"
                    label={t('menu.beanTypeUsed')}
                    hint={beanHint}
                    className="sm:col-span-2"
                  >
                    <Select
                      id="add-menu-simple-bean"
                      value={draft.selectedBeanId}
                      options={beanOptions}
                      onChange={(value) => update('selectedBeanId', value)}
                    />
                  </Field>
                ) : null}
              </>
            ) : (
              <div className="flex items-end">
                <p className="w-full rounded-lg border border-border bg-background p-3 text-small text-primary/65">
                  {t('menu.addAdvancedHint')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
