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
