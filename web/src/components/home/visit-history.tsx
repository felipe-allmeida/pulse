import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { useVisitor } from '@/lib/api';
import { eligibleFacts, formatOrdinal, formatTimeAgo } from '@/lib/visitor-fact';

/**
 * The long form of the hero's one-line greeting: every fact the visit history
 * can state about this arrival, all at once.
 *
 * The hero picks one of these per load and rotates on reload — striking, but it
 * only ever shows one. Here they are laid out together, which is what makes the
 * point land: none of it came from the browser, none of it needed a cookie, and
 * it is all still true.
 *
 * Renders nothing at all until `/api/visitor` answers — a crawler, a blocked
 * request, or the moment before the response lands would otherwise leave an
 * empty section with a heading over it, which reads worse than no section.
 */
export function VisitHistory() {
  const { t, i18n } = useTranslation('home');
  const { data: visitor } = useVisitor();

  // Pinned at first render: these describe the moment the page was opened, and
  // recomputing "3 hours ago" mid-read would make the list twitch.
  const [openedAt] = useState(() => Date.now());
  const facts = useMemo(() => (visitor ? eligibleFacts(visitor, openedAt) : []), [visitor, openedAt]);

  if (facts.length === 0) return null;

  const emphasis = <span className="font-semibold text-signal-strong" />;

  return (
    <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20" data-testid="visit-history">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <SectionEyebrow>{t('home:visitHistory.eyebrow')}</SectionEyebrow>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('home:visitHistory.heading')}</h2>
          <p className="max-w-prose text-sm text-muted-foreground">{t('home:visitHistory.lede')}</p>
        </div>

        <ul className="flex flex-col gap-3">
          {facts.map((fact) => (
            <li key={fact.kind} className="border-l-2 border-signal/40 pl-4 text-base text-muted-foreground">
              <Trans
                t={t}
                i18nKey={`home:visitHistory.fact.${fact.kind}`}
                values={{
                  city: visitor?.geo?.city,
                  position: 'position' in fact ? formatOrdinal(fact.position, i18n.language) : undefined,
                  days: 'days' in fact ? fact.days : undefined,
                  // The *previous* visitor's city here, not this visitor's.
                  previousCity: fact.kind === 'previous' ? fact.city : undefined,
                  when: fact.kind === 'previous' ? formatTimeAgo(fact.at, openedAt, i18n.language) : undefined,
                }}
                components={{ strong: emphasis }}
              />
            </li>
          ))}
        </ul>

        <p className="max-w-prose text-sm text-muted-foreground">{t('home:visitHistory.note')}</p>
      </div>
    </section>
  );
}
