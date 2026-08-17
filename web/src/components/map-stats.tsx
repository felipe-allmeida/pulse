import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetrics } from '@/lib/api';

type StatProps = {
  label: string;
  value: number;
};

function Stat({ label, value }: StatProps) {
  const { i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[0.625rem] tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
      <span className="font-mono text-xl leading-none font-bold tabular-nums text-foreground">
        {new Intl.NumberFormat(i18n.language).format(value)}
      </span>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-5 w-12" />
    </div>
  );
}

/**
 * The two live counters, compact enough to sit in `LiveMap`'s card header.
 *
 * Same numbers and same `useMetrics()` source as `KpiRow` — no extra request,
 * since both share one query. What it drops is `StatCard`'s framing: a card
 * apiece, an icon, and the sparkline. On the home page those two cards were a
 * full-width band holding one number each, the emptiest strip on the page;
 * folded into the map's header they read as that map's readout and give the
 * band's height back to the block. The sparkline stays available on `/live`,
 * where `KpiRow` is untouched and has the room for it.
 */
export function MapStats() {
  const { t } = useTranslation('dashboard');
  const { data, isLoading } = useMetrics();

  return (
    <div className="flex items-start gap-6">
      {isLoading || !data ? (
        <>
          <StatSkeleton />
          <StatSkeleton />
        </>
      ) : (
        <>
          <Stat label={t('dashboard:kpi.activeConnections')} value={data.activeConnections} />
          <Stat label={t('dashboard:kpi.totalVisits')} value={data.totalVisits} />
        </>
      )}
    </div>
  );
}
