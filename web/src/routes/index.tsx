import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AskChips } from '@/components/ask/ask-chips';
import { EngineeringShowcase } from '@/components/home/engineering-showcase';
import { Hero } from '@/components/home/hero';
import { EventFeed } from '@/components/event-feed';
import { KpiRow } from '@/components/kpi-row';
import { LiveMap } from '@/components/live-map';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { useVisitFeed } from '@/hooks/use-visit-feed';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { t } = useTranslation('home');
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
        the event stream, pointing at /live for anyone who wants the rest.
        "Send a pulse" (the old docked Reactions widget's replacement) lives
        in EngineeringShowcase above, next to the diagram it animates —
        proving the pipeline is not this block's job.

        This section now follows the site-wide theme like every other
        surface: `bg-background`/`text-foreground` resolve per theme, and the
        signal accent text below uses `text-signal-strong` (not the fixed
        bright `text-signal`) so it clears AA on a light surface too.
      */}
      <section className="bg-background px-6 py-16 text-foreground sm:px-10 md:py-20">
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
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-signal-strong hover:underline"
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
        </div>
      </section>

      {/*
        Ask chips (visual coherence Task 2): right after the live-proof
        block, the recruiter has just watched the system prove itself —
        this is the highest-attention moment to offer the actual
        conversation. Kept as its own quiet section (not stacked inside
        live-proof); theme-driven like the rest of the page.
      */}
      <section className="bg-background px-6 py-12 text-foreground sm:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <AskChips />
        </div>
      </section>
    </div>
  );
}
