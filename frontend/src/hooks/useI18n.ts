import { useCallback } from 'react';
import { isRtl, translate, type Language, type TranslationKey } from '@i18n/index';
import { useCalculator } from '../context/CalculatorContext';

export function useI18n() {
  const { state } = useCalculator();
  const language = state.language;
  const direction = isRtl(language) ? 'rtl' : 'ltr';

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  return { t, language, direction, isRtl: isRtl(language) } as {
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
    language: Language;
    direction: 'rtl' | 'ltr';
    isRtl: boolean;
  };
}
