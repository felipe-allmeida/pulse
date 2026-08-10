import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { useVisitor } from '@/lib/api';
import { fingerprintOf, readClientSignals } from '@/lib/client-signals';
import { cumulativeOneIn, rarityOf } from '@/lib/rarity';
import { eligibleFacts, formatOrdinal, formatTimeAgo } from '@/lib/visitor-fact';
import { cn } from '@/lib/utils';

/** The event that crosses every process boundary in this system, quoted verbatim from the source. */
const VISIT_STARTED = `public sealed record VisitStarted(
    Guid VisitId, string ConnectionId,
    string Country, string City, double Lat, double Lon,
    DateTimeOffset OccurredAt);`;

function Reading({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border/60 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-mono text-sm break-all',
          muted ? 'text-muted-foreground' : 'text-signal-strong',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The long-form counterpart to the home page's one-line greeting: it shows the
 * readings the hero only hinted at, multiplies them out, and then turns hard
 * into what this system actually keeps.
 *
 * The turn is the reason the page exists. A reveal that stops at "look what I
 * can see" is someone else's argument — here the reveal is setup, and the
 * payoff is the `VisitStarted` record below, which has no field for an IP and
 * therefore cannot carry one.
 *
 * Nothing here is written down: no cookie is set, no storage is touched, the
 * fingerprint is derived for display and discarded, and the only network call
 * is the same `/api/visitor` read the home page already makes.
 */
export function WatchedPage() {
  const { t, i18n } = useTranslation(['watched', 'home']);
  const { data: visitor } = useVisitor();

  // Read once on mount: these are readings of a moment, and re-reading them on
  // every render would make the page twitch as the browser reports differently.
  const [signals] = useState(() => readClientSignals());
  const [openedAt] = useState(() => Date.now());

  const fingerprint = useMemo(() => fingerprintOf(signals), [signals]);
  const rarity = useMemo(() => rarityOf(signals, visitor), [signals, visitor]);
  const running = useMemo(() => cumulativeOneIn(rarity.dimensions), [rarity.dimensions]);
  const facts = useMemo(() => (visitor ? eligibleFacts(visitor, openedAt) : []), [visitor, openedAt]);

  const numberFormat = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const emphasis = <span className="font-semibold text-signal-strong" />;

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-16 pb-24 sm:px-10">
        <header className="flex flex-col gap-4">
          <SectionEyebrow>{t('watched:eyebrow')}</SectionEyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('watched:heading')}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{t('watched:intro')}</p>
        </header>

        {/* 1 — what the visit history already knew, before a single signal was read. */}
        <section className="flex flex-col gap-4">
          <SubsectionHeading>{t('watched:history.heading')}</SubsectionHeading>
          <p className="text-base leading-relaxed text-muted-foreground">{t('watched:history.lede')}</p>

          {facts.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {facts.map((fact) => (
                <li key={fact.kind} className="border-l-2 border-signal/40 pl-4 text-base text-muted-foreground">
                  <Trans
                    t={t}
                    i18nKey={`watched:history.fact.${fact.kind}`}
                    values={{
                      city: visitor?.geo?.city,
                      position: 'position' in fact ? formatOrdinal(fact.position, i18n.language) : undefined,
                      days: 'days' in fact ? fact.days : undefined,
                      previousCity: fact.kind === 'previous' ? fact.city : undefined,
                      when: fact.kind === 'previous' ? formatTimeAgo(fact.at, openedAt, i18n.language) : undefined,
                    }}
                    components={{ strong: emphasis }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-muted-foreground">{t('watched:history.empty')}</p>
          )}

          <p className="text-sm text-muted-foreground">{t('watched:history.note')}</p>
        </section>

        {/* 2 — the readings the browser hands over with no prompt at all. */}
        <section className="flex flex-col gap-4">
          <SubsectionHeading>{t('watched:signals.heading')}</SubsectionHeading>
          <p className="text-base leading-relaxed text-muted-foreground">{t('watched:signals.lede')}</p>

          <div className="flex flex-col">
            <Reading label={t('watched:signals.language')} value={signals.languages.join(', ') || signals.language} />
            {signals.timeZone ? <Reading label={t('watched:signals.timeZone')} value={signals.timeZone} /> : null}
            {signals.screenWidth && signals.screenHeight ? (
              <Reading
                label={t('watched:signals.screen')}
                value={`${signals.screenWidth} × ${signals.screenHeight}${
                  signals.pixelRatio ? ` @${signals.pixelRatio}×` : ''
                }`}
              />
            ) : null}
            {signals.cores !== null ? <Reading label={t('watched:signals.cores')} value={String(signals.cores)} /> : null}
            {signals.memoryGb !== null ? (
              <Reading label={t('watched:signals.memory')} value={`${signals.memoryGb} GB`} />
            ) : null}
            {signals.touchPoints !== null ? (
              <Reading
                label={t('watched:signals.touch')}
                value={t(signals.touchPoints > 0 ? 'watched:signals.touchYes' : 'watched:signals.touchNo', {
                  count: signals.touchPoints,
                })}
              />
            ) : null}
            {signals.platform ? <Reading label={t('watched:signals.platform')} value={signals.platform} /> : null}
            {signals.colorScheme ? (
              <Reading label={t('watched:signals.theme')} value={t(`watched:signals.theme_${signals.colorScheme}`)} />
            ) : null}
            <Reading
              label={t('watched:signals.doNotTrack')}
              value={t(
                signals.doNotTrack === null
                  ? 'watched:signals.dntUnset'
                  : signals.doNotTrack
                    ? 'watched:signals.dntOn'
                    : 'watched:signals.dntOff',
              )}
              muted={signals.doNotTrack === null}
            />
          </div>

          <p className="text-sm text-muted-foreground">{t('watched:signals.note')}</p>
        </section>

        {/* 3 — the multiplication. Common traits, compounding into a unique one. */}
        {rarity.dimensions.length > 0 ? (
          <section className="flex flex-col gap-4">
            <SubsectionHeading>{t('watched:rarity.heading')}</SubsectionHeading>
            <p className="text-base leading-relaxed text-muted-foreground">{t('watched:rarity.lede')}</p>

            <ol className="flex flex-col">
              {rarity.dimensions.map((dimension, index) => (
                <li
                  key={dimension.key}
                  className="flex flex-col gap-1 border-t border-border/60 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <span className="text-sm text-muted-foreground">
                    {t(`watched:rarity.dimension.${dimension.key}`)}
                    <span className="ml-2 font-mono text-signal-strong">{dimension.value}</span>
                    {dimension.source === 'measured' ? (
                      <span className="ml-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                        {t('watched:rarity.measured')}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {t('watched:rarity.oneIn', { count: running[index], value: numberFormat.format(running[index]) })}
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex flex-col gap-2 border-t-2 border-signal/40 pt-4">
              <p className="text-base text-foreground">
                <Trans
                  t={t}
                  i18nKey="watched:rarity.total"
                  values={{ value: numberFormat.format(rarity.oneIn), bits: rarity.bits.toFixed(1) }}
                  components={{ strong: emphasis }}
                />
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {t('watched:rarity.fingerprint', { hash: fingerprint })}
              </p>
            </div>

            {/* The honesty clause. Without it this section is the same overclaiming
                widget as every other "you are unique" page — the dimensions are
                not independent and the estimates are not measurements. */}
            <p className="text-sm text-muted-foreground">{t('watched:rarity.caveat')}</p>
          </section>
        ) : null}

        {/* 4 — the turn. Everything above was setup for this. */}
        <section className="flex flex-col gap-4 rounded-lg border border-signal/30 bg-signal-muted/10 p-6">
          <SubsectionHeading>{t('watched:kept.heading')}</SubsectionHeading>
          <p className="text-base leading-relaxed text-muted-foreground">{t('watched:kept.lede')}</p>

          <pre className="overflow-x-auto rounded-md border border-border/60 bg-background/60 p-4 text-xs leading-relaxed">
            <code className="font-mono text-foreground">{VISIT_STARTED}</code>
          </pre>

          <p className="text-base leading-relaxed text-muted-foreground">
            <Trans t={t} i18nKey="watched:kept.noIp" components={{ strong: emphasis }} />
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">{t('watched:kept.presence')}</p>
          <p className="text-base leading-relaxed text-muted-foreground">{t('watched:kept.thisPage')}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
            <Link
              to="/live"
              className="inline-flex min-h-11 items-center text-sm font-medium text-signal-strong underline-offset-4 hover:underline"
            >
              {t('watched:kept.liveLink')}
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('watched:kept.homeLink')}
            </Link>
          </div>
        </section>

        <p className="border-t border-border/60 pt-6 text-sm leading-relaxed text-muted-foreground">
          {t('watched:outro')}
        </p>
      </div>
    </div>
  );
}
