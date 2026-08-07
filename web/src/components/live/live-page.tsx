import { useTranslation } from 'react-i18next';
import { EventFeed } from '@/components/event-feed';
import { KpiRow } from '@/components/kpi-row';
import { LiveMap } from '@/components/live-map';
import { RecentVisitsTable } from '@/components/recent-visits-table';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { VisitsChart } from '@/components/visits-chart';
import { useVisitFeed } from '@/hooks/use-visit-feed';

/**
 * The full live panel — KpiRow, LiveMap, RecentVisitsTable, VisitsChart, and
 * EventFeed, unchanged from the widgets Task 1 re-skinned to the signal
 * language. The home page (`/`) now only shows a compact slice of this same
 * data (routes/index.tsx's "live proof" block); this route is the "see
 * everything" destination that block links out to.
 */
export function LivePage() {
  const { t } = useTranslation(['home', 'dashboard']);
  // Mounted here (not just on `/`) so the event feed keeps picking up new
  // visits while this route is the one on screen — see routes/index.tsx for
  // the home page's own instance, which covers the same store while `/`
  // is mounted instead.
  useVisitFeed();

  return (
    <div className="dark bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 pb-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <SectionEyebrow>{t('home:livePanel.eyebrow')}</SectionEyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('home:livePanel.heading')}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">{t('home:livePanel.description')}</p>
        </div>

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
      </div>
    </div>
  );
}
