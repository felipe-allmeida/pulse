import { describe, expect, it } from 'vitest';
import { formatOrdinal, formatTimeAgo, pickVisitorFact } from './visitor-fact';
import type { VisitorContext } from '@/types/pulse';

const NOW = new Date('2026-08-10T12:00:00Z').getTime();
const daysBefore = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

function context(overrides: Partial<VisitorContext> = {}): VisitorContext {
  return {
    geo: { city: 'Porto Alegre', country: 'Brazil', lat: -30.03, lon: -51.23 },
    totalVisits: 1246,
    cityVisits: 4,
    lastCityVisitAt: daysBefore(1),
    visitsLast24h: 0,
    previous: null,
    ...overrides,
  };
}

describe('pickVisitorFact', () => {
  it('counts the visitor in, since the stored totals stop at the visit before theirs', () => {
    const fact = pickVisitorFact(context({ totalVisits: 1246 }), NOW);

    expect(fact).toEqual({ kind: 'position', position: 1247 });
  });

  it('leads with never-before-seen city over any numeric fact', () => {
    const fact = pickVisitorFact(context({ cityVisits: 0, lastCityVisitAt: null }), NOW);

    expect(fact).toEqual({ kind: 'firstFromCity', city: 'Porto Alegre' });
  });

  it('reports how long a city has been quiet once it passes the threshold', () => {
    const fact = pickVisitorFact(context({ cityVisits: 4, lastCityVisitAt: daysBefore(9) }), NOW);

    expect(fact).toEqual({ kind: 'firstFromCityInDays', city: 'Porto Alegre', days: 9 });
  });

  it('stays quiet about a city that was visited recently', () => {
    const fact = pickVisitorFact(context({ cityVisits: 4, lastCityVisitAt: daysBefore(3) }), NOW);

    expect(fact.kind).not.toBe('firstFromCityInDays');
  });

  it('calls out a round-numbered arrival', () => {
    const fact = pickVisitorFact(context({ totalVisits: 999 }), NOW);

    expect(fact).toEqual({ kind: 'milestone', position: 1000 });
  });

  it('does not treat an early round number as a milestone', () => {
    // Position 100 is the first one worth announcing; anything under it is noise.
    const fact = pickVisitorFact(context({ totalVisits: 49 }), NOW);

    expect(fact.kind).not.toBe('milestone');
  });

  it('mentions the last 24 hours only when there was real activity', () => {
    const busy = pickVisitorFact(context({ visitsLast24h: 11 }), NOW);
    const quiet = pickVisitorFact(context({ visitsLast24h: 1 }), NOW);

    expect(busy).toEqual({ kind: 'recent24h', position: 12 });
    expect(quiet.kind).not.toBe('recent24h');
  });

  it('falls back to the previous visitor before the bare position', () => {
    const fact = pickVisitorFact(
      context({ previous: { city: 'Lisbon', country: 'Portugal', at: daysBefore(0.125) } }),
      NOW,
    );

    expect(fact).toMatchObject({ kind: 'previous', city: 'Lisbon' });
  });

  it('greets the very first visitor of all', () => {
    const fact = pickVisitorFact(
      context({ totalVisits: 0, cityVisits: 0, lastCityVisitAt: null, visitsLast24h: 0 }),
      NOW,
    );

    expect(fact).toEqual({ kind: 'firstEver' });
  });

  it('says something different on each reload, then wraps instead of running dry', () => {
    const ctx = context({
      cityVisits: 0,
      lastCityVisitAt: null,
      previous: { city: 'Lisbon', country: 'Portugal', at: daysBefore(0.125) },
      visitsLast24h: 11,
    });

    const kinds = [0, 1, 2, 3].map((index) => pickVisitorFact(ctx, NOW, index).kind);

    expect(kinds).toEqual(['firstFromCity', 'recent24h', 'previous', 'position']);
    // Wraps back around rather than sticking on the last one forever.
    expect(pickVisitorFact(ctx, NOW, 4).kind).toBe('firstFromCity');
  });

  it('never returns a city-based fact when geo could not be resolved', () => {
    const ctx = context({ geo: null, cityVisits: 0, lastCityVisitAt: null });

    const kinds = [0, 1, 2, 3, 4].map((index) => pickVisitorFact(ctx, NOW, index).kind);

    expect(kinds).not.toContain('firstFromCity');
    expect(kinds).not.toContain('firstFromCityInDays');
  });

  it('always produces a fact, even with an empty history and no geo', () => {
    const fact = pickVisitorFact(
      { geo: null, totalVisits: 0, cityVisits: 0, lastCityVisitAt: null, visitsLast24h: 0, previous: null },
      NOW,
    );

    expect(fact).toBeDefined();
  });
});

describe('formatOrdinal', () => {
  it('uses the invariant feminine ordinal in Portuguese', () => {
    // "pessoa" is feminine, so every Portuguese position takes the same mark.
    expect(formatOrdinal(1, 'pt-BR')).toBe('1ª');
    expect(formatOrdinal(3, 'pt-BR')).toBe('3ª');
    expect(formatOrdinal(1247, 'pt-BR')).toBe('1.247ª');
  });

  it('picks the right English suffix per number class', () => {
    expect(formatOrdinal(1, 'en')).toBe('1st');
    expect(formatOrdinal(2, 'en')).toBe('2nd');
    expect(formatOrdinal(3, 'en')).toBe('3rd');
    expect(formatOrdinal(4, 'en')).toBe('4th');
    // The teens are the classic trap — 11th/12th/13th, not 11st/12nd/13rd.
    expect(formatOrdinal(11, 'en')).toBe('11th');
    expect(formatOrdinal(12, 'en')).toBe('12th');
    expect(formatOrdinal(13, 'en')).toBe('13th');
    expect(formatOrdinal(21, 'en')).toBe('21st');
    expect(formatOrdinal(1247, 'en')).toBe('1,247th');
  });
});

describe('formatTimeAgo', () => {
  const NOW_MS = new Date('2026-08-10T12:00:00Z').getTime();
  const ago = (ms: number) => new Date(NOW_MS - ms).toISOString();

  it('falls to the coarsest unit that still reads as a real interval', () => {
    expect(formatTimeAgo(ago(3 * 3_600_000), NOW_MS, 'en')).toBe('3 hours ago');
    expect(formatTimeAgo(ago(25 * 3_600_000), NOW_MS, 'en')).toBe('1 day ago');
    expect(formatTimeAgo(ago(90_000), NOW_MS, 'en')).toBe('1 minute ago');
  });

  it('localizes the phrasing', () => {
    expect(formatTimeAgo(ago(3 * 3_600_000), NOW_MS, 'pt-BR')).toContain('3 horas');
  });

  it('does not render a future interval when clocks disagree', () => {
    // Server and browser clocks drift; a visit "in -2 minutes" must not leak out.
    const future = new Date(NOW_MS + 120_000).toISOString();

    expect(formatTimeAgo(future, NOW_MS, 'en')).toBe('1 minute ago');
  });
});
