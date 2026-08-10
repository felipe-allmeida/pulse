import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useMetrics, useVisitor } from '@/lib/api';
import { formatOrdinal, formatTimeAgo, pickVisitorFact } from '@/lib/visitor-fact';
import { cn } from '@/lib/utils';

const FACT_INDEX_KEY = 'pulse:visitor-fact-index';

/**
 * Advances the per-session rotation, so a reload is answered with the next fact
 * down the list instead of the same sentence again.
 */
function nextVisitorFactIndex(): number {
  try {
    const stored = Number.parseInt(window.sessionStorage.getItem(FACT_INDEX_KEY) ?? '', 10);
    const index = Number.isInteger(stored) && stored >= 0 ? stored : 0;
    window.sessionStorage.setItem(FACT_INDEX_KEY, String(index + 1));
    return index;
  } catch {
    // Storage can be unavailable (private windows, blocked storage). The
    // rotation is a nicety; without it the greeting just stays on its best fact.
    return 0;
  }
}

/**
 * The hero's opening sentence: something true about *this* visitor, drawn from
 * the visit history the Worker has been writing all along.
 *
 * Until `/api/visitor` answers — and for any crawler that never runs this at
 * all — it renders the generic hook instead. That fallback is the point of the
 * split: a page that greets Googlebot by city, or that guesses while the
 * request is still in flight, would be worse than one that says nothing.
 */
export function VisitorLine({ className }: { className?: string }) {
  const { t, i18n } = useTranslation('home');
  const { data: metrics } = useMetrics();
  const { data: visitor } = useVisitor();
  const reducedMotion = useReducedMotion();

  // Both pinned at first render: the fact should describe the moment the page
  // was opened and stay put, not tick over while it's being read.
  const [factIndex] = useState(nextVisitorFactIndex);
  const [openedAt] = useState(() => Date.now());

  const phrasing = useMemo(() => {
    if (!visitor) return null;
    const fact = pickVisitorFact(visitor, openedAt, factIndex);
    return {
      // The city-less variants exist for every fact the cascade can still reach
      // without geo — it never emits a city-based fact when `geo` is null.
      key: visitor.geo ? `visitor.fact.${fact.kind}` : `visitor.factNoGeo.${fact.kind}`,
      values: {
        city: visitor.geo?.city,
        position: 'position' in fact ? formatOrdinal(fact.position, i18n.language) : undefined,
        days: 'days' in fact ? fact.days : undefined,
        // `fact.city` is the *previous* visitor's city here, not this visitor's.
        previousCity: fact.kind === 'previous' ? fact.city : undefined,
        when: fact.kind === 'previous' ? formatTimeAgo(fact.at, openedAt, i18n.language) : undefined,
      },
    };
  }, [visitor, openedAt, factIndex, i18n.language]);

  const paragraph = cn('max-w-[65ch] text-base leading-relaxed text-muted-foreground sm:text-lg', className);
  const emphasis = <span className="font-semibold text-signal-strong" />;

  if (!phrasing) {
    return (
      <p className={paragraph} data-testid="visitor-line" data-state="generic">
        <Trans
          t={t}
          i18nKey="home:hero.hook"
          values={{ count: metrics?.activeConnections ?? 0 }}
          components={{ strong: emphasis }}
        />
      </p>
    );
  }

  return (
    <p className={paragraph} data-testid="visitor-line" data-state="personal">
      <Trans t={t} i18nKey={phrasing.key} values={phrasing.values} components={{ strong: emphasis }} />{' '}
      {/* Only claim the dot when there is one — without geo the visitor is not on the map. */}
      {visitor?.geo ? <>{t(reducedMotion ? 'visitor.dotStatic' : 'visitor.dot')} </> : null}
      {t('visitor.noCookie')}
    </p>
  );
}
