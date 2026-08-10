import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '@/test/render-with-i18n';
import type { VisitorContext } from '@/types/pulse';

const useMetricsMock = vi.fn(() => ({ data: { activeConnections: 3, totalVisits: 1246 } }));
const useVisitorMock = vi.fn<() => { data: VisitorContext | undefined }>(() => ({ data: undefined }));

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
  useVisitor: () => useVisitorMock(),
}));

const { VisitorLine } = await import('./visitor-line');

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function visitor(overrides: Partial<VisitorContext> = {}): VisitorContext {
  return {
    geo: { city: 'Porto Alegre', country: 'Brazil', lat: -30.03, lon: -51.23 },
    totalVisits: 1246,
    cityVisits: 4,
    lastCityVisitAt: new Date(Date.now() - 86_400_000).toISOString(),
    visitsLast24h: 0,
    previous: null,
    ...overrides,
  };
}

/** The rendered paragraph as one flat string, so assertions ignore the <strong> splits. */
const lineText = () => screen.getByTestId('visitor-line').textContent ?? '';

describe('VisitorLine', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    window.sessionStorage.clear();
    useVisitorMock.mockReturnValue({ data: undefined });
  });

  it('says nothing personal until the visitor context arrives', async () => {
    await renderWithI18n(<VisitorLine />);

    // The generic hook, not a half-built greeting — this is also what a crawler
    // or a JS-less client is left with.
    expect(screen.getByTestId('visitor-line')).toHaveAttribute('data-state', 'generic');
    expect(lineText()).not.toContain('Porto Alegre');
  });

  it('greets the visitor by city with their position once loaded', async () => {
    useVisitorMock.mockReturnValue({ data: visitor() });

    await renderWithI18n(<VisitorLine />);

    expect(screen.getByTestId('visitor-line')).toHaveAttribute('data-state', 'personal');
    // 1,246 stored visits + this one, formatted as an English ordinal.
    expect(lineText()).toContain('1,247th');
    expect(lineText()).toContain('Porto Alegre');
  });

  it('leads with the rarest true fact rather than the position', async () => {
    useVisitorMock.mockReturnValue({ data: visitor({ cityVisits: 0, lastCityVisitAt: null }) });

    await renderWithI18n(<VisitorLine />);

    expect(lineText()).toContain('first person from there');
    expect(lineText()).not.toContain('1,247th');
  });

  it('claims the map dot only when the visitor is actually on the map', async () => {
    useVisitorMock.mockReturnValue({ data: visitor({ geo: null }) });

    await renderWithI18n(<VisitorLine />);

    // No geo means no origin point was drawn, so pointing at one would be a lie.
    expect(lineText()).not.toContain('dot behind this text');
    expect(lineText()).toContain('No cookie');
  });

  it('never names a city it could not resolve', async () => {
    useVisitorMock.mockReturnValue({ data: visitor({ geo: null }) });

    await renderWithI18n(<VisitorLine />);

    expect(lineText()).not.toContain('undefined');
    expect(lineText()).toContain("You're the");
  });

  it('drops the word "pulsing" when the visitor asked for less motion', async () => {
    mockMatchMedia(true);
    useVisitorMock.mockReturnValue({ data: visitor() });

    await renderWithI18n(<VisitorLine />);

    // The map draws a single static frame under reduced motion, so nothing pulses.
    expect(lineText()).toContain('lit dot behind this text');
    expect(lineText()).not.toContain('pulsing');
  });

  it('translates the whole greeting, ordinal included', async () => {
    useVisitorMock.mockReturnValue({ data: visitor() });

    await renderWithI18n(<VisitorLine />, { locale: 'pt-BR' });

    expect(lineText()).toContain('1.247ª');
    expect(lineText()).toContain('Nenhum cookie');
  });

  it('names the previous visitor and how long ago they came', async () => {
    useVisitorMock.mockReturnValue({
      data: visitor({
        previous: { city: 'Lisbon', country: 'Portugal', at: new Date(Date.now() - 3 * 3_600_000).toISOString() },
      }),
    });

    await renderWithI18n(<VisitorLine />);

    expect(lineText()).toContain('Lisbon');
    expect(lineText()).toContain('3 hours ago');
  });

  it('advances to a different fact on the next load of the session', async () => {
    const data = visitor({
      cityVisits: 0,
      lastCityVisitAt: null,
      previous: { city: 'Lisbon', country: 'Portugal', at: new Date(Date.now() - 3 * 3_600_000).toISOString() },
    });
    useVisitorMock.mockReturnValue({ data });

    const first = await renderWithI18n(<VisitorLine />);
    const firstText = lineText();
    first.unmount();

    await renderWithI18n(<VisitorLine />);

    expect(lineText()).not.toBe(firstText);
  });

  it('still greets the visitor when session storage is unavailable', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    useVisitorMock.mockReturnValue({ data: visitor() });

    await renderWithI18n(<VisitorLine />);

    expect(screen.getByTestId('visitor-line')).toHaveAttribute('data-state', 'personal');
    getItem.mockRestore();
  });
});
