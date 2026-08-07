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
  const liveRoute = createRoute({ getParentRoute: () => rootRoute, path: '/live', component: () => null });
  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, projectsRoute, liveRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  return renderWithI18n(<RouterProvider router={router} />, { locale });
}

describe('TopNav', () => {
  it('renders links to Home, About, Projects, Live and Contact', async () => {
    await renderTopNav();

    expect(await screen.findByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /about/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /projects/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^live$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /contact/i }).length).toBeGreaterThan(0);
  });

  it('points the Live link at /live', async () => {
    await renderTopNav();

    const liveLinks = await screen.findAllByRole('link', { name: /^live$/i });
    expect(liveLinks[0]).toHaveAttribute('href', '/live');
  });

  it('points the Contact link at the About contact anchor', async () => {
    await renderTopNav();

    const contactLinks = await screen.findAllByRole('link', { name: /contact/i });
    expect(contactLinks[0]).toHaveAttribute('href', '/about#contact');
  });

  it('does not render an Ask the AI trigger in the header (the hero CTA and floating trigger cover it)', async () => {
    await renderTopNav();

    expect(screen.queryAllByRole('button', { name: /ask the ai/i })).toHaveLength(0);
  });

  it('renders a Download CV control', async () => {
    await renderTopNav();

    expect(await screen.findAllByRole('link', { name: /download cv/i })).not.toHaveLength(0);
  });

  it('renders a mobile menu trigger', async () => {
    await renderTopNav();

    expect(await screen.findByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('opens the mobile menu with Home/About/Projects/Contact links and a Download CV control', async () => {
    await renderTopNav();

    fireEvent.click(await screen.findByRole('button', { name: /open menu/i }));

    const mobileNav = await screen.findByRole('navigation', { name: /mobile/i });
    expect(within(mobileNav).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /^live$/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /contact/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /download cv/i })).toBeInTheDocument();
    expect(within(mobileNav).queryAllByRole('button', { name: /ask the ai/i })).toHaveLength(0);
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
    expect(screen.getAllByRole('link', { name: /^ao vivo$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /contato/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /baixar currículo/i }).length).toBeGreaterThan(0);
  });

  it('opens the mobile menu as a bottom sheet, not a side drawer', async () => {
    await renderTopNav();

    fireEvent.click(await screen.findByRole('button', { name: /open menu/i }));

    const dialog = await screen.findByRole('dialog');
    // side="bottom" styling: anchored to the bottom edge, not the right edge.
    expect(dialog.className).toMatch(/\bbottom-0\b/);
    expect(dialog.className).not.toMatch(/\bright-0\b/);
    expect(dialog.className).toMatch(/rounded-t/);
  });

  it('gives every mobile menu row a >=44px touch target', async () => {
    await renderTopNav();

    fireEvent.click(await screen.findByRole('button', { name: /open menu/i }));

    const mobileNav = await screen.findByRole('navigation', { name: /mobile/i });
    const rows = [
      ...within(mobileNav).getAllByRole('link'),
      ...within(mobileNav).queryAllByRole('button'),
    ];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
    }
  });
});
