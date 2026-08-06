import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EngineeringShowcase } from '@/components/home/engineering-showcase';
import { Hero } from '@/components/home/hero';
import { EventFeed } from '@/components/event-feed';
import { KpiRow } from '@/components/kpi-row';
import { LiveMap } from '@/components/live-map';
import { Reactions } from '@/components/reactions';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisitFeed } from '@/hooks/use-visit-feed';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { t } = useTranslation(['home', 'dashboard']);
  // Mounted once here: bridges polled visit data into the live event store
  // that both the hero's engineering showcase and this page's own EventFeed
  // (below, in the live-proof block) read from. /live mounts its own
  // instance for when that route is the one on screen instead.
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

      {/*
        Portfolio-first home (visual coherence Task 2): the full ops-console
        widget stack (RecentVisitsTable, VisitsChart)
        moved to /live — a 2126px dashboard was over half the page and read
        as an ops console bolted onto a portfolio. What stays here is a
        compact, self-contained "live proof" slice: the map + 2 real stats +
        the event stream + a way to react, all pointing at /live for anyone
        who wants the rest.

        `dark` is pinned here like every other content surface (hero, showcase,
        about, projects, /live) so these widgets never render light while the
        sections above stay dark — that split is exactly the two-systems
        problem this pass removed. It also keeps `text-signal` on a dark
        ground, where it meets AA.
      */}
      <section className="dark bg-background px-6 py-16 text-foreground sm:px-10 md:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <SectionEyebrow>{t('home:liveProof.eyebrow')}</SectionEyebrow>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t('home:liveProof.heading')}
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">{t('home:liveProof.description')}</p>
            </div>
            <Link
              to="/live"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-signal hover:underline"
            >
              {t('home:liveProof.cta')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <KpiRow />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LiveMap />
            </div>
            <EventFeed />
          </div>

          {/*
            Reactions used to float `fixed` bottom-left, which sat on top of
            the hero's CTAs/copy since the hero is full-height — any
            viewport-anchored element lands over it regardless of which
            section is "underneath" in the document. Docking it here instead
            is correct, not just a fix: reacting is part of the live demo
            this block is proving, not page chrome. The Ask widget's floating
            trigger (ask-widget.tsx, fixed right-6 bottom-6) is now the only
            fixed-position element on the site.
          */}
          <Card className="border-signal/20 bg-signal-muted/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('dashboard:reactions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Reactions />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
