import { useEffect, useRef } from 'react';
import { useVisits } from '@/lib/api';
import { byNewest } from '@/lib/points';
import { useEventStore } from '@/stores/event-store';
import type { VisitPoint } from '@/types/pulse';

/**
 * How many of the first batch's most recent visits are replayed into the feed
 * on mount, so the panel next to the map arrives populated instead of blank.
 *
 * Sized to fill that column without scrolling on a typical desktop viewport —
 * the rest of the batch (`/api/map` returns far more) is only recorded as
 * seen, never pushed, which is what keeps the mount from flooding the store.
 */
const SEED_COUNT = 12;

/** Stable identity for a visit point, used to detect newly-appeared visits across polls. */
export function visitIdentity(point: VisitPoint): string {
  return `${point.at}|${point.lat}|${point.lon}`;
}

/**
 * Pure diff: returns the points in `current` that aren't present in `prevSeen`
 * (by {@link visitIdentity}), preserving `current`'s order.
 */
export function newVisits(prevSeen: ReadonlySet<string>, current: VisitPoint[]): VisitPoint[] {
  return current.filter((point) => !prevSeen.has(visitIdentity(point)));
}

/**
 * Mounted once per route (`/` and `/live`) to bridge polled `useVisits()` data
 * into the live event feed. Diffs each poll against the previously seen set of
 * visit identities and pushes a `kind: 'visit'` event for each newly appeared
 * point.
 *
 * The first batch is handled specially. Every point in it is recorded as seen
 * (so the next poll doesn't mistake the whole page of history for new
 * arrivals), but only the {@link SEED_COUNT} most recent are replayed into the
 * store. The feed used to push *none* of them, which left the panel beside the
 * map empty on arrival — a reader saw a blank column until a stranger happened
 * to visit while they watched, and the emptiness read as the pipeline being
 * broken rather than quiet. Replaying a bounded slice keeps the "flooding the
 * feed on mount" problem solved while making the panel true on first paint;
 * the relative timestamps ("23 min ago" vs "12s ago") already distinguish the
 * replayed history from what lands live.
 *
 * Seeding walks the slice oldest-first because `push` prepends, so the newest
 * visit ends up at the top — the same order later live arrivals produce.
 */
export function useVisitFeed(): void {
  const { data } = useVisits();
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;

    if (seenRef.current === null) {
      seenRef.current = new Set(data.map(visitIdentity));
      const seed = byNewest(data, SEED_COUNT);
      for (let i = seed.length - 1; i >= 0; i--) {
        const point = seed[i];
        useEventStore.getState().push({
          kind: 'visit',
          city: point.city,
          country: point.country,
          at: point.at,
        });
      }
      return;
    }

    const fresh = newVisits(seenRef.current, data);
    for (const point of fresh) {
      seenRef.current.add(visitIdentity(point));
      useEventStore.getState().push({
        kind: 'visit',
        city: point.city,
        country: point.country,
        at: point.at,
      });
    }
  }, [data]);
}
