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
 * The column is also the measure. About and the case studies used to clamp
 * their prose a second time inside it (`max-w-[65ch]`, `max-w-2xl`,
 * `max-w-xl`), which left the text at 655px in a 1024px column — so on a wide
 * screen the page sat with 448px of margin on the left and 817px on the
 * right, reading as broken rather than as generous. Those clamps are gone:
 * paragraphs run the full column, ~105 characters a line at 16px. That is
 * wider than the classic 65–75, and a deliberate trade — the pages are short
 * blocks of text, not long-form reading, and an empty right half cost more
 * than the longer line does. Do not reintroduce a per-paragraph `max-w-*`
 * here without changing the column with it.
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
