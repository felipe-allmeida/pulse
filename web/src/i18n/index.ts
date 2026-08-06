import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from './locales/en/common.json';
import ptCommon from './locales/pt-BR/common.json';

export const resources = {
  en: { common: enCommon },
  'pt-BR': { common: ptCommon },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR'],
    load: 'currentOnly',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pulse.lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
