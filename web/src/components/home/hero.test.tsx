import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/content/types';
import { profile } from '@/content/profile';
import { renderWithI18n } from '@/test/render-with-i18n';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn(() => ({ data: undefined }));

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
}));

const { Hero } = await import('./hero');

function renderHero(locale?: Locale) {
  const rootRoute = createRootRoute({ component: () => <Hero /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () => null });
  const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', component: () => null });
  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, projectsRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return renderWithI18n(<RouterProvider router={router} />, { locale });
}

describe('Hero', () => {
  it('renders the profile name as the page h1', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero();

    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
  });

  it('shows the live online-count pill from the metrics hook', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero();

    expect(await screen.findByText('7 online now')).toBeInTheDocument();
  });

  it('renders a link to /projects', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero();

    expect(await screen.findByRole('link', { name: /see the projects/i })).toHaveAttribute('href', '/projects');
  });

  it('renders pt-BR hook copy with the live count', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero('pt-BR');

    expect(await screen.findByText(/sistema distribuído ao vivo/)).toBeInTheDocument();
    expect(screen.getByText('7 online agora')).toBeInTheDocument();
  });

  it('exposes exactly two primary CTAs (projects + ask) at a >=44px touch target', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero();

    const primaryGroup = await screen.findByTestId('hero-cta-primary');
    const controls = primaryGroup.querySelectorAll('a, button');
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      expect(control.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
    }

    expect(within(primaryGroup).getByRole('link', { name: /see the projects/i })).toBeInTheDocument();
    expect(within(primaryGroup).getByRole('button', { name: /ask the ai/i })).toBeInTheDocument();
  });

  it('demotes About/CV to a quieter secondary row, still at a >=44px touch target', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero();

    const secondaryGroup = await screen.findByTestId('hero-cta-secondary');
    const controls = secondaryGroup.querySelectorAll('a, button');
    expect(controls.length).toBeGreaterThanOrEqual(2);
    for (const control of controls) {
      expect(control.className).toMatch(/min-h-11|h-11|min-h-\[44px\]/);
    }

    expect(within(secondaryGroup).getByRole('link', { name: /about me/i })).toBeInTheDocument();
    expect(within(secondaryGroup).getByRole('link', { name: /download cv/i })).toBeInTheDocument();
  });

  it('stacks the primary CTAs full-width on mobile and lets them size naturally from sm upward (no ragged wrap)', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });

    await renderHero();

    const primaryGroup = await screen.findByTestId('hero-cta-primary');
    expect(primaryGroup.className).toMatch(/flex-col/);

    for (const control of primaryGroup.querySelectorAll('a, button')) {
      expect(control.className).toMatch(/w-full/);
      expect(control.className).toMatch(/sm:w-auto/);
    }
  });
});
