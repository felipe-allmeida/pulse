import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AskChips } from '@/components/ask/ask-chips';
import { EngineeringShowcase } from '@/components/home/engineering-showcase';
import { Hero } from '@/components/home/hero';
import { VisitHistory } from '@/components/home/visit-history';
import { EventFeed } from '@/components/event-feed';
import { LiveMap } from '@/components/live-map';
import { MapStats } from '@/components/map-stats';
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
        AppShell's <main> is `mx-auto max-w-7xl py-6` — without this breakout
        wrapper they'd sit capped at 1280px with a 24px band above,
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
        in EngineeringShowcase above, next to the eyebrow above the diagram
        it animates — proving the pipeline is not this block's job.

        This section now follows the site-wide theme like every other
        surface: `bg-background`/`text-foreground` resolve per theme, and the
        signal accent text below uses `text-signal-strong` (not the fixed
        bright `text-signal`) so it clears AA on a light surface too.

        Mobile vertical rhythm (Task 3): `py-14` on mobile matches
        EngineeringShowcase and the Ask chips section below — one consistent
        section padding down the page instead of alternating py-12/py-16
        "orphan" gaps, tightened from the previous py-16.
      */}
      <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
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

          {/*
            The two live counters ride in the map card's header (`MapStats`)
            rather than in a `KpiRow` band above it. That band was two cards
            holding one number each stretched across the full 1024px column —
            the emptiest strip in the section — and removing it lets the map
            and the feed close up into a single dense block. `/live` keeps the
            full `KpiRow`, sparklines included.
          */}
          {/*
            5 columns split 3/2, not 3 split 2/1: at a third of the row the
            feed column was too narrow for "Visit from Council Bluffs, United
            States" plus its timestamp, so nearly every row wrapped onto a
            second line — breaking mid-place-name ("Visit from Porto Alegre," /
            "Brazil"). Two fifths fits the longest city/country pair on one
            line, and costs the map ~60px it doesn't miss.
          */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <LiveMap stats={<MapStats />} />
            </div>
            {/*
              The map sets the row's height and the feed fills it, rather than
              the other way round. The feed's natural height rises with every
              visit that lands, and once it passed the map's the grid stretched
              the *map* card to match, parking a growing band of empty card
              under the map's last row. Taking the feed out of flow (from `lg`
              up, where the two sit side by side) leaves the map as the only
              thing the row measures; the feed then gets an exact height to
              fill and scrolls whatever doesn't fit.
            */}
            <div className="relative lg:col-span-2">
              <div className="lg:absolute lg:inset-0">
                <EventFeed />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        The full stack of true history facts, the long form of the hero's
        one-line greeting. It used to be a separate /watched page that escalated
        into browser fingerprinting and a "1 in N" rarity receipt; that section
        overclaimed (the shares were published estimates multiplied as if
        independent) and the page was a detour off the portfolio. What survives
        is the part that is actually measured — this site's own visit history —
        placed here, after the live-proof block has shown the system running, so
        the facts read as output of that system rather than a party trick.

        Renders nothing until /api/visitor answers, so the page simply does not
        have this section for a crawler.
      */}
      <VisitHistory />

      {/*
        Ask chips (visual coherence Task 2): right after the live-proof
        block, the recruiter has just watched the system prove itself —
        this is the highest-attention moment to offer the actual
        conversation. Kept as its own quiet section (not stacked inside
        live-proof); theme-driven like the rest of the page.
      */}
      <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <AskChips />
        </div>
      </section>
    </div>
  );
}
