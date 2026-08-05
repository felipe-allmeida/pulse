import { useQuery } from '@tanstack/react-query';
import type { Metrics, VisitPoint } from '@/types/pulse';

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

export const useMetrics = () => useQuery({ queryKey: ['metrics'], queryFn: fetchMetrics, refetchInterval: 3000 });
export const useVisits = () => useQuery({ queryKey: ['visits'], queryFn: fetchVisits, refetchInterval: 10000 });
