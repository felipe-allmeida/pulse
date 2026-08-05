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
    useEventStore.setState({ events: [] });
    useVisitsMock.mockReset();
  });

  it('seeds the seen-set from the first batch without pushing events', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon, nyc] });
    renderHook(() => useVisitFeed());
    expect(useEventStore.getState().events).toEqual([]);
  });

  it('pushes a visit event for each newly-appeared point on a later poll', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon] });
    const { rerender } = renderHook(() => useVisitFeed());
    expect(useEventStore.getState().events).toEqual([]);

    useVisitsMock.mockReturnValue({ data: [lisbon, nyc] });
    act(() => rerender());

    expect(useEventStore.getState().events).toEqual([
      { kind: 'visit', label: 'Visit from NYC, United States', at: nyc.at },
    ]);
  });

  it('does not push duplicate events for points already seen', () => {
    useVisitsMock.mockReturnValue({ data: [lisbon] });
    const { rerender } = renderHook(() => useVisitFeed());

    useVisitsMock.mockReturnValue({ data: [lisbon] });
    act(() => rerender());

    expect(useEventStore.getState().events).toEqual([]);
  });

  it('does nothing while data is undefined', () => {
    useVisitsMock.mockReturnValue({ data: undefined });
    expect(() => renderHook(() => useVisitFeed())).not.toThrow();
    expect(useEventStore.getState().events).toEqual([]);
  });
});
