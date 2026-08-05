import { describe, expect, it } from 'vitest';
import { byNewest, EMPTY_POINTS } from './points';
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
