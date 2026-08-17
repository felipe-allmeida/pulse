/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, waitFor } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRouteHead } from './use-route-head';

/**
 * Builds a router over the real routes the head hook knows about, with the
 * locale basepath the app uses, so the test exercises the same lookup the
 * browser does.
 */
async function mountAt(pathname: string, basepath: string) {
  window.history.replaceState({}, '', pathname);

  function RootProbe() {
    useRouteHead();
    return <Outlet />;
  }

  const rootRoute = createRootRoute({ component: RootProbe });
  const routes = ['/', '/about', '/projects', '/projects/$slug'].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => <div /> }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    basepath,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  // The app resolves the initial route *before* it mounts (see
  // mount-when-ready.ts), so the first thing the hook ever sees is the route
  // the document was served for. Without loading first, RouterProvider commits
  // nothing until the match resolves — a navigate() issued in the meantime
  // lands as the *first* render, and the hook is then right to treat it as the
  // served route rather than a navigation.
  await router.load();

  // This ad-hoc tree is not the app's registered router type.
  render(<RouterProvider router={router as never} />);
  return router;
}

function head(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute('content') ?? null;
}

describe('useRouteHead', () => {
  beforeEach(() => {
    // Mirrors what the AIO build step serves: one title, one description.
    document.head.innerHTML =
      '<title>stale</title><meta name="description" content="stale" /><meta property="og:title" content="stale" /><meta property="og:description" content="stale" />';
  });

  it('leaves the served head alone on the route the document was served for', async () => {
    await mountAt('/about', '/');

    // The landing route's head is already correct — the AIO build step wrote
    // it — so touching it can only cost a page-model import for no change.
    // `stale` here stands in for whatever the server sent.
    await waitFor(() => expect(document.title).toBe('stale'));
    expect(head('meta[name="description"]')).toBe('stale');
  });

  it('retitles on client-side navigation instead of leaving the landing title', async () => {
    const router = await mountAt('/about', '/');

    await router.navigate({ to: '/projects' });

    await waitFor(() => expect(document.title).toBe('Projects — Felipe de Almeida'));
    expect(head('meta[property="og:title"]')).toBe('Projects — Felipe de Almeida');
    expect(head('meta[name="description"]')).not.toBe('stale');
  });

  it('reads the locale off the address bar, not the router-internal path', async () => {
    const router = await mountAt('/pt/about', '/pt');

    await router.navigate({ to: '/projects' });

    await waitFor(() => expect(document.title).toBe('Projetos — Felipe de Almeida'));
  });

  it('leaves the head alone on a route with no generated document', async () => {
    const router = await mountAt('/about', '/');

    await router.navigate({ to: '/projects' });
    await waitFor(() => expect(document.title).toContain('Projects'));

    await router.navigate({ to: '/projects/$slug', params: { slug: 'does-not-exist' } });

    // Better a stale title than a wrong one: the hook only speaks for routes
    // it actually has content for. Navigating in from a route it *did* title
    // is what makes this non-vacuous — the hook ran and declined to write.
    await waitFor(() => expect(document.title).toBe('Projects — Felipe de Almeida'));
  });

  it('never appends a second title or description tag', async () => {
    const router = await mountAt('/about', '/');
    await router.navigate({ to: '/projects' });
    await waitFor(() => expect(document.title).toContain('Projects'));

    // The generated tags are edited in place — a second <title> would leave
    // crawlers guessing which one describes the page.
    expect(document.head.querySelectorAll('title')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  });

  it('does not pull the page model into the initial render', async () => {
    // The served document already carries this route's title from the AIO
    // build step, so nothing about the first paint needs the page model —
    // and reaching for it statically drags faq, profile and projects (~82 KB)
    // onto every page in the site.
    const modules = await import('./use-route-head');
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'use-route-head.ts'),
      'utf-8',
    );

    expect(modules).toBeDefined();
    expect(source).not.toMatch(/^import .*\bfrom '\.\/pages'/m);
    expect(source).toMatch(/await import\('\.\/pages'\)/);
  });
});
