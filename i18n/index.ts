import { en, type TranslationKey } from './en/common';
import { ar } from './ar/common';

export type Language = 'en' | 'ar';
export type { TranslationKey };

export const dictionaries = { en, ar } as const;

export function translate(
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const raw = dictionaries[language][key] ?? en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] === undefined ? `{${name}}` : String(params[name]),
  );
}

export function isRtl(language: Language): boolean {
  return language === 'ar';
}
