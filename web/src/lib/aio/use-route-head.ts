import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { pageForPath } from './pages';

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const page = pageForPath(pathname);
    if (!page) return;

    document.title = page.title;
    setAttribute('meta[name="description"]', 'content', page.description);
    setAttribute('meta[property="og:title"]', 'content', page.title);
    setAttribute('meta[property="og:description"]', 'content', page.description);
    // Canonical is deliberately left alone: it is stamped at build time with
    // the deploy's real origin, which the browser cannot know here.
  }, [pathname]);
}
