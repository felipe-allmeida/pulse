import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enAbout from './locales/en/about.json';
import enAsk from './locales/en/ask.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enHome from './locales/en/home.json';
import enNav from './locales/en/nav.json';
import enProjects from './locales/en/projects.json';
import ptAbout from './locales/pt-BR/about.json';
import ptAsk from './locales/pt-BR/ask.json';
import ptCommon from './locales/pt-BR/common.json';
import ptDashboard from './locales/pt-BR/dashboard.json';
import ptHome from './locales/pt-BR/home.json';
import ptNav from './locales/pt-BR/nav.json';
import ptProjects from './locales/pt-BR/projects.json';

export const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    about: enAbout,
    projects: enProjects,
    dashboard: enDashboard,
    ask: enAsk,
    home: enHome,
  },
  'pt-BR': {
    common: ptCommon,
    nav: ptNav,
    about: ptAbout,
    projects: ptProjects,
    dashboard: ptDashboard,
    ask: ptAsk,
    home: ptHome,
  },
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
    ns: ['common', 'nav', 'about', 'projects', 'dashboard', 'ask', 'home'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pulse.lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
