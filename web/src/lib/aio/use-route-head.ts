import { useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import {
  DEFAULT_LOCALE,
  localeFromPathname,
  pathForLocale,
  routePathFromPathname,
} from '../../i18n/locale-url';

/**
 * Keeps the document head in step with client-side navigation.
 *
 * Each route is served as its own document with its own head (see
 * `web/plugins/aio.ts`), which is what crawlers read. But once the SPA takes
 * over, moving from `/about` to `/projects` never reloads the document, so
 * those tags would keep describing the landing route — a stale tab title, and
 * a stale card if someone shares the URL they are looking at.
 *
 * This *edits the existing tags in place* rather than appending new ones.
 * Rendering a second `<title>`/`<meta name="description">` on top of the
 * generated ones is worse than a stale one: crawlers then have to guess which
 * of the two describes the page.
 */
function setAttribute(selector: string, attribute: string, value: string): void {
  document.head.querySelector(selector)?.setAttribute(attribute, value);
}

export function useRouteHead(): void {
  // The router reports paths in its own space, with the locale basepath
  // stripped: on /pt/about it says `/about`.
  const routerPath = useRouterState({ select: (state) => state.location.pathname });

  // Read once at mount, and only from the address bar: the locale is fixed for
  // the life of the document (switching language is a real navigation), and
  // the router state does not carry it. Reading `window.location` inside the
  // effect instead would race — the router updates its state before it pushes
  // to history, so the effect would look up the *previous* URL and retitle the
  // page to the route it just left.
  const [locale] = useState(() =>
    // The build-time render has no address bar; the effect that uses this
    // never runs there, so the default is only ever a placeholder.
    typeof window === 'undefined' ? DEFAULT_LOCALE : localeFromPathname(window.location.pathname),
  );

  useEffect(() => {
    let cancelled = false;

    async function retitle(): Promise<void> {
      // Loaded on demand rather than imported statically: `pages.ts` builds
      // the full `AioPage` model for every route in both locales, which
      // pulls in `faq`, `profile` and `projects` (~82 KB). The served
      // document already carries this route's title from the AIO build
      // step, so nothing about the first paint needs any of that — only a
      // later client-side navigation does, and by then a rendered page is
      // already on screen.
      const { pageForPath } = await import('./pages');
      if (cancelled) return;

      const page = pageForPath(pathForLocale(routePathFromPathname(routerPath), locale));
      if (!page) return;

      document.title = page.title;
      setAttribute('meta[name="description"]', 'content', page.description);
      setAttribute('meta[property="og:title"]', 'content', page.title);
      setAttribute('meta[property="og:description"]', 'content', page.description);
      // Canonical is deliberately left alone: it is stamped at build time with
      // the deploy's real origin, which the browser cannot know here.
    }

    void retitle();

    return () => {
      cancelled = true;
    };
  }, [routerPath, locale]);
}
