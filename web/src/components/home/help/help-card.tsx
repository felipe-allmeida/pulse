import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpDiagram, type HelpCardKey } from '@/components/home/help/help-diagram';

/**
 * One offer, in two layers. The surface — diagram, headline, body — is
 * written for a founder and carries no technical vocabulary at all. The
 * `<details>` underneath holds three concrete examples and closes with one
 * dimmed line of real engineering terms, for whoever the founder forwards
 * this to.
 *
 * Native `<details>`/`<summary>` rather than a custom disclosure: keyboard
 * accessible with no code of ours, works with JavaScript disabled, and
 * leaves the collapsed copy in the DOM for crawlers — which matters, since
 * this site is deliberately built to be read by answer engines.
 */
export function HelpCard({ variant }: { variant: HelpCardKey }) {
  const { t } = useTranslation('home');

  const examples = t(`home:help.cards.${variant}.examples`, { returnObjects: true }) as string[];

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-signal/20 bg-signal-muted/10 p-5">
      <HelpDiagram variant={variant} />

      <h3 className="text-lg font-semibold tracking-tight text-balance text-foreground">
        {t(`home:help.cards.${variant}.headline`)}
      </h3>

      <p className="max-w-[60ch] flex-1 text-sm leading-relaxed text-muted-foreground">
        {t(`home:help.cards.${variant}.body`)}
      </p>

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
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground/70">
          <span className="text-signal-strong/70">{t('home:help.techLabel')}</span>{' '}
          {t(`home:help.cards.${variant}.tech`)}
        </p>
      </details>
    </div>
  );
}
