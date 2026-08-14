import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { queryClient } from './lib/query-client';
import { useThemeStore } from './stores/theme-store';
import i18n from './i18n';
import {
  LOCALE_STORAGE_KEY,
  basepathForLocale,
  localeFromPathname,
  rootRedirectPath,
} from './i18n/locale-url';
import './styles.css';

document.documentElement.classList.toggle('dark', useThemeStore.getState().theme === 'dark');

/** The URL is the single source of truth for language — nothing overrides it after load. */
const locale = localeFromPathname(window.location.pathname);

/*
  `basepath` is what keeps every <Link to="/about"> inside the current locale:
  on /pt it renders /pt/about without a single call site knowing about
  prefixes.
*/
const router = createRouter({ routeTree, basepath: basepathForLocale(locale) });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

/*
  Only the bare root ever bounces: somebody who arrived at `/` has expressed no
  language in the path, so a Portuguese-speaking visitor can be sent to `/pt`
  before anything renders. Every other URL is honoured exactly as requested — a
  deep link is a language choice, and silently rewriting it would put the page
  at odds with its own canonical.
*/
const redirectTo = rootRedirectPath(
  window.location.pathname,
  window.localStorage.getItem(LOCALE_STORAGE_KEY),
  window.navigator.languages,
);

if (redirectTo) {
  window.location.replace(redirectTo);
} else {
  // i18next's detector still remembers the visitor's last choice for the root
  // redirect above, but it never decides what this page renders in.
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale;

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
