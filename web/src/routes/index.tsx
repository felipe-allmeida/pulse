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
        else on the page (or any other route) is affected. The `w-screen`
        (100vw) here can overflow past a classic (non-overlay) scrollbar's
        width; the `overflow-x: hidden` on `body` in styles.css clips that.
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

      {/*
        Ask widget's floating trigger (ask-widget.tsx) is anchored
        `fixed right-6 bottom-6`. Two things keep this card from colliding
        with it, not just the opposite `left-6` anchor:

        1. `max-w-[216px]` caps this card's width everywhere. Left
           unconstrained, `Card`/`CardHeader`/`CardContent` have no width of
           their own, so the 8-icon `Reactions` row (flex-wrap, ~344px of
           unwrapped content) sizes the card up to its max-content width —
           216px forces it to wrap to 4 icons/row instead, which also bounds
           how far its right edge can reach on the shared bottom row above
           `md:`.
        2. Below `md:` (768px) it sits at `top-24 left-6` instead — off the
           bottom row entirely, so on real phone widths (320–414px, where
           the Ask trigger's own text can already approach the full
           viewport width) there's no shared row to collide on in the first
           place. `top-24` (96px) clears the sticky header (~60–64px tall)
           with margin to spare. From `md:` up there's enough width for
           both the capped card and the trigger on the same bottom row —
           see the space math in task-5-report.md's "Fix round 1" section.

        routes/index.test.tsx locks all of this: the left/right corner
        classes, the width cap, and the mobile top-position classes.
      */}
      <div className="fixed top-24 left-6 z-50 max-w-[216px] md:top-auto md:bottom-6">
        <Card className="border-signal/20 shadow-lg">
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
