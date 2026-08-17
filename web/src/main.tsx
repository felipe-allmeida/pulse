import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterErrorScreen } from './components/router-error';
import { routeTree } from './routeTree.gen';
import { queryClient } from './lib/query-client';
import { mountWhenReady } from './lib/mount-when-ready';
import i18n from './i18n';
import {
  LOCALE_STORAGE_KEY,
  basepathForLocale,
  localeFromPathname,
  rootRedirectPath,
} from './i18n/locale-url';
import './styles.css';

/*
  The `dark` class used to be toggled from the theme store here. Nothing is
  left for it to do: index.html's blocking head script resolves the same
  preference from the same localStorage key before the first paint, and the
  emitted documents ship with class="dark" already stamped (see
  renderDocument). Both agree with the store — dark unless the visitor chose
  light — and ThemeToggle applies the class itself when the choice changes. All
  this line could do was re-apply, after the paint, a class that was already
  correct. (Verified in a real build: with it gone, a stored `light` still
  renders light and a cleared store still renders dark, both before the first
  paint. It bought no bytes — ThemeToggle keeps the store in the entry graph
  either way — only the confusion of a second thing owning the same class.)
*/

/** The URL is the single source of truth for language — nothing overrides it after load. */
const locale = localeFromPathname(window.location.pathname);

/*
  `basepath` is what keeps every <Link to="/about"> inside the current locale:
  on /pt it renders /pt/about without a single call site knowing about
  prefixes.

  `defaultErrorComponent` replaces TanStack's built-in screen — an unstyled
  "Something went wrong!" with a "Show Error" toggle, on the document's dark
  background, which is what this site actually showed anyone whose route chunk
  failed to load. It is the last boundary in the app, so it is also the one
  most likely to be seen by someone with a flaky connection: it says so in
  their language and offers the only thing that genuinely helps, a reload.
*/
const router = createRouter({
  routeTree,
  basepath: basepathForLocale(locale),
  defaultErrorComponent: RouterErrorScreen,
});

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

  void mountWhenReady(
    () => router.load(),
    () =>
      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </React.StrictMode>,
      ),
  );
}
