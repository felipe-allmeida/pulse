import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps {
  children: ReactNode;
  className?: string;
}

/**
 * The mono tech/skill chip — a hairline signal border over a panel
 * background. The signal design system's smallest content primitive,
 * used for tech stacks, skill tags, etc.
 */
export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-signal/20 bg-signal-muted/20 px-2.5 py-1 font-mono text-xs text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
