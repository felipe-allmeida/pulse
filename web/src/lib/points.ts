import type { VisitPoint } from '@/types/pulse';

/** Shared stable empty array so consumers can safely use it as a memo/effect dependency. */
export const EMPTY_POINTS: VisitPoint[] = [];

/**
 * Sorts visit points newest-first by `at`, optionally capped to `limit` entries.
 * Does not mutate the input array.
 */
export function byNewest(points: VisitPoint[], limit?: number): VisitPoint[] {
  const sorted = [...points].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

/**
 * A bare location. Narrower than `VisitPoint` so the viewer's own geo — which
 * has no recorded visit behind it yet — can be treated as a place on the map.
 */
export type Coordinates = { lat: number; lon: number };

/**
 * Coarse geo is city-level, so every visitor from one city shares an identical
 * lat/lon. The epsilon absorbs float round-tripping through JSON; it is not
 * wide enough to merge neighbouring cities.
 */
export function isSameSpot(a: Coordinates, b: Coordinates): boolean {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lon - b.lon) < 1e-6;
}

/**
 * The points to sweep an arc out to from `origin`.
 *
 * Anything sharing the origin's coordinates is dropped: an arc from a place to
 * itself renders as a stationary smudge, and city-level geo makes self-overlap
 * routine whenever another visitor shares the viewer's city.
 */
export function selectArcTargets(
  points: VisitPoint[],
  origin: Coordinates | undefined,
  limit: number,
): VisitPoint[] {
  return points.filter((point) => !origin || !isSameSpot(point, origin)).slice(0, limit);
}
