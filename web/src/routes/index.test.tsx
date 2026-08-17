import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import i18n from '@/i18n';
import { profile } from '@/content/profile';
import { useEventStore } from '@/stores/event-store';
import type { Locale } from '@/content/types';

const useMetricsMock = vi.fn();
const useVisitsMock = vi.fn();
const useVisitorMock = vi.fn(() => ({ data: undefined }));

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisits: () => useVisitsMock(),
  useVisitor: () => useVisitorMock(),
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

describe('Index route (portfolio home)', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [], seenVisits: new Set() });
    useMetricsMock.mockReturnValue({ data: undefined, isLoading: true });
    useVisitsMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  it('renders the "How can I help you?" section in en', async () => {
    await renderIndexRoute('en');

    expect(await screen.findByRole('heading', { name: 'How can I help you?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send a pulse/i })).not.toBeInTheDocument();
  });

  it('renders the "Como eu posso te ajudar?" section in pt-BR', async () => {
    await renderIndexRoute('pt-BR');

    expect(await screen.findByRole('heading', { name: 'Como eu posso te ajudar?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar um pulso/i })).not.toBeInTheDocument();
  });

  it('places the help section between the hero and the engineering showcase in DOM order', async () => {
    await renderIndexRoute();

    // The router is code-split, so wait for whatever resolves first — same
    // reasoning as the composed test below. Once that settles, the rest of
    // the tree (including EngineeringShowcase, in the same chunk) is present
    // too, so the remaining queries can be synchronous.
    const heroHeading = await screen.findByRole('heading', { level: 1, name: profile.name });
    const helpHeading = screen.getByRole('heading', { name: 'How can I help you?' });

    // Hero's own tech-stack chips also say "RabbitMQ" (the stack list), so
    // there are two matches on the composed page: Hero's chip (always
    // before the help heading) and the architecture diagram's node label.
    // Anchoring on "whichever RabbitMQ comes after the help heading" isolates
    // the diagram's copy without depending on markup only the diagram has —
    // the same node the deleted engineering-showcase.test.tsx test anchored
    // on when EngineeringShowcase was rendered in isolation.
    const rabbitNodes = screen.getAllByText('RabbitMQ');
    const diagramNode = rabbitNodes.find(
      // eslint-disable-next-line no-bitwise
      (node) => helpHeading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(diagramNode, 'expected one "RabbitMQ" node — the diagram\'s — after the help heading').toBeDefined();

    // DOCUMENT_POSITION_FOLLOWING means the second node comes after the
    // first in DOM order.
    // eslint-disable-next-line no-bitwise
    expect(heroHeading.compareDocumentPosition(helpHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('composes the hero, engineering showcase, and a compact live-proof block, with exactly one h1', async () => {
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

    // Compact live-proof block: map (carrying the live counters in its own
    // header) + event stream + a link out to the full panel.
    expect(screen.getByText('Watch it happen')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /world map of live visitor locations/i })).toBeInTheDocument();
    expect(screen.getByText('Active connections')).toBeInTheDocument();
    expect(screen.getByText('Live activity')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see the full panel/i })).toHaveAttribute('href', '/live');

    // Exactly one h1 on the whole composed page
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('hangs the live counters off the map card instead of a KPI band of its own', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });

    const { container } = await renderIndexRoute();

    // The counters used to be two full-width StatCards above the map — the
    // emptiest strip in the section. They now ride in the map card's header,
    // so they share that card rather than owning one apiece.
    const mapHeading = screen.getByText('Live locations');
    const mapCard = mapHeading.closest('[data-slot="card"]');
    expect(mapCard).not.toBeNull();
    expect(mapCard).toContainElement(screen.getByText('Active connections'));
    expect(mapCard).toContainElement(screen.getByText('Total visits'));

    // Three cards would mean the KPI band survived; the block is map + feed.
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(2);

    // The sparklines stay on /live, where KpiRow is untouched.
    expect(container.querySelector('.recharts-responsive-container')).toBeNull();
  });

  it('shows the recent visits in the feed on arrival, without waiting for a new one', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({
      data: [
        { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:55:00Z' },
        { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T09:59:00Z' },
      ],
      isLoading: false,
    });

    await renderIndexRoute();

    // The feed used to drop the whole first batch, so a reader landing on `/`
    // saw an empty column beside a map full of dots until a stranger happened
    // to visit while they watched.
    const items = await screen.findAllByRole('listitem');
    const feedItems = items.filter((item) => item.textContent?.includes('Visit from'));
    expect(feedItems).toHaveLength(2);
    expect(feedItems[0].textContent).toContain('NYC');
    expect(feedItems[1].textContent).toContain('Lisbon');
  });

  it('lets the map set the row height, with the feed filling it out of flow', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });

    const { container } = await renderIndexRoute();

    const row = container.querySelector('.lg\\:grid-cols-5');
    expect(row).not.toBeNull();

    // The map is the fixed-aspect figure and the feed grows with traffic. Left
    // in flow the feed eventually outgrew the map and the grid answered by
    // stretching the map's card, leaving a band of empty card under it.
    const mapCell = row?.querySelector('.lg\\:col-span-3');
    expect(mapCell).toContainElement(screen.getByRole('img', { name: /world map of live visitor locations/i }));
    const feedCell = row?.querySelector('.lg\\:col-span-2');
    expect(feedCell).toHaveClass('relative');
    expect(feedCell?.querySelector('.lg\\:absolute')).toContainElement(screen.getByText('Live activity'));

    // Two fifths, not one third: at a third the rows wrapped mid-place-name.
    expect(row?.querySelector('.lg\\:col-span-1')).toBeNull();
  });

  it('does NOT render the full widget stack that moved to /live', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });

    await renderIndexRoute();

    expect(screen.queryByText('Visits over time')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent visits')).not.toBeInTheDocument();
  });

  it('shows pt-BR hero and live-proof copy on the composed home', async () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 120 }, isLoading: false });
    useVisitsMock.mockReturnValue({ data: [], isLoading: false });

    await renderIndexRoute('pt-BR');

    expect(await screen.findByText(/sistema distribuído ao vivo/)).toBeInTheDocument();
    expect(screen.getByText('Veja acontecendo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver o painel completo/i })).toHaveAttribute('href', '/live');
  });
});
