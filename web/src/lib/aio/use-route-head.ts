import { useEffect, useRef, useState } from 'react';
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

  // The route this document was *served* for. An effect runs on mount as well
  // as on every change, so without this the hook fires immediately after the
  // mount swap and imports `pages` — which drags in `faq`, `profile` and
  // `projects`: 85,346 B raw, 28,287 B gzipped, measured on a cold load of
  // /pt — in order to set the document to the title the served head already
  // carries. Nothing on the first paint needs the model; only an actual
  // client-side navigation does, and by then a page is already on screen.
  //
  // A path, not a boolean: React StrictMode double-invokes effects in dev, so
  // a plain "have I run once" flag would let the second invocation through
  // and load the model anyway. Comparing the path skips any run that isn't a
  // real move.
  const servedPath = useRef<string | null>(null);

  useEffect(() => {
    if (servedPath.current === routerPath) return;
    const isFirstRoute = servedPath.current === null;
    servedPath.current = routerPath;
    if (isFirstRoute) return;

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

    // A rejected import — the chunk 404s after a deploy, the visitor is
    // offline — leaves the served head exactly as it is. That is a stale
    // title, which is the failure this hook exists to avoid, but it is a far
    // better one than an unhandled rejection for a cosmetic update.
    void retitle().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [routerPath, locale]);
}
