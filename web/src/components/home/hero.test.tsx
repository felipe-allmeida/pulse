import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/content/types';
import { profile } from '@/content/profile';
import { renderWithI18n } from '@/test/render-with-i18n';

const useMetricsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
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
});
