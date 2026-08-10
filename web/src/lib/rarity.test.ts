import { describe, expect, it } from 'vitest';
import { cumulativeOneIn, rarityOf } from './rarity';
import type { ClientSignals } from './client-signals';
import type { VisitorContext } from '@/types/pulse';

function signals(overrides: Partial<ClientSignals> = {}): ClientSignals {
  return {
    language: 'pt-BR',
    languages: ['pt-BR', 'pt', 'en'],
    timeZone: 'America/Sao_Paulo',
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 2,
    cores: 8,
    memoryGb: 8,
    touchPoints: 0,
    doNotTrack: false,
    platform: 'macOS',
    colorScheme: 'dark',
    ...overrides,
  };
}

function visitor(overrides: Partial<VisitorContext> = {}): VisitorContext {
  return {
    geo: { city: 'Porto Alegre', country: 'Brazil', lat: -30.03, lon: -51.23 },
    totalVisits: 99,
    cityVisits: 9,
    lastCityVisitAt: null,
    visitsLast24h: 0,
    previous: null,
    ...overrides,
  };
}

describe('rarityOf', () => {
  it('measures the city dimension from the site\'s own history rather than estimating it', () => {
    const rarity = rarityOf(signals(), visitor({ totalVisits: 99, cityVisits: 9 }));
    const city = rarity.dimensions.find((d) => d.key === 'city');

    expect(city?.source).toBe('measured');
    // 9 prior visits from the city + this one, over 99 + this one.
    expect(city?.share).toBeCloseTo(0.1, 5);
  });

  it('never lets a first-ever city divide by zero into certainty', () => {
    const rarity = rarityOf(signals(), visitor({ totalVisits: 0, cityVisits: 0 }));

    // No history at all means no honest city measurement to report.
    expect(rarity.dimensions.find((d) => d.key === 'city')).toBeUndefined();
    expect(Number.isFinite(rarity.oneIn)).toBe(true);
  });

  it('reports a first-ever visitor from a city as one of the whole history', () => {
    const rarity = rarityOf(signals(), visitor({ totalVisits: 99, cityVisits: 0 }));
    const city = rarity.dimensions.find((d) => d.key === 'city');

    expect(city?.share).toBeCloseTo(0.01, 5);
  });

  it('omits the city dimension entirely when geo was never resolved', () => {
    const rarity = rarityOf(signals(), visitor({ geo: null }));

    expect(rarity.dimensions.find((d) => d.key === 'city')).toBeUndefined();
  });

  it('skips signals the browser withheld instead of inventing values', () => {
    const rarity = rarityOf(
      signals({ timeZone: null, cores: null, touchPoints: null, doNotTrack: null, screenWidth: null }),
    );
    const keys = rarity.dimensions.map((d) => d.key);

    expect(keys).not.toContain('timeZone');
    expect(keys).not.toContain('cores');
    expect(keys).not.toContain('touch');
    expect(keys).not.toContain('doNotTrack');
    expect(keys).not.toContain('resolution');
    expect(keys).toContain('language');
  });

  it('treats an unusual screen size as rarer than a common one', () => {
    const common = rarityOf(signals({ screenWidth: 1920, screenHeight: 1080 }));
    const unusual = rarityOf(signals({ screenWidth: 1337, screenHeight: 743 }));

    expect(unusual.oneIn).toBeGreaterThan(common.oneIn);
  });

  it('treats a non-English browser as rarer than an English one', () => {
    const english = rarityOf(signals({ language: 'en-US' }));
    const portuguese = rarityOf(signals({ language: 'pt-BR' }));

    expect(portuguese.oneIn).toBeGreaterThan(english.oneIn);
  });

  it('makes Do Not Track being on the unusual case', () => {
    const off = rarityOf(signals({ doNotTrack: false }));
    const on = rarityOf(signals({ doNotTrack: true }));

    // The irony the page points at: switching the privacy flag on makes a
    // browser stand out more, not less.
    expect(on.oneIn).toBeGreaterThan(off.oneIn);
  });

  it('expresses the same figure as bits of entropy', () => {
    const rarity = rarityOf(signals());

    expect(rarity.bits).toBeCloseTo(Math.log2(1 / rarity.share), 6);
  });

  it('produces a usable result with no signals and no visitor at all', () => {
    const rarity = rarityOf(
      signals({
        language: 'unknown',
        timeZone: null,
        screenWidth: null,
        screenHeight: null,
        cores: null,
        touchPoints: null,
        doNotTrack: null,
      }),
    );

    expect(rarity.dimensions).toHaveLength(0);
    expect(rarity.oneIn).toBe(1);
    expect(rarity.bits).toBe(0);
  });
});

describe('cumulativeOneIn', () => {
  it('multiplies each dimension into the running total', () => {
    const running = cumulativeOneIn([
      { key: 'a', value: 'a', share: 0.5, source: 'estimated' },
      { key: 'b', value: 'b', share: 0.5, source: 'estimated' },
      { key: 'c', value: 'c', share: 0.25, source: 'estimated' },
    ]);

    // 1 in 2, then 1 in 4, then 1 in 16 — the escalation the section exists for.
    expect(running).toEqual([2, 4, 16]);
  });

  it('returns nothing when there are no dimensions', () => {
    expect(cumulativeOneIn([])).toEqual([]);
  });
});
