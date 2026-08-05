import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopNav } from './top-nav';

function renderTopNav(initialPath = '/') {
  const rootRoute = createRootRoute({ component: () => <TopNav /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () => null });
  const projectsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/projects',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, projectsRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  return render(<RouterProvider router={router} />);
}

describe('TopNav', () => {
  it('renders links to Home, About and Projects', async () => {
    renderTopNav();

    expect(await screen.findByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /about/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /projects/i }).length).toBeGreaterThan(0);
  });

  it('renders a Download CV control', async () => {
    renderTopNav();

    expect(await screen.findAllByRole('link', { name: /download cv/i })).not.toHaveLength(0);
  });

  it('renders a mobile menu trigger', async () => {
    renderTopNav();

    expect(await screen.findByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('highlights the active route link', async () => {
    renderTopNav('/about');

    const aboutLinks = await screen.findAllByRole('link', { name: /about/i });
    const activeLink = aboutLinks.find((link) => link.getAttribute('aria-current') === 'page');
    expect(activeLink).toBeDefined();
  });
});
