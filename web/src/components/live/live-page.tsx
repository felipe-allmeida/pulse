import { useTranslation } from 'react-i18next';
import { EventFeed } from '@/components/event-feed';
import { KpiRow } from '@/components/kpi-row';
import { LiveMap } from '@/components/live-map';
import { PageShell } from '@/components/page-shell';
import { ReachRow } from '@/components/reach-row';
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
    <PageShell className="gap-8 py-16 pb-24">
      <div className="flex flex-col gap-3">
        <SectionEyebrow>{t('home:livePanel.eyebrow')}</SectionEyebrow>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t('home:livePanel.heading')}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">{t('home:livePanel.description')}</p>
      </div>

      <KpiRow />

      {/* Map sets the row height, table fills and scrolls — see RecentVisitsTable. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveMap />
        </div>
        <div className="relative">
          <div className="lg:absolute lg:inset-0">
            <RecentVisitsTable />
          </div>
        </div>
      </div>

      {/*
        The only all-time block on the page. Everything above and below it
        describes the last hours of traffic; this answers how far the site
        has travelled since the log began, which is what a ranking is
        actually good for.
      */}
      <ReachRow />

      {/*
        Same arrangement as the home page's map/feed pair: the chart is a
        fixed-aspect figure and the feed grows with traffic, so the chart
        sets the row height and the feed fills and scrolls inside it. Left
        in flow, the feed outgrew the chart and the grid answered by
        stretching the chart's card, leaving a tall empty band under the
        plot.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VisitsChart />
        <div className="relative">
          <div className="lg:absolute lg:inset-0">
            <EventFeed />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
