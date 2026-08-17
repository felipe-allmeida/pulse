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
function mountAt(pathname: string, basepath: string) {
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

  it('titles the landing route', async () => {
    mountAt('/about', '/');

    await waitFor(() => expect(document.title).toContain('About Felipe de Almeida'));
    expect(head('meta[name="description"]')).toContain('Software engineer and architect');
  });

  it('retitles on client-side navigation instead of leaving the landing title', async () => {
    const router = mountAt('/about', '/');
    await waitFor(() => expect(document.title).toContain('About'));

    await router.navigate({ to: '/projects' });

    await waitFor(() => expect(document.title).toBe('Projects — Felipe de Almeida'));
    expect(head('meta[property="og:title"]')).toBe('Projects — Felipe de Almeida');
  });

  it('reads the locale off the address bar, not the router-internal path', async () => {
    const router = mountAt('/pt/about', '/pt');

    await waitFor(() => expect(document.title).toContain('Sobre Felipe de Almeida'));

    await router.navigate({ to: '/projects' });

    await waitFor(() => expect(document.title).toBe('Projetos — Felipe de Almeida'));
  });

  it('leaves the head alone on a route with no generated document', async () => {
    mountAt('/projects/does-not-exist', '/');

    // Better a stale title than a wrong one: the hook only speaks for routes
    // it actually has content for.
    await waitFor(() => expect(document.title).toBe('stale'));
  });

  it('never appends a second title or description tag', async () => {
    const router = mountAt('/about', '/');
    await waitFor(() => expect(document.title).toContain('About'));
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
