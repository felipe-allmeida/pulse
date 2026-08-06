import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Locale } from '@/content/types';
import { renderWithI18n } from '@/test/render-with-i18n';
import { TopNav } from './top-nav';

function renderTopNav(initialPath = '/', locale?: Locale) {
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

  return renderWithI18n(<RouterProvider router={router} />, { locale });
}

describe('TopNav', () => {
  it('renders links to Home, About and Projects', async () => {
    await renderTopNav();

    expect(await screen.findByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /about/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /projects/i }).length).toBeGreaterThan(0);
  });

  it('renders a Download CV control', async () => {
    await renderTopNav();

    expect(await screen.findAllByRole('link', { name: /download cv/i })).not.toHaveLength(0);
  });

  it('renders a mobile menu trigger', async () => {
    await renderTopNav();

    expect(await screen.findByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('opens the mobile menu with Home/About/Projects links and a Download CV control', async () => {
    await renderTopNav();

    fireEvent.click(await screen.findByRole('button', { name: /open menu/i }));

    const mobileNav = await screen.findByRole('navigation', { name: /mobile/i });
    expect(within(mobileNav).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /download cv/i })).toBeInTheDocument();
  });

  it('highlights the active route link', async () => {
    await renderTopNav('/about');

    const aboutLinks = await screen.findAllByRole('link', { name: /about/i });
    const activeLink = aboutLinks.find((link) => link.getAttribute('aria-current') === 'page');
    expect(activeLink).toBeDefined();
  });

  it('renders pt-BR link labels and Download CV control', async () => {
    await renderTopNav('/', 'pt-BR');

    expect(await screen.findByRole('link', { name: /início/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /sobre/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /projetos/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /baixar currículo/i }).length).toBeGreaterThan(0);
  });
});
