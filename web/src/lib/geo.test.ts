import { describe, expect, it } from 'vitest';
import { bucketByHour, countryCounts, matchCountryName } from './geo';

describe('geo', () => {
  it('aggregates visit points by normalized country', () => {
    const pts = [
      { lat: 0, lon: 0, city: 'Lisbon', country: 'Portugal', at: 'x' },
      { lat: 0, lon: 0, city: 'Porto', country: 'Portugal', at: 'x' },
      { lat: 0, lon: 0, city: 'NYC', country: 'United States', at: 'x' },
    ];
    const c = countryCounts(pts as any);
    expect(c.get(matchCountryName('Portugal'))).toBe(2);
    // topojson name variant maps to the same key as the GeoLite2 name
    expect(matchCountryName('United States of America')).toBe(matchCountryName('United States'));
  });

  it('normalizes case and whitespace', () => {
    expect(matchCountryName('  Portugal  ')).toBe(matchCountryName('portugal'));
    expect(matchCountryName('PORTUGAL')).toBe(matchCountryName('portugal'));
  });

  it('maps common GeoLite2/topojson mismatches to the same key', () => {
    expect(matchCountryName('Russian Federation')).toBe(matchCountryName('Russia'));
    expect(matchCountryName('Republic of Korea')).toBe(matchCountryName('South Korea'));
    expect(matchCountryName('Czech Republic')).toBe(matchCountryName('Czechia'));
  });

  it('defaults to normalized input for unknown names', () => {
    expect(matchCountryName('Wakanda')).toBe('wakanda');
  });
});

describe('bucketByHour', () => {
  it('groups points sharing an hour into one bucket with the right count, sorted ascending', () => {
    const pts = [
      { lat: 0, lon: 0, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T21:15:00.000Z' },
      { lat: 0, lon: 0, city: 'Porto', country: 'Portugal', at: '2026-08-04T21:45:00.000Z' },
      { lat: 0, lon: 0, city: 'NYC', country: 'United States', at: '2026-08-04T09:05:00.000Z' },
    ];
    const buckets = bucketByHour(pts as any);
    expect(buckets).toEqual([
      { hour: '2026-08-04T09:00', count: 1 },
      { hour: '2026-08-04T21:00', count: 2 },
    ]);
  });

  it('returns an empty array for no points', () => {
    expect(bucketByHour([])).toEqual([]);
  });

  it('is deterministic and does not depend on Date.now', () => {
    const pts = [{ lat: 0, lon: 0, city: 'X', country: 'Y', at: '2020-01-01T00:30:00.000Z' }];
    const a = bucketByHour(pts as any);
    const b = bucketByHour(pts as any);
    expect(a).toEqual(b);
    expect(a).toEqual([{ hour: '2020-01-01T00:00', count: 1 }]);
  });
});
