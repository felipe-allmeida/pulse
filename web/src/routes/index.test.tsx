import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import i18n from '@/i18n';
import { AskWidget } from '@/components/ask/ask-widget';
import { profile } from '@/content/profile';
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
      {/*
        AskWidget isn't part of the `/` route tree in production — it's
        mounted once in `__root.tsx`, alongside the route's <Outlet />. It's
        rendered here too so the "separate corners" test below reflects the
        real composed page, where both floating elements are on screen at
        once.
      */}
      <RouterProvider router={router} />
      <AskWidget />
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

  it('composes the hero, engineering showcase, and the existing live dashboard with exactly one h1', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({
      data: [{ lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T10:00:00Z' }],
      isLoading: false,
    });

    await renderIndexRoute();

    // Hero
    expect(await screen.findByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see the projects/i })).toHaveAttribute('href', '/projects');

    // EngineeringShowcase
    expect(screen.getByText(/what you're looking at/i)).toBeInTheDocument();

    // Existing dashboard, still present and mounted below
    expect(screen.getByText('Live dashboard')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /world map of live visitor locations/i })).toBeInTheDocument();

    // Exactly one h1 on the whole composed page
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('keeps the floating Reactions card and the Ask widget trigger in separate corners (no overlap)', async () => {
    await renderIndexRoute();

    const reactionsCard = screen.getByText('React').closest('.fixed');
    const askTrigger = screen.getByRole('button', { name: /ask about felipe/i });

    // Both are `fixed bottom-6 …`, so distinct left/right anchoring is what
    // keeps them apart on every breakpoint — see the comment above the
    // Reactions wrapper in routes/index.tsx.
    expect(reactionsCard).not.toBeNull();
    expect(reactionsCard).toHaveClass('left-6');
    expect(reactionsCard).not.toHaveClass('right-6');

    expect(askTrigger).toHaveClass('right-6');
    expect(askTrigger).not.toHaveClass('left-6');
  });

  it('shows pt-BR hero copy on the composed home', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });

    await renderIndexRoute('pt-BR');

    expect(await screen.findByText(/sistema distribuído ao vivo/)).toBeInTheDocument();
    expect(screen.getByText('Painel ao vivo')).toBeInTheDocument();
  });
});
