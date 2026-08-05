import { useEffect, useRef } from 'react';
import { useVisits } from '@/lib/api';
import { useEventStore } from '@/stores/event-store';
import type { VisitPoint } from '@/types/pulse';

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
 * Mounted once (e.g. on the dashboard route) to bridge polled `useVisits()`
 * data into the live event feed. Diffs each poll against the previously seen
 * set of visit identities and pushes a `kind: 'visit'` event for each newly
 * appeared point. The very first batch is only used to seed the seen-set —
 * it is not pushed — otherwise the feed would flood with the entire initial
 * page of visits on mount.
 */
export function useVisitFeed(): void {
  const { data } = useVisits();
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;

    if (seenRef.current === null) {
      seenRef.current = new Set(data.map(visitIdentity));
      return;
    }

    const fresh = newVisits(seenRef.current, data);
    for (const point of fresh) {
      seenRef.current.add(visitIdentity(point));
      useEventStore.getState().push({
        kind: 'visit',
        label: `Visit from ${point.city}, ${point.country}`,
        at: point.at,
      });
    }
  }, [data]);
}
