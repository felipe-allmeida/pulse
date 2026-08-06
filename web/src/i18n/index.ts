import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import ptCommon from './locales/pt-BR/common.json';
import ptNav from './locales/pt-BR/nav.json';

export const resources = {
  en: { common: enCommon, nav: enNav },
  'pt-BR': { common: ptCommon, nav: ptNav },
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
    ns: ['common', 'nav'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pulse.lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
