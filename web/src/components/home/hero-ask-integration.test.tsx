import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { useAskWidgetStore } from '@/stores/ask-widget-store';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn(() => ({ data: undefined }));
const useVisitorMock = vi.fn(() => ({ data: undefined }));

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
  useVisitor: () => useVisitorMock(),
}));

vi.mock('@/lib/ask', () => ({ streamAsk: vi.fn(async () => {}) }));

const { Hero } = await import('./hero');
const { AskWidget } = await import('@/components/ask/ask-widget');

/**
 * Integration coverage for the shared Ask-widget open-state: the Hero's
 * "Ask the AI" CTA and the AskWidget itself are two independent components
 * (the widget is normally mounted once in `__root.tsx`, separately from the
 * hero) that must agree on "open" purely through `useAskWidgetStore` — no
 * DOM-id hack, no prop drilling.
 */
function renderHeroWithAskWidget() {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Hero />
        <AskWidget />
      </>
    ),
  });
  const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () => null });
  const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', component: () => null });
  const routeTree = rootRoute.addChildren([aboutRoute, projectsRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  return renderWithI18n(<RouterProvider router={router} />);
}

describe('Hero Ask CTA + AskWidget integration', () => {
  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false });
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 100 } });
  });

  it('opens the Ask widget via the shared store when the hero CTA is clicked', async () => {
    await renderHeroWithAskWidget();

    // The widget starts closed: its sheet content isn't in the document.
    expect(screen.queryByText(/ai assistant/i)).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /ask the ai about me/i }));

    await waitFor(() => expect(screen.getByText(/ai assistant/i)).toBeInTheDocument());
    expect(useAskWidgetStore.getState().isOpen).toBe(true);
  });
});
