import { describe, expect, it } from 'vitest';
import { deriveSegments } from './derived-segments';
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
    os: 'macOS',
    browser: 'Safari',
    userAgent: 'Mozilla/5.0',
    referrer: null,
    localHour: 14,
    localDay: 2,
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

const find = (list: ReturnType<typeof deriveSegments>, id: string) => list.find((s) => s.id === id);

describe('deriveSegments', () => {
  it('names a recognisable traffic source rather than a bare hostname', () => {
    const segment = find(deriveSegments(signals({ referrer: 'www.linkedin.com' })), 'traffic.source');

    // "You came from LinkedIn" is the most legible thing on the page; a raw
    // hostname reads as noise by comparison.
    expect(segment?.name).toBe('LinkedIn');
    expect(segment?.confidence).toBe('observed');
  });

  it('passes through an unrecognised referrer instead of dropping it', () => {
    expect(find(deriveSegments(signals({ referrer: 'example.dev' })), 'traffic.source')?.name).toBe('example.dev');
  });

  it('reports a direct arrival as direct', () => {
    expect(find(deriveSegments(signals({ referrer: null })), 'traffic.source')?.name).toBe('direct');
  });

  it('marks the price-bracket guess as a guess', () => {
    const segment = find(deriveSegments(signals()), 'device.tier');

    // The honesty that makes this section defensible: a price bracket read off
    // pixel density is a guess, and the JSON says so.
    expect(segment?.confidence).toBe('guessed');
  });

  it('separates a high-end device from a budget one', () => {
    const premium = find(deriveSegments(signals({ pixelRatio: 3, cores: 10, memoryGb: 16, os: 'iOS' })), 'device.tier');
    const budget = find(
      deriveSegments(signals({ pixelRatio: 1, cores: 2, memoryGb: 2, os: 'Android' })),
      'device.tier',
    );

    expect(premium?.name).toBe('high-end-device');
    expect(budget?.name).toBe('budget-device');
  });

  it('omits the device tier when there is nothing to base it on', () => {
    expect(find(deriveSegments(signals({ pixelRatio: null, cores: null, memoryGb: null })), 'device.tier')).toBeUndefined();
  });

  it('reads the daypart off the visitor own clock', () => {
    expect(find(deriveSegments(signals({ localHour: 10, localDay: 2 })), 'context.daypart')?.name).toBe(
      'weekday-morning',
    );
    expect(find(deriveSegments(signals({ localHour: 22, localDay: 6 })), 'context.daypart')?.name).toBe(
      'weekend-evening',
    );
    expect(find(deriveSegments(signals({ localHour: 3, localDay: 0 })), 'context.daypart')?.name).toBe('weekend-night');
  });

  it('turns the privacy flags themselves into a segment', () => {
    const segment = find(deriveSegments(signals({ doNotTrack: true, browser: 'Firefox' })), 'audience.privacy');

    // The sour joke the page is making: the flags set to avoid profiling are
    // themselves profilable.
    expect(segment?.name).toContain('dnt-on');
    expect(segment?.name).toContain('privacy-leaning-browser');
  });

  it('leaves the privacy segment off when there is no signal to report', () => {
    expect(find(deriveSegments(signals({ doNotTrack: false, browser: 'Chrome' })), 'audience.privacy')).toBeUndefined();
  });

  it('uses the resolved country for the market, and omits it without geo', () => {
    expect(find(deriveSegments(signals(), visitor()), 'geo.market')?.name).toBe('Brazil');
    expect(find(deriveSegments(signals(), visitor({ geo: null })), 'geo.market')).toBeUndefined();
  });

  it('always produces at least the traffic source, whatever the browser withheld', () => {
    const bare = deriveSegments(
      signals({
        language: 'unknown',
        touchPoints: null,
        pixelRatio: null,
        cores: null,
        memoryGb: null,
        doNotTrack: null,
      }),
    );

    expect(bare.length).toBeGreaterThan(0);
    expect(find(bare, 'traffic.source')).toBeDefined();
  });
});
