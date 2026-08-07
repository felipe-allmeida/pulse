import { Activity, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMetrics } from '@/lib/api';
import { useMetricHistory } from '@/hooks/use-metric-history';

function StatCardSkeleton() {
  return (
    <Card className="border-signal/20 bg-signal-muted/10">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

export function KpiRow() {
  const { t } = useTranslation('dashboard');
  const { data, isLoading } = useMetrics();
  const history = useMetricHistory();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {isLoading || !data ? (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
        </>
      ) : (
        <>
          <StatCard
            label={t('dashboard:kpi.activeConnections')}
            value={data.activeConnections}
            icon={Activity}
            series={history.activeConnections}
          />
          <StatCard
            label={t('dashboard:kpi.totalVisits')}
            value={data.totalVisits}
            icon={Users}
            series={history.totalVisits}
          />
        </>
      )}
    </div>
  );
}
