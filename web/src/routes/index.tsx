import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { EventFeed } from '@/components/event-feed';
import { KpiRow } from '@/components/kpi-row';
import { LiveMap } from '@/components/live-map';
import { Reactions } from '@/components/reactions';
import { RecentVisitsTable } from '@/components/recent-visits-table';
import { VisitsChart } from '@/components/visits-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisitFeed } from '@/hooks/use-visit-feed';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { t } = useTranslation('dashboard');
  useVisitFeed();

  return (
    <div className="flex flex-col gap-6 pb-24">
      <KpiRow />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveMap />
        </div>
        <RecentVisitsTable />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VisitsChart />
        <EventFeed />
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('dashboard:reactions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Reactions />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
