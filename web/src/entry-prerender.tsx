/**
 * The build-time render entry.
 *
 * Pulse ships as static files behind Caddy, with no Node process in
 * production — so this is not server-side rendering in the request sense. It
 * runs once per route per locale during `pnpm build`, and the AIO plugin
 * splices the resulting markup into that route's `#root` (see
 * `web/plugins/aio.ts`).
 *
 * The point is what a crawler receives. Before this, the served HTML carried
 * the page's text only inside `<noscript>`, which the readability-style
 * extraction pipelines behind answer engines routinely strip before chunking.
 * Now the real component tree is in the document, in the real DOM.
 *
 * The client still mounts with `createRoot`, not `hydrateRoot`. That is
 * deliberate: this app's first paint is full of live values — presence counts,
 * the visitor's own city, event feeds — that cannot match a render performed
 * at build time, and hydration mismatches on that kind of content produce
 * subtle, drifting bugs. Re-rendering costs one paint over markup that is
 * already correct and already styled, and it keeps the two renders
 * independent. What it does buy is a constraint: everything reachable from
 * here has to survive a render with no `window`, which `entry-prerender.test`
 * guards.
 */
import { renderToString } from 'react-dom/server';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import i18n from './i18n';
import type { Locale } from './content/types';
import { basepathForLocale, pathForLocale } from './i18n/locale-url';

/** Renders one route, in one locale, to the markup that goes inside `#root`. */
export async function renderRoute(routePath: string, locale: Locale): Promise<string> {
  await i18n.changeLanguage(locale);

  const basepath = basepathForLocale(locale);
  const path = pathForLocale(routePath, locale);
  /*
    A prefixed locale's home is the one case where the public path and the
    basepath are the same string (`/pt`). The router strips the basepath from
    the history entry, which would leave `''` — matching no route, rendering
    nothing, and shipping a document whose #root is empty. `/pt/` is the form
    the router itself produces for that link (see web/plugins/aio.ts).
  */
  const initialEntry = path === basepath ? `${path}/` : path;

  const router = createRouter({
    routeTree,
    basepath,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  await router.load();

  // Retries and refetches are meaningless in a one-shot render; every query
  // resolves to its loading state, which is exactly what the client starts
  // from too.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  return renderToString(
    <QueryClientProvider client={queryClient}>
      {/* This ad-hoc router is not the app's registered router type. */}
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}
