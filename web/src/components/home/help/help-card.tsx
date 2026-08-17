import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type HelpCardKey } from '@/components/home/help/help-cards';
import { cn } from '@/lib/utils';

/**
 * One offer, in two layers. The surface — headline, body, and the
 * `hoje / depois` pair — is written for a founder and carries no technical
 * vocabulary at all. The `<details>` underneath holds three concrete examples
 * and closes with one dimmed line of real engineering terms, for whoever the
 * founder forwards this to.
 *
 * Two sizes. The featured card runs the full width of the section and shows
 * both sides of the transform; the three compact cards share a row and show
 * only the outcome. The hierarchy is the card's size — no copy is cut, because
 * this page is built to be read by answer engines and a shorter body would
 * trade retrievable text for whitespace.
 *
 * Native `<details>`/`<summary>` rather than a custom disclosure: keyboard
 * accessible with no code of ours, works with JavaScript disabled, and
 * leaves the collapsed copy in the DOM for crawlers.
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function HelpCard({ variant, featured = false }: { variant: HelpCardKey; featured?: boolean }) {
  const { t } = useTranslation('home');

  // i18next's return type for `t()` is unconstrained here (no
  // `CustomTypeOptions` module augmentation in this repo), so a missing or
  // malformed key resolves to the key path itself rather than an array. If
  // that untyped value were cast and rendered directly, `.map()` on a
  // string would throw during render — including during the SSR prerender.
  // Narrow it at runtime instead: a missing/malformed key costs the
  // examples list, not the page.
  const rawExamples: unknown = t(`home:help.cards.${variant}.examples`, { returnObjects: true });
  const examples = isStringArray(rawExamples) ? rawExamples : [];

  return (
    <div
      data-featured={featured ? 'true' : undefined}
      className={cn(
        'flex h-full flex-col gap-4 rounded-lg bg-signal-muted/10',
        featured ? 'border-2 border-signal/50 p-6' : 'border border-signal/20 p-5',
      )}
    >
      <h3
        className={cn(
          'font-semibold tracking-tight text-balance text-foreground',
          featured ? 'text-xl' : 'text-base',
        )}
      >
        {t(`home:help.cards.${variant}.headline`)}
      </h3>

      <p className="max-w-[60ch] flex-1 text-sm leading-relaxed text-muted-foreground">
        {t(`home:help.cards.${variant}.body`)}
      </p>

      {/*
        What replaced the three-icon mini diagram. Two mono lines on the
        featured card, one on the compact ones — same grammar as the event
        feed and the architecture diagram, and no JavaScript at all: the old
        version spent an IntersectionObserver and a reduced-motion branch
        animating a dot along a 24px rule.
      */}
      {featured ? (
        <dl
          data-transform="pair"
          className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-signal/15 py-2.5 font-mono text-xs leading-relaxed"
        >
          <dt className="text-muted-foreground">{t('home:help.transformLabels.before')}</dt>
          <dd className="text-muted-foreground">{t(`home:help.cards.${variant}.transform.before`)}</dd>
          <dt className="text-signal-strong">{t('home:help.transformLabels.after')}</dt>
          <dd className="text-signal-strong">{t(`home:help.cards.${variant}.transform.after`)}</dd>
        </dl>
      ) : (
        <p
          data-transform="after"
          className="border-t border-signal/15 pt-3 font-mono text-xs leading-relaxed text-signal-strong"
        >
          <span aria-hidden="true">→ </span>
          {t(`home:help.cards.${variant}.transform.after`)}
        </p>
      )}

      <details className="group border-t border-signal/15 pt-3">
        {/*
          `list-none` + the WebKit pseudo-element rule kill the native
          triangle marker so the chevron below is the only affordance; the
          summary keeps its own focus ring and stays a real disclosure
          control for keyboard and screen readers.
        */}
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded font-mono text-xs tracking-[0.15em] text-signal-strong uppercase focus-visible:ring-2 focus-visible:ring-signal-strong focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="size-3.5 transition-transform group-open:rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
          />
          {t('home:help.examplesLabel')}
        </summary>

        <ul className="mt-3 flex flex-col gap-2">
          {examples.map((example) => (
            <li key={example} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-signal/60" />
              <span>{example}</span>
            </li>
          ))}
        </ul>

        {/* The one place technical vocabulary is allowed. Small and dimmed on
            purpose: the founder's eye slides past it, the engineer's doesn't. */}
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-signal-strong">{t('home:help.techLabel')}</span>{' '}
          {t(`home:help.cards.${variant}.tech`)}
        </p>
      </details>
    </div>
  );
}
