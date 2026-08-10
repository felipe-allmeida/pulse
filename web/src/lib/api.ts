import { useQuery } from '@tanstack/react-query';
import type { Metrics, VisitorContext, VisitPoint } from '@/types/pulse';

export async function fetchMetrics(): Promise<Metrics> {
  const r = await fetch('/api/metrics');
  if (!r.ok) throw new Error('metrics');
  return r.json();
}

export async function fetchVisits(): Promise<VisitPoint[]> {
  const r = await fetch('/api/map');
  if (!r.ok) throw new Error('map');
  return r.json();
}

export async function fetchVisitor(): Promise<VisitorContext> {
  const r = await fetch('/api/visitor');
  if (!r.ok) throw new Error('visitor');
  return r.json();
}

export const useMetrics = () => useQuery({ queryKey: ['metrics'], queryFn: fetchMetrics, refetchInterval: 3000 });
/**
 * Deliberately never refetches: this describes the visitor's arrival, so it is
 * fixed for the session. Re-polling it would make the greeting mutate under the
 * reader mid-sentence.
 */
export const useVisitor = () =>
  useQuery({ queryKey: ['visitor'], queryFn: fetchVisitor, staleTime: Infinity, refetchOnWindowFocus: false });
export const useVisits = () => useQuery({ queryKey: ['visits'], queryFn: fetchVisits, refetchInterval: 10000 });
