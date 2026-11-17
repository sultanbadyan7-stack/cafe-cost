import { useState } from 'react';
import type { AssetCategory, DepreciationMethod } from '@shared/types';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_KEYS,
  DEPRECIATION_METHODS,
  DEPRECIATION_METHOD_KEYS,
} from '../../lib/categories';
import { createFixedAsset } from '../../lib/defaults';
import { Button } from '../common/Button';
import { Field, NumericInput, Select, TextInput } from '../common/Field';
import { Modal } from '../common/Modal';

interface AddAssetModalProps {
  onClose: () => void;
}

interface AssetDraft {
  name: string;
  category: AssetCategory;
  purchasePrice: number;
  shippingInstallation: number;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: DepreciationMethod;
}

/**
 * Centered add-asset dialog.
 *
 * The asset row is only appended when Save is pressed, so cancelling never
 * leaves an empty row at the bottom of the register.
 */
export function AddAssetModal({ onClose }: AddAssetModalProps) {
  const { state, addAsset, updateAsset } = useCalculator();
  const { t } = useI18n();

  const [draft, setDraft] = useState<AssetDraft>(() => {
    const base = createFixedAsset();
    return {
      name: '',
      category: base.category,
      purchasePrice: 0,
      shippingInstallation: 0,
      usefulLifeYears: 0,
      salvageValue: 0,
      depreciationMethod: base.depreciationMethod,
    };
  });

  const categoryOptions = ASSET_CATEGORIES.map((value) => ({
    value,
    label: t(ASSET_CATEGORY_KEYS[value]),
  }));

  const methodOptions = DEPRECIATION_METHODS.map((value) => ({
    value,
    label: t(DEPRECIATION_METHOD_KEYS[value]),
  }));

  const symbol = state.settings.currencySymbol;
  const canSave = draft.name.trim().length > 0;

  const update = <K extends keyof AssetDraft>(key: K, value: AssetDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    if (!canSave) return;
    const id = addAsset();
    updateAsset(id, {
      name: draft.name.trim(),
      category: draft.category,
      purchasePrice: draft.purchasePrice,
      shippingInstallation: draft.shippingInstallation,
      usefulLifeYears: draft.usefulLifeYears,
      salvageValue: draft.salvageValue,
      depreciationMethod: draft.depreciationMethod,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('expenses.addAssetTitle')}
      description={t('expenses.addAssetSubtitle')}
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
          id="add-asset-name"
          label={t('expenses.assetName')}
          className="sm:col-span-2"
          hint={canSave ? undefined : t('common.requiredHint')}
        >
          <TextInput
            id="add-asset-name"
            autoFocus
            value={draft.name}
            placeholder={t('expenses.assetNamePlaceholder')}
            onChange={(event) => update('name', event.target.value)}
          />
        </Field>

        <Field id="add-asset-category" label={t('expenses.assetCategory')}>
          <Select
            id="add-asset-category"
            value={draft.category}
            options={categoryOptions}
            onChange={(value) => update('category', value as AssetCategory)}
          />
        </Field>

        <Field id="add-asset-method" label={t('expenses.depreciationMethod')}>
          <Select
            id="add-asset-method"
            value={draft.depreciationMethod}
            options={methodOptions}
            onChange={(value) =>
              update('depreciationMethod', value as DepreciationMethod)
            }
          />
        </Field>

        <Field id="add-asset-purchase" label={t('expenses.purchasePrice')}>
          <NumericInput
            id="add-asset-purchase"
            value={draft.purchasePrice}
            onChange={(value) => update('purchasePrice', value)}
            suffix={symbol}
          />
        </Field>

        <Field
          id="add-asset-shipping"
          label={t('expenses.shippingInstallation')}
        >
          <NumericInput
            id="add-asset-shipping"
            value={draft.shippingInstallation}
            onChange={(value) => update('shippingInstallation', value)}
            suffix={symbol}
          />
        </Field>

        <Field id="add-asset-life" label={t('expenses.usefulLife')}>
          <NumericInput
            id="add-asset-life"
            value={draft.usefulLifeYears}
            onChange={(value) => update('usefulLifeYears', value)}
            suffix={t('common.years')}
          />
        </Field>

        <Field id="add-asset-salvage" label={t('expenses.salvageValue')}>
          <NumericInput
            id="add-asset-salvage"
            value={draft.salvageValue}
            onChange={(value) => update('salvageValue', value)}
            suffix={symbol}
          />
        </Field>
      </div>
    </Modal>
  );
}
