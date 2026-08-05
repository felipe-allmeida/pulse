import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appendSample, useMetricHistory } from './use-metric-history';

const useMetricsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  useMetrics: () => useMetricsMock(),
}));

describe('appendSample', () => {
  it('appends a value to the buffer', () => {
    expect(appendSample([1, 2, 3], 4, 10)).toEqual([1, 2, 3, 4]);
  });

  it('drops the oldest samples once the cap is exceeded', () => {
    expect(appendSample([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
  });

  it('does not mutate the input buffer', () => {
    const buffer = [1, 2, 3];
    appendSample(buffer, 4, 10);
    expect(buffer).toEqual([1, 2, 3]);
  });

  it('handles a cap of 1', () => {
    expect(appendSample([1, 2], 3, 1)).toEqual([3]);
  });
});

describe('useMetricHistory', () => {
  it('starts empty when there is no data yet', () => {
    useMetricsMock.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useMetricHistory());
    expect(result.current.activeConnections).toEqual([]);
    expect(result.current.totalVisits).toEqual([]);
  });

  it('appends a sample to both series on each metrics update', () => {
    useMetricsMock.mockReturnValue({ data: { activeConnections: 5, totalVisits: 10 } });
    const { result, rerender } = renderHook(() => useMetricHistory());

    expect(result.current.activeConnections).toEqual([5]);
    expect(result.current.totalVisits).toEqual([10]);

    useMetricsMock.mockReturnValue({ data: { activeConnections: 7, totalVisits: 12 } });
    act(() => rerender());

    expect(result.current.activeConnections).toEqual([5, 7]);
    expect(result.current.totalVisits).toEqual([10, 12]);
  });

  it('caps the history at HISTORY_CAP samples', () => {
    const { result, rerender } = renderHook(() => useMetricHistory());

    for (let i = 0; i < 35; i++) {
      useMetricsMock.mockReturnValue({ data: { activeConnections: i, totalVisits: i * 2 } });
      act(() => rerender());
    }

    expect(result.current.activeConnections).toHaveLength(30);
    expect(result.current.activeConnections[result.current.activeConnections.length - 1]).toBe(34);
  });
});
