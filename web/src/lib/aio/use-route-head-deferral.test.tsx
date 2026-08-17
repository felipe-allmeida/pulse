import { render, waitFor } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

/*
  Proves both halves of the deferral, which only mean anything together.

  The bytes: `pages.ts` builds the full AioPage model for every route in both
  locales, pulling in faq, profile and projects — 85,346 B raw / 28,287 B
  gzipped, measured on a cold load of /pt. The served document already carries
  this route's title, so importing all of that on mount buys a re-set of a
  value that is already correct.

  The feature: the moment the visitor actually navigates, the title has to
  change, or the deferral has traded a real capability for the bytes. Counting
  loads of the module — not calls into it — is what makes the first half
  honest: the cost is the chunk being fetched at all.
*/
const state = vi.hoisted(() => ({ loads: 0 }));

vi.mock('./pages', async (importOriginal) => {
  state.loads += 1;
  return await importOriginal<typeof import('./pages')>();
});

import { useRouteHead } from './use-route-head';

async function mountAt(pathname: string, basepath: string) {
  window.history.replaceState({}, '', pathname);

  function RootProbe() {
    useRouteHead();
    return <Outlet />;
  }

  const rootRoute = createRootRoute({ component: RootProbe });
  const routes = ['/', '/about', '/projects'].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => <div /> }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    basepath,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  // Matches the app: mount-when-ready.ts resolves the initial route before
  // rendering, so the hook's first sighting is always the served route.
  await router.load();
  render(<RouterProvider router={router as never} />);
  return router;
}

describe('useRouteHead defers the page model past the first paint', () => {
  it('does not load the page model on the initial mount, then loads it on a navigation', async () => {
    state.loads = 0;
    document.title = 'served title';

    const router = await mountAt('/about', '/');

    // Give the effect every chance to have fired: a microtask flush plus a
    // macrotask, so this is not just "the import had not finished yet".
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(state.loads).toBe(0);
    expect(document.title).toBe('served title');

    // The half that matters. Deferral must not mean "never" — a client-side
    // navigation leaves the served head describing a page the visitor is no
    // longer on, and that is the whole reason this hook exists.
    await router.navigate({ to: '/projects' });

    await waitFor(() => expect(document.title).toBe('Projects — Felipe de Almeida'));
    expect(state.loads).toBe(1);
  });
});
