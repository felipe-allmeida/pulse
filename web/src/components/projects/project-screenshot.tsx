import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface ProjectScreenshotProps {
  /** Ambient signal glow for the featured project's slot. */
  glow?: boolean;
  className?: string;
}

/**
 * The decorative screenshot slot shared by the project card and the
 * dedicated detail page. Purely a placeholder today (no screenshot assets
 * yet) — `aria-hidden` so it never registers with assistive tech.
 */
export function ProjectScreenshot({ glow = false, className }: ProjectScreenshotProps) {
  const { t } = useTranslation('projects');
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-48 w-full items-center justify-center rounded-xl border border-signal/15 bg-background/40 font-mono text-xs text-muted-foreground',
        glow && 'border-signal/40 shadow-[0_0_40px_-10px_var(--color-signal)]',
        className,
      )}
    >
      {t('projects:screenshotPlaceholder')}
    </div>
  );
}
