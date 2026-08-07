import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

export interface PillProps {
  children: ReactNode;
  /**
   * Renders a pulsing signal dot before the content (e.g. a live-status or
   * live-count indicator). The pulse is disabled under
   * `prefers-reduced-motion: reduce`, and `data-motion` reflects which mode
   * is active ("static" | "animated") — same convention as
   * `ArchitectureDiagram`/`HeroMap`. Omitted for static eyebrow-style badges
   * that carry no live data.
   */
  dot?: boolean;
  className?: string;
}

/**
 * The signal design system's pill shell — a rounded, hairline signal border
 * over a `bg-signal-muted/40` fill, mono aqua text. The shared base for
 * every "badge/eyebrow" pill on the home page and `StatusPill`: a single
 * source for the class string and the optional pulsing-dot markup, so
 * live-status, live-count, and static eyebrow pills can't drift from each
 * other.
 */
export function Pill({ children, dot = false, className }: PillProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span
      data-motion={dot ? (reducedMotion ? 'static' : 'animated') : undefined}
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-full border border-signal/30 bg-signal-muted/40 px-3 py-1 font-mono text-xs text-signal-strong',
        className,
      )}
    >
      {dot ? (
        <span aria-hidden className="relative flex size-1.5">
          {!reducedMotion && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-75" />
          )}
          <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}
