import { useEffect, useState } from 'react';
import { CircleAlert, Globe2 } from 'lucide-react';
import { useCalculator } from '../../context/CalculatorContext';
import { useI18n } from '../../hooks/useI18n';
import { CURRENCIES, currencyByCode } from '../../lib/currencies';
import { Field, NumericInput, Select } from '../common/Field';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface CurrencyModalProps {
  open: boolean;
  onClose: () => void;
}

export function CurrencyModal({ open, onClose }: CurrencyModalProps) {
  const { state, changeCurrency } = useCalculator();
  const { t } = useI18n();

  const [code, setCode] = useState(state.settings.currencyCode);
  const [symbol, setSymbol] = useState(state.settings.currencySymbol);
  const [rate, setRate] = useState(state.settings.exchangeRateToUSD);

  useEffect(() => {
    if (!open) return;
    setCode(state.settings.currencyCode);
    setSymbol(state.settings.currencySymbol);
    setRate(state.settings.exchangeRateToUSD);
  }, [open, state.settings]);

  const currencyOptions = CURRENCIES.map((currency) => ({
    value: currency.code,
    label: `${currency.code} — ${currency.symbol} (${currency.name})`,
  }));

  /* Keep a legacy/custom code selectable so opening the modal never drops it. */
  if (!currencyByCode(code)) {
    currencyOptions.unshift({
      value: code,
      label: `${code} — ${symbol}`,
    });
  }

  const hasValidRate = Number.isFinite(rate) && rate > 0;
  const canSave = symbol.trim().length > 0 && hasValidRate;
  const isChangingCurrency = code !== state.settings.currencyCode;

  const selectCurrency = (nextCode: string) => {
    const currency = currencyByCode(nextCode);
    setCode(nextCode);
    if (currency) {
      setSymbol(currency.symbol);
      setRate(currency.referenceRate);
    }
  };

  const save = () => {
    if (!canSave) return;
    changeCurrency(code, symbol.trim(), rate);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('currency.title')}
      description={t('currency.subtitle')}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="md" onClick={save} disabled={!canSave}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="currency-modal-code" label={t('common.currency')} required>
          <Select
            id="currency-modal-code"
            value={code}
            options={currencyOptions}
            onChange={selectCurrency}
          />
        </Field>

        <Field
          id="currency-modal-rate"
          label={t('currency.exchangeRate')}
          error={hasValidRate ? undefined : t('currency.invalidRate')}
        >
          <NumericInput
            id="currency-modal-rate"
            value={rate}
            onChange={setRate}
            invalid={!hasValidRate}
            suffix={code || '—'}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-background p-3">
        <Globe2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
        <div className="min-w-0 text-small text-primary/70">
          <p className="font-medium text-primary">{t('currency.preview')}</p>
          <p className="mt-0.5 font-numeric" dir="ltr">
            1 USD = {rate} {code || '—'} · {symbol || '—'}
          </p>
        </div>
      </div>

      {isChangingCurrency ? (
        <p className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-small text-primary/70">
          {t('currency.conversionNote', {
            from: state.settings.currencyCode,
            to: code || '—',
          })}
        </p>
      ) : null}

      <p className="mt-4 flex items-start gap-2 text-legal text-warning">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        {t('currency.disclaimer')}
      </p>
    </Modal>
  );
}
