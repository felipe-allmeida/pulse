import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SubsectionHeadingProps {
  children: ReactNode;
  className?: string;
}

/**
 * The mono, upper-tracked `<h2>` used above a subsection within a page that
 * already has its own `<h1>` (e.g. About's "Experience"/"Skills"/"Contact",
 * a project detail page's "Overview"/"Highlights"). Muted rather than
 * signal-colored, and a real `<h2>` (unlike `SectionEyebrow`, which is a
 * `<p>` used above a page's own `<h1>`) so it stays in the document's
 * heading outline.
 */
export function SubsectionHeading({ children, className }: SubsectionHeadingProps) {
  return (
    <h2 className={cn('font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase', className)}>
      {children}
    </h2>
  );
}
