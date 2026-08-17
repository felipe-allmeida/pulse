import { useEffect } from 'react';
import { useVisits } from '@/lib/api';
import { byNewest } from '@/lib/points';
import { useEventStore } from '@/stores/event-store';
import type { VisitPoint } from '@/types/pulse';

/**
 * How many of the first batch's most recent visits are replayed into the feed
 * on mount, so the panel next to the map arrives populated instead of blank.
 *
 * Measured, not guessed: the feed takes its height from the map beside it, and
 * ten rows are what fit there on a desktop viewport without a scrollbar. The
 * list still scrolls — that is what absorbs live arrivals as they stack on top
 * — but it doesn't start out already hiding some of itself. The rest of the
 * batch (`/api/map` returns far more) is only recorded as seen, never pushed,
 * which is what keeps the mount from flooding the store.
 */
const SEED_COUNT = 10;

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
 * into the live event feed. Diffs each poll against the store's seen-set and
 * pushes a `kind: 'visit'` event for each newly appeared point.
 *
 * The first batch — the one that finds the seen-set empty — is handled
 * specially. Every point in it is recorded as seen (so the next poll doesn't
 * mistake the whole page of history for new arrivals), but only the
 * {@link SEED_COUNT} most recent are replayed into the store. The feed used to
 * push *none* of them, which left the panel beside the map empty on arrival —
 * a reader saw a blank column until a stranger happened to visit while they
 * watched, and the emptiness read as the pipeline being broken rather than
 * quiet. Replaying a bounded slice keeps the "flooding the feed on mount"
 * problem solved while making the panel true on first paint; the relative
 * timestamps ("23 min ago" vs "12s ago") already distinguish the replayed
 * history from what lands live.
 *
 * The seen-set lives in the store, not in a ref here, precisely because that
 * first-batch branch now has an effect. A per-instance ref reset on every
 * route change, so walking `/` -> `/live` re-entered the branch with an empty
 * set and replayed the same twelve visits the feed was already showing.
 *
 * Seeding walks the slice oldest-first because `push` prepends, so the newest
 * visit ends up at the top — the same order later live arrivals produce.
 */
export function useVisitFeed(): void {
  const { data } = useVisits();

  useEffect(() => {
    if (!data) return;

    const store = useEventStore.getState();
    const seen = store.seenVisits;

    // An empty seen-set means nothing has bridged this data yet in this
    // session — not merely that this component just mounted.
    if (seen.size === 0) {
      store.markSeen(data.map(visitIdentity));
      const seed = byNewest(data, SEED_COUNT);
      for (let i = seed.length - 1; i >= 0; i--) {
        const point = seed[i];
        store.push({ kind: 'visit', city: point.city, country: point.country, at: point.at });
      }
      return;
    }

    const fresh = newVisits(seen, data);
    if (fresh.length === 0) return;

    store.markSeen(fresh.map(visitIdentity));
    // Same oldest-first walk as the seed: when a single poll brings back more
    // than one new visit, pushing them in `/api/map`'s newest-first order
    // would leave the oldest of the batch sitting at the top of the feed.
    const ordered = byNewest(fresh);
    for (let i = ordered.length - 1; i >= 0; i--) {
      const point = ordered[i];
      store.push({ kind: 'visit', city: point.city, country: point.country, at: point.at });
    }
  }, [data]);
}
