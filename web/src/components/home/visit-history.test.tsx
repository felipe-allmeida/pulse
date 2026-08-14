import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '@/test/render-with-i18n';
import type { Locale } from '@/content/types';
import type { VisitorContext } from '@/types/pulse';

const useVisitorMock = vi.fn<() => { data: VisitorContext | undefined }>(() => ({ data: undefined }));

vi.mock('@/lib/api', () => ({
  useVisitor: () => useVisitorMock(),
}));

const { VisitHistory } = await import('./visit-history');

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

/** The whole section as one flat string, so assertions ignore the <strong> splits. */
const sectionText = () => screen.getByTestId('visit-history').textContent ?? '';

async function renderSection(locale?: Locale) {
  const result = await renderWithI18n(<VisitHistory />, { locale });
  await screen.findByTestId('visit-history');
  return result;
}

describe('VisitHistory', () => {
  beforeEach(() => {
    useVisitorMock.mockReturnValue({ data: undefined });
  });

  it('renders nothing at all before the visitor context arrives', async () => {
    await renderWithI18n(<VisitHistory />);

    // A crawler, a blocked request, or the moment before /api/visitor answers:
    // no heading with an empty list under it.
    expect(screen.queryByTestId('visit-history')).toBeNull();
  });

  it('lists every true fact at once, not just the rarest one', async () => {
    useVisitorMock.mockReturnValue({
      data: visitor({
        cityVisits: 0,
        lastCityVisitAt: null,
        visitsLast24h: 7,
        previous: { city: 'Lisbon', country: 'Portugal', at: new Date(Date.now() - 3 * 3_600_000).toISOString() },
      }),
    });

    await renderSection();

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(sectionText()).toContain('first person from Porto Alegre');
    expect(sectionText()).toContain('8th person here in the last 24 hours');
    expect(sectionText()).toContain('Lisbon');
    expect(sectionText()).toContain('3 hours ago');
    // 1,246 stored visits + this one.
    expect(sectionText()).toContain('1,247th');
  });

  it('never names a city it could not resolve', async () => {
    useVisitorMock.mockReturnValue({ data: visitor({ geo: null }) });

    await renderSection();

    // Without geo the city-based facts drop out entirely rather than
    // interpolating an empty slot.
    expect(sectionText()).not.toContain('undefined');
    expect(sectionText()).not.toContain('first person from');
    expect(sectionText()).toContain("You're the");
  });

  it('translates the facts, ordinals included', async () => {
    useVisitorMock.mockReturnValue({ data: visitor() });

    await renderSection('pt-BR');

    expect(sectionText()).toContain('1.247ª');
    expect(sectionText()).toContain('sem IP');
  });
});
