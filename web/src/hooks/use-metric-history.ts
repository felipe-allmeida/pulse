import { useEffect, useState } from 'react';
import { useMetrics } from '@/lib/api';

/** Number of recent metric samples kept per series. */
export const HISTORY_CAP = 30;

/**
 * Pure ring-buffer append: pushes `value` onto `buffer` and drops the oldest
 * samples past `cap`. Never mutates `buffer`.
 */
export function appendSample(buffer: number[], value: number, cap: number): number[] {
  const next = [...buffer, value];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

export type MetricHistory = {
  activeConnections: number[];
  totalVisits: number[];
};

/**
 * Accumulates a client-side history of recent `useMetrics()` samples so KPI
 * cards can render a sparkline. Each time the polled metrics value changes,
 * the new sample is appended to a capped ring buffer per series.
 */
export function useMetricHistory(): MetricHistory {
  const { data } = useMetrics();
  const [activeConnections, setActiveConnections] = useState<number[]>([]);
  const [totalVisits, setTotalVisits] = useState<number[]>([]);

  useEffect(() => {
    if (!data) return;
    setActiveConnections((prev) => appendSample(prev, data.activeConnections, HISTORY_CAP));
    setTotalVisits((prev) => appendSample(prev, data.totalVisits, HISTORY_CAP));
  }, [data]);

  return { activeConnections, totalVisits };
}
