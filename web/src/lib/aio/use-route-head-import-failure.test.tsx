import { render, waitFor } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

/*
  The page model's chunk never arrives — a deploy rotated its hash out from
  under an open tab, or the visitor went offline mid-session. Throwing from the
  factory is how Vitest makes `await import('./pages')` reject.
*/
vi.mock('./pages', () => {
  throw new Error('Failed to fetch dynamically imported module: /assets/pages-v1hash.js');
});

import { useRouteHead } from './use-route-head';

async function mountAt(pathname: string) {
  window.history.replaceState({}, '', pathname);

  function RootProbe() {
    useRouteHead();
    return <Outlet />;
  }

  const rootRoute = createRootRoute({ component: RootProbe });
  const routes = ['/', '/about', '/projects'].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => <div>page</div> }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    basepath: '/',
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  await router.load();
  render(<RouterProvider router={router as never} />);
  return router;
}

describe('useRouteHead when the page model fails to load', () => {
  // Listened for on `process`, not on `window`: jsdom never dispatches the DOM
  // `unhandledrejection` event for a rejection originating in module code, so
  // a window listener here would record nothing and assert nothing. Node's
  // hook is the one that actually fires — it is also what Vitest reports the
  // run's "Unhandled Errors" from.
  const rejections: unknown[] = [];
  const onUnhandledRejection = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on('unhandledRejection', onUnhandledRejection);

  afterEach(() => {
    rejections.length = 0;
  });

  afterAll(() => {
    process.off('unhandledRejection', onUnhandledRejection);
  });

  it('leaves the served title in place instead of throwing', async () => {
    document.title = 'served title';

    const router = await mountAt('/about');
    await router.navigate({ to: '/projects' });

    // Let the rejected import settle, and give Node a turn to decide the
    // rejection was unhandled — it only emits after the microtask queue has
    // drained, so this wait is what makes the assertion below real.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // A cosmetic update that could not run is worth exactly nothing and must
    // cost exactly nothing: the head the server sent stays, the page keeps
    // rendering, and no rejection escapes.
    await waitFor(() => expect(document.title).toBe('served title'));
    expect(document.body.textContent).toContain('page');
    expect(rejections).toEqual([]);
  });
});
