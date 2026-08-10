import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { renderWithI18n } from '@/test/render-with-i18n';
import type { Locale } from '@/content/types';
import type { VisitorContext } from '@/types/pulse';

const useVisitorMock = vi.fn<() => { data: VisitorContext | undefined }>(() => ({ data: undefined }));

vi.mock('@/lib/api', () => ({
  useVisitor: () => useVisitorMock(),
}));

const { WatchedPage } = await import('./watched-page');

function visitor(overrides: Partial<VisitorContext> = {}): VisitorContext {
  return {
    geo: { city: 'Porto Alegre', country: 'Brazil', lat: -30.03, lon: -51.23 },
    totalVisits: 1246,
    cityVisits: 4,
    lastCityVisitAt: new Date(Date.now() - 86_400_000).toISOString(),
    visitsLast24h: 0,
    previous: { city: 'Lisbon', country: 'Portugal', at: new Date(Date.now() - 3 * 3_600_000).toISOString() },
    ...overrides,
  };
}

async function renderWatched(locale?: Locale) {
  const rootRoute = createRootRoute({ component: () => <WatchedPage /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null });
  const liveRoute = createRoute({ getParentRoute: () => rootRoute, path: '/live', component: () => null });
  const routeTree = rootRoute.addChildren([indexRoute, liveRoute]);
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });

  const result = await renderWithI18n(<RouterProvider router={router} />, { locale });
  await screen.findByRole('heading', { level: 1 });
  return result;
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const pageText = () => document.body.textContent ?? '';

describe('WatchedPage', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    useVisitorMock.mockReturnValue({ data: visitor() });
  });

  it('renders without a visitor context rather than blocking on it', async () => {
    useVisitorMock.mockReturnValue({ data: undefined });

    await renderWatched();

    // The browser-signal sections don't need the API at all, so the page still
    // has something to say while /api/visitor is in flight or failing.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(pageText()).toContain('what your browser volunteered');
  });

  it('stacks every true history fact, not just the one the hero picked', async () => {
    await renderWatched();

    // The hero shows one; this page is where the rest of them live.
    expect(pageText()).toContain('Porto Alegre');
    expect(pageText()).toContain('Lisbon');
    expect(pageText()).toContain('1,247th');
  });

  it('builds the real bid request an exchange would broadcast', async () => {
    await renderWatched();

    // Filled from readings already taken — that it is unremarkable is the point.
    expect(pageText()).toContain('OpenRTB 2.6');
    expect(pageText()).toContain('user.data.segment');
    expect(pageText()).toContain('"bidfloor": 0.5');
  });

  it('shows the inferred-interest examples inside the JSON, where the eye lands', async () => {
    await renderWatched();

    // These used to live only in the prose below the block, where readers
    // scanning the JSON never found them.
    const json = screen.getByText(/"bidfloor": 0.5/).textContent ?? '';
    expect(json).toContain('in-market for a car');
    expect(json).toContain('new parent');
    expect(json).toContain('cardholder');
  });

  it('translates the placeholder inside the JSON along with the rest of the page', async () => {
    await renderWatched('pt-BR');

    // It is hand-written filler, not protocol, so leaving it in English left a
    // block of English sitting in the middle of a Portuguese page.
    const json = screen.getByText(/"bidfloor": 0.5/).textContent ?? '';
    expect(json).toContain('pesquisando carro');
    expect(json).not.toContain('in-market for a car');
  });

  it('leaves the segment visibly a placeholder rather than inventing one', async () => {
    await renderWatched();

    // Presenting made-up inferred interests as if they had been read would be
    // the exact dishonesty this section is about.
    const json = screen.getByText(/"bidfloor": 0.5/).textContent ?? '';
    expect(json).toContain('PLACEHOLDER');
    expect(json).toContain("can't show you yours");
  });

  it('never prints the visitor an IP back at them', async () => {
    await renderWatched();

    // The page argues against exactly this move, so the field stays withheld
    // even though a real exchange would receive it.
    expect(pageText()).toContain('withheld');
    expect(pageText()).not.toMatch(/"ip": "\d+\.\d+\.\d+\.\d+"/);
  });

  it('closes by contrasting what survived, without a lecture', async () => {
    await renderWatched();

    expect(pageText()).toContain('no field for one');
    // The old close was a whole section quoting the record and explaining
    // itself; the bid request above now carries that contrast on its own.
    expect(pageText()).not.toContain('public sealed record');
  });

  it('labels the one dimension that comes from real data', async () => {
    await renderWatched();

    // Everything else is an estimate, and conflating the two would undercut
    // the honesty the whole page trades on.
    expect(screen.getAllByText(/measured here/).length).toBeGreaterThan(0);
  });

  it('keeps the caveat about the arithmetic overstating uniqueness', async () => {
    await renderWatched();

    expect(pageText()).toContain('overstates you');
  });

  it('shows a fingerprint without storing it anywhere', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    await renderWatched();

    const fingerprint = pageText().match(/fingerprint: ([0-9a-f]{8})/)?.[1];
    expect(fingerprint).toBeDefined();

    // The page's whole argument is that it could recognise you next time and
    // chose not to, so the digest must never reach storage or a cookie.
    const writes = setItem.mock.calls;
    expect(writes.some(([, value]) => String(value).includes(fingerprint!))).toBe(false);
    // The only write the page tolerates is the visitor's own language choice,
    // which the i18n detector persists site-wide and identifies nobody.
    expect(writes.map(([key]) => key)).toEqual(writes.map(() => 'pulse.lang'));
    expect(document.cookie).toBe('');
    setItem.mockRestore();
  });

  it('offers the way onward to the live panel', async () => {
    await renderWatched();

    expect(screen.getByRole('link', { name: /what's left of you/i })).toBeInTheDocument();
  });

  it('translates the whole page', async () => {
    await renderWatched('pt-BR');

    expect(pageText()).toContain('O que eu já sei sobre você');
    expect(pageText()).toContain('quanto você vale');
    expect(pageText()).not.toContain('what your browser volunteered');
  });

  it('omits the city row when geo was never resolved', async () => {
    useVisitorMock.mockReturnValue({ data: visitor({ geo: null }) });

    await renderWatched();

    expect(screen.queryAllByText(/measured here/)).toHaveLength(0);
    expect(pageText()).not.toContain('Porto Alegre');
  });
});
