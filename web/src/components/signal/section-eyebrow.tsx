import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionEyebrowProps {
  children: ReactNode;
  className?: string;
}

/**
 * The mono, upper-tracked section label (e.g. "/about", "/projects") used
 * above a page's `<h1>` or a major section — the signal design system's
 * eyebrow primitive.
 */
export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <p className={cn('font-mono text-xs tracking-[0.2em] text-signal-strong uppercase', className)}>{children}</p>
  );
}
