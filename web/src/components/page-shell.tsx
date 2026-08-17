import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The one content column every route shares — the home page's recipe, made
 * reusable so the other pages stop drifting away from it.
 *
 * Two rules, and both matter for where the first character of a page lands:
 *
 * 1. The gutter (`px-6 sm:px-10`) goes on the *outer* element and the width
 *    cap (`max-w-5xl`) on the *inner* one, never both on the same element.
 *    With the padding inside the capped box, the column is still centred at
 *    1024px but the text starts 40px further in than the home page's does.
 * 2. The cap is `max-w-5xl` everywhere. About and the case studies were
 *    `max-w-3xl` and /live was `max-w-6xl`, so the first line of each page
 *    sat at a different x — About's ~170px inside the home page's — and the
 *    content visibly jumped sideways on every navigation.
 *
 * Readable line length is *not* this component's job: prose inside stays
 * clamped where it's written (`max-w-2xl`, `max-w-[65ch]`, `max-w-prose`),
 * so widening the shell aligns the edges without stretching any paragraph.
 *
 * The home page's own sections (Hero, EngineeringShowcase, VisitHistory,
 * routes/index.tsx) keep their inline `px-6 sm:px-10` + inner `max-w-5xl`
 * because each carries its own full-bleed background band; they follow the
 * same two rules by hand.
 */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="bg-background px-6 text-foreground sm:px-10">
      <div className={cn('mx-auto flex w-full max-w-5xl flex-col', className)}>{children}</div>
    </div>
  );
}
