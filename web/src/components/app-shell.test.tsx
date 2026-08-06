import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => ({ connection: 'connected', count: 4, react: vi.fn() }),
}));

const { AppShell } = await import('./app-shell');

function renderAppShell() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppShell>
        <div>page content</div>
      </AppShell>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () => null });
  const projectsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/projects',
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, projectsRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return render(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  it('renders the wordmark, status widgets, and children', async () => {
    renderAppShell();

    expect(await screen.findByText(/pulse/i)).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByText('4 online')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('renders the header inside a banner landmark with the nav links and the Ask trigger', async () => {
    renderAppShell();

    const banner = await screen.findByRole('banner');
    expect(within(banner).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(banner).getAllByRole('link', { name: /contact/i }).length).toBeGreaterThan(0);
    expect(within(banner).getAllByRole('button', { name: /ask the ai/i }).length).toBeGreaterThan(0);
  });
});
