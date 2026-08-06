import { useTranslation } from 'react-i18next';
import type { Locale, LocalizedString } from '@/content/types';

export function useLocalized() {
  const { i18n } = useTranslation();
  const locale = (i18n.language as Locale) in { en: 1, 'pt-BR': 1 } ? (i18n.language as Locale) : 'en';
  return (v: LocalizedString): string => v[locale] || v.en;
}
