import { describe, expect, it } from 'vitest';
import { byNewest, EMPTY_POINTS, isSameSpot, selectArcTargets } from './points';
import type { VisitPoint } from '@/types/pulse';

const points: VisitPoint[] = [
  { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T09:00:00Z' },
  { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:59:00Z' },
  { lat: 35.7, lon: 139.7, city: 'Tokyo', country: 'Japan', at: '2026-08-04T09:30:00Z' },
];

describe('byNewest', () => {
  it('sorts points newest first', () => {
    expect(byNewest(points).map((p) => p.city)).toEqual(['Lisbon', 'Tokyo', 'NYC']);
  });

  it('caps to the given limit', () => {
    expect(byNewest(points, 2).map((p) => p.city)).toEqual(['Lisbon', 'Tokyo']);
  });

  it('does not mutate the input array', () => {
    const copy = [...points];
    byNewest(points, 1);
    expect(points).toEqual(copy);
  });

  it('returns all points when no limit is given', () => {
    expect(byNewest(points)).toHaveLength(3);
  });
});

describe('EMPTY_POINTS', () => {
  it('is a stable empty array', () => {
    expect(EMPTY_POINTS).toEqual([]);
  });
});

describe('isSameSpot', () => {
  it('treats coordinates that only differ by float noise as one place', () => {
    // City-level geo hands back the same lat/lon for everyone in a city; a JSON
    // round trip is the only thing that perturbs it.
    expect(isSameSpot({ lat: -30.03, lon: -51.23 }, { lat: -30.030000000001, lon: -51.23 })).toBe(true);
  });

  it('keeps genuinely different cities apart', () => {
    expect(isSameSpot({ lat: -30.03, lon: -51.23 }, { lat: -23.55, lon: -46.63 })).toBe(false);
  });
});

describe('selectArcTargets', () => {
  it('never sweeps an arc from the origin back to itself', () => {
    const origin = { lat: 38.7, lon: -9.1 };

    const targets = selectArcTargets(points, origin, 3);

    // Another visitor sharing the viewer's city sits at identical coordinates,
    // so an arc to them would render as a smudge on top of the origin halo.
    expect(targets.map((p) => p.city)).toEqual(['NYC', 'Tokyo']);
  });

  it('caps the number of arcs', () => {
    expect(selectArcTargets(points, undefined, 2)).toHaveLength(2);
  });

  it('keeps every point when the origin is unknown', () => {
    // No geo means no origin dot at all, so nothing needs excluding.
    expect(selectArcTargets(points, undefined, 10)).toHaveLength(3);
  });
});
