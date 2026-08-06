import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { EngineeringShowcase } from '@/components/home/engineering-showcase';
import { Hero } from '@/components/home/hero';
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
  const { t } = useTranslation(['home', 'dashboard']);
  // Mounted once here: bridges polled visit data into the live event store
  // that both the hero's engineering showcase and the dashboard's EventFeed
  // read from.
  useVisitFeed();

  return (
    <div className="flex flex-col pb-24">
      {/*
        Hero + EngineeringShowcase are designed full-bleed (Task 1/3), but
        AppShell's <main> is `mx-auto max-w-7xl p-6` — without this breakout
        wrapper they'd sit inset by that 24px gutter and capped at 1280px,
        which reads as a visible frame around the "immersive" dark band
        (most obvious in light theme, where the gutter turns white). This
        cancels just that padding/max-width for these two sections; nothing
        else on the page (or any other route) is affected.
      */}
      <div className="-mt-6 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen">
        <Hero />
        <EngineeringShowcase />
      </div>

      <section className="px-6 py-16 sm:px-10 md:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('home:dashboard.heading')}
          </h2>

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
      </section>

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
