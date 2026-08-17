import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

/**
 * The id of the section directly below the hero — see
 * `components/home/help/how-i-help.tsx`. Kept here (module-private) because
 * this component is the only thing that scrolls to it.
 */
const SCROLL_CUE_TARGET_ID = 'how-i-help';

/**
 * Past this much scroll the cue has served its purpose and gets out of the
 * way. Small enough that the first flick of a wheel dismisses it, large
 * enough that a browser restoring a few pixels of scroll position doesn't.
 */
const HIDE_AFTER_PX = 32;

/**
 * The hero's "there is more below" affordance: a mono label over a 48px rule
 * that fades out at its lower end, with a short aqua segment running down it
 * on a loop.
 *
 * The hero reserves `min-h-[85vh]` and its content ends well short of that,
 * which left a tall dead gap and a sliver of the next section clipped by the
 * fold — read by a first-time visitor as a broken layout rather than an
 * invitation. This sits in that gap and points at the sliver.
 *
 * Desktop only (`hidden md:flex`): below `md` the hero has no minimum height,
 * so there is no gap to fill and the next section already follows naturally.
 *
 * Once the page scrolls past `HIDE_AFTER_PX` the cue fades to
 * `pointer-events-none` rather than unmounting — so its own smooth scroll
 * never races the listener that hides it — and it is pulled out of the tab
 * order and the accessibility tree while invisible.
 */
export function ScrollCue() {
  const { t } = useTranslation('home');
  const reducedMotion = useReducedMotion();
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > HIDE_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToNextSection = () => {
    document.getElementById(SCROLL_CUE_TARGET_ID)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToNextSection}
      disabled={scrolledPast}
      data-testid="scroll-cue"
      data-motion={reducedMotion ? 'static' : 'animated'}
      aria-hidden={scrolledPast || undefined}
      tabIndex={scrolledPast ? -1 : undefined}
      className={cn(
        'group absolute inset-x-0 bottom-8 z-10 mx-auto hidden w-fit min-h-11 flex-col items-center gap-2.5 transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background md:flex',
        scrolledPast ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase transition-colors group-hover:text-signal-strong">
        {t('home:cta.scroll')}
      </span>
      {/* Decorative: the label alone is the button's accessible name. */}
      <span
        aria-hidden
        className="relative block h-12 w-px overflow-hidden bg-gradient-to-b from-border to-transparent"
      >
        <span
          className="absolute inset-x-0 top-0 block h-4 bg-gradient-to-b from-transparent to-signal"
          style={reducedMotion ? undefined : { animation: 'scroll-cue 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        />
      </span>
    </button>
  );
}
