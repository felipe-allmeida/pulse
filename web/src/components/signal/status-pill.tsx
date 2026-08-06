import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

export interface StatusPillProps {
  /** Optional trailing detail rendered after the localized status text (e.g. "open to Staff / Principal"). */
  detail?: ReactNode;
  className?: string;
}

/**
 * The aqua "● Available now" pill — a pulsing signal dot next to the
 * localized status text. The dot's pulse is disabled under
 * `prefers-reduced-motion: reduce`; `data-motion` reflects which mode is
 * active ("static" | "animated") for tests and any consumer that needs it.
 */
export function StatusPill({ detail, className }: StatusPillProps) {
  const { t } = useTranslation('contact');
  const reducedMotion = useReducedMotion();

  return (
    <span
      data-motion={reducedMotion ? 'static' : 'animated'}
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-full border border-signal/30 bg-signal-muted/40 px-3 py-1 font-mono text-xs text-signal',
        className,
      )}
    >
      <span aria-hidden className="relative flex size-1.5">
        {!reducedMotion && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-75" />
        )}
        <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
      </span>
      <span>
        {t('contact:statusOpen')}
        {detail ? <> · {detail}</> : null}
      </span>
    </span>
  );
}
