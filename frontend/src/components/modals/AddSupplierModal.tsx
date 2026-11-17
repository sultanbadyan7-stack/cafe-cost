import { useState } from 'react';
import type { IngredientUnit } from '@shared/types';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import {
  INGREDIENT_UNITS,
  SUPPLIER_CATEGORIES,
  UNIT_KEYS,
  mergeCategoryNames,
  supplierCategoryLabel,
} from '../../lib/categories';
import { createSupplierItem, formatPackageLabel } from '../../lib/defaults';
import { Button } from '../common/Button';
import { Field, NumericInput, Select, TextInput } from '../common/Field';
import { Modal } from '../common/Modal';

interface AddSupplierModalProps {
  defaultCategory?: string;
  onClose: () => void;
}

interface SupplierDraft {
  name: string;
  category: string;
  packageQuantity: number;
  packageUnit: IngredientUnit;
  price: number;
  wastePercentage: number;
}

/** Sensible starting unit for the most common supplier categories. */
function defaultUnitForCategory(category: string): IngredientUnit {
  if (category === 'dairy' || category === 'syrups') return 'l';
  if (category === 'packaging' || category === 'bakery') return 'pc';
  return 'kg';
}

/**
 * Centered add-supplier dialog.
 *
 * Nothing is written to the workspace until Save is pressed. The draft lives
 * in local state, so cancelling leaves the list untouched.
 */
export function AddSupplierModal({
  defaultCategory,
  onClose,
}: AddSupplierModalProps) {
  const { state, addSupplier, updateSupplier } = useCalculator();
  const { t } = useI18n();

  const [draft, setDraft] = useState<SupplierDraft>(() => {
    const base = createSupplierItem(
      defaultCategory ? { category: defaultCategory } : {},
    );
    return {
      name: '',
      category: base.category,
      packageQuantity: 1,
      packageUnit: defaultUnitForCategory(base.category),
      price: 0,
      wastePercentage: 0,
    };
  });

  const categoryNames = mergeCategoryNames(
    SUPPLIER_CATEGORIES,
    state.customSupplierCategories,
    state.suppliers.map((supplier) => supplier.category),
  );
  const categoryOptions = categoryNames.map((value) => ({
    value,
    label: supplierCategoryLabel(value, t),
  }));
  const unitOptions = INGREDIENT_UNITS.map((value) => ({
    value,
    label: t(UNIT_KEYS[value]),
  }));

  const canSave = draft.name.trim().length > 0;

  const update = <K extends keyof SupplierDraft>(
    key: K,
    value: SupplierDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    if (!canSave) return;
    const id = addSupplier(draft.category);
    updateSupplier(id, {
      name: draft.name.trim(),
      category: draft.category,
      packageQuantity: draft.packageQuantity,
      packageUnit: draft.packageUnit,
      packageLabel: formatPackageLabel(
        draft.packageQuantity,
        draft.packageUnit,
      ),
      price: draft.price,
      wastePercentage: draft.wastePercentage,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('suppliers.addTitle')}
      description={t('suppliers.addSubtitle')}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="add-supplier-name"
          label={t('suppliers.name')}
          className="sm:col-span-2"
          hint={canSave ? undefined : t('common.requiredHint')}
        >
          <TextInput
            id="add-supplier-name"
            autoFocus
            value={draft.name}
            placeholder={t('suppliers.namePlaceholder')}
            onChange={(event) => update('name', event.target.value)}
          />
        </Field>

        <Field id="add-supplier-category" label={t('suppliers.category')}>
          <Select
            id="add-supplier-category"
            value={draft.category}
            options={categoryOptions}
            onChange={(value) => {
              update('category', value);
              update('packageUnit', defaultUnitForCategory(value));
            }}
          />
        </Field>

        <Field id="add-supplier-quantity" label={t('suppliers.package')}>
          <div className="flex min-w-0 gap-2">
            <div className="w-24 shrink-0">
              <NumericInput
                id="add-supplier-quantity"
                value={draft.packageQuantity}
                aria-label={t('suppliers.packageQuantity')}
                onChange={(value) => update('packageQuantity', value)}
              />
            </div>
            <Select
              className="min-w-0 flex-1"
              value={draft.packageUnit}
              aria-label={t('suppliers.packageUnit')}
              options={unitOptions}
              onChange={(value) =>
                update('packageUnit', value as IngredientUnit)
              }
            />
          </div>
        </Field>

        <Field id="add-supplier-price" label={t('suppliers.price')}>
          <NumericInput
            id="add-supplier-price"
            value={draft.price}
            onChange={(value) => update('price', value)}
            suffix={state.settings.currencySymbol}
          />
        </Field>

        <Field id="add-supplier-waste" label={t('suppliers.waste')}>
          <NumericInput
            id="add-supplier-waste"
            value={draft.wastePercentage}
            onChange={(value) =>
              update('wastePercentage', Math.max(0, Math.min(100, value)))
            }
            suffix="%"
          />
        </Field>
      </div>
    </Modal>
  );
}
