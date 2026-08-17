import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventStore } from '@/stores/event-store';
import type { VisitPoint } from '@/types/pulse';
import { newVisits, useVisitFeed, visitIdentity } from './use-visit-feed';

const useVisitsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useVisits: () => useVisitsMock(),
}));

const lisbon: VisitPoint = { lat: 38.7, lon: -9.1, city: 'Lisbon', country: 'Portugal', at: '2026-08-04T09:55:00Z' };
const nyc: VisitPoint = { lat: 40.7, lon: -74.0, city: 'NYC', country: 'United States', at: '2026-08-04T09:59:00Z' };

/** `count` distinct points, one minute apart, ordered oldest-first. */
function batchOf(count: number): VisitPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: i,
    lon: i,
    city: `City ${i}`,
    country: 'Testland',
    at: new Date(Date.UTC(2026, 7, 4, 9, i)).toISOString(),
  }));
}

describe('newVisits', () => {
  it('returns points not present in the seen set', () => {
    const seen = new Set([visitIdentity(lisbon)]);
    expect(newVisits(seen, [lisbon, nyc])).toEqual([nyc]);
  });

  it('returns an empty array when nothing is new', () => {
    const seen = new Set([visitIdentity(lisbon), visitIdentity(nyc)]);
    expect(newVisits(seen, [lisbon, nyc])).toEqual([]);
  });

  it('returns everything when the seen set is empty', () => {
    expect(newVisits(new Set(), [lisbon, nyc])).toEqual([lisbon, nyc]);
  });
});

describe('useVisitFeed', () => {
  beforeEach(() => {
    useEventStore.setState({ events: [], seenVisits: new Set() });
    useVisitsMock.mockReset();
  });

  it('replays the first batch newest-first so the feed is populated on mount', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon, nyc] });
    renderHook(() => useVisitFeed());

    expect(useEventStore.getState().events).toEqual([
      { kind: 'visit', city: 'NYC', country: 'United States', at: nyc.at },
      { kind: 'visit', city: 'Lisbon', country: 'Portugal', at: lisbon.at },
    ]);
  });

  it('seeds at most SEED_COUNT events, keeping the most recent ones', () => {
    useVisitsMock.mockReturnValue({ data: batchOf(20) });
    renderHook(() => useVisitFeed());

    const events = useEventStore.getState().events;
    expect(events).toHaveLength(10);
    // batchOf numbers cities oldest-first, so the newest ten are 10..19, and
    // the feed's top entry is the newest of all.
    expect(events[0].kind === 'visit' && events[0].city).toBe('City 19');
    expect(events[9].kind === 'visit' && events[9].city).toBe('City 10');
  });

  it('does not re-emit the first batch entries it chose not to seed', () => {
    const batch = batchOf(20);
    useVisitsMock.mockReturnValue({ data: batch });
    const { rerender } = renderHook(() => useVisitFeed());

    useVisitsMock.mockReturnValue({ data: [...batch] });
    act(() => rerender());

    expect(useEventStore.getState().events).toHaveLength(10);
  });

  it('does not re-seed when a second route mounts the hook over the same store', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon, nyc] });

    // `/` mounts the hook, then the reader walks to `/live`, which mounts its
    // own instance against the same (singleton) event store. The seen-set used
    // to be a per-instance ref, so the second mount replayed the same visits
    // and the feed showed every entry twice.
    const first = renderHook(() => useVisitFeed());
    expect(useEventStore.getState().events).toHaveLength(2);

    first.unmount();
    renderHook(() => useVisitFeed());

    expect(useEventStore.getState().events).toHaveLength(2);
  });

  it('keeps the newest on top when one poll brings back several new visits', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon] });
    const { rerender } = renderHook(() => useVisitFeed());

    const berlin: VisitPoint = {
      lat: 52.5,
      lon: 13.4,
      city: 'Berlin',
      country: 'Germany',
      at: '2026-08-04T10:05:00Z',
    };
    // `/api/map` hands back newest-first; pushing in that order would prepend
    // each in turn and leave the oldest of the batch at the top.
    useVisitsMock.mockReturnValue({ data: [berlin, nyc, lisbon] });
    act(() => rerender());

    const cities = useEventStore.getState().events.map((e) => (e.kind === 'visit' ? e.city : e.emoji));
    expect(cities).toEqual(['Berlin', 'NYC', 'Lisbon']);
  });

  it('pushes a visit event for each newly-appeared point on a later poll', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon] });
    const { rerender } = renderHook(() => useVisitFeed());

    useVisitsMock.mockReturnValue({ data: [lisbon, nyc] });
    act(() => rerender());

    expect(useEventStore.getState().events).toEqual([
      { kind: 'visit', city: 'NYC', country: 'United States', at: nyc.at },
      { kind: 'visit', city: 'Lisbon', country: 'Portugal', at: lisbon.at },
    ]);
  });

  it('does not push duplicate events for points already seen', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon] });
    const { rerender } = renderHook(() => useVisitFeed());

    useVisitsMock.mockReturnValue({ data: [lisbon] });
    act(() => rerender());

    expect(useEventStore.getState().events).toHaveLength(1);
  });

  it('does nothing while data is undefined', () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    expect(() => renderHook(() => useVisitFeed())).not.toThrow();
    expect(useEventStore.getState().events).toEqual([]);
  });
});
