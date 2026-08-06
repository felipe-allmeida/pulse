import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import i18n from '@/i18n';
import { useEventStore } from '@/stores/event-store';
import type { Locale } from '@/content/types';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn();
const usePulseHubMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
}));

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

// Import the route module the same way production does: the real, code-split
// `Route`. `autoCodeSplitting` (vite.config.ts) turns `Route.options.component`
// into a component that suspends while its chunk loads, so the router is
// preloaded via `router.load()` before rendering — this resolves the lazy
// chunk deterministically instead of racing it against `act`/`findBy` timing.
const { Route: IndexRouteImport } = await import('./index');

async function renderIndexRoute(locale: Locale = 'en') {
  await i18n.changeLanguage(locale);

  const rootRoute = createRootRoute({});
  // Mirrors the `.update(...)` call TanStack Router's codegen emits in
  // routeTree.gen.ts to attach a file route to its parent — that generated
  // file casts the same shape `as any`, since `IndexRouteImport` isn't
  // publicly typed to accept `id`/`path`/`getParentRoute` post-construction.
  const indexRoute = IndexRouteImport.update({
    id: '/',
    path: '/',
    getParentRoute: () => rootRoute,
  } as unknown as Parameters<typeof IndexRouteImport.update>[0]);
  const routeTree = rootRoute.addChildren([indexRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  await router.load();

  return render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
}

describe('Index dashboard route', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [] });
    useMetricsMock.mockReturnValue({ data: undefined, isLoading: true });
    useVisitsMock.mockReturnValue({ data: undefined, isLoading: true });
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react: vi.fn() });
  });

  it('renders the "React" reactions card title in en', async () => {
    await renderIndexRoute('en');

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders the "Reagir" reactions card title in pt-BR', async () => {
    await renderIndexRoute('pt-BR');

    expect(screen.getByText('Reagir')).toBeInTheDocument();
  });
});
