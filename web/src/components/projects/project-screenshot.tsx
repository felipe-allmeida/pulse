import { cn } from '@/lib/utils';

export interface ProjectScreenshotProps {
  /** The screenshot's image URL. Omit while no capture exists yet. */
  src?: string;
  /** Meaningful alt text for the real image (e.g. `${project.name} screenshot`). */
  alt: string;
  /** Ambient signal accent for the featured project's slot — a border/shadow whisper, not a halo. */
  glow?: boolean;
  className?: string;
}

/**
 * The screenshot slot shared by the project card and the dedicated detail
 * page.
 *
 * With `src` set, it renders the real image: fixed aspect box, `object-cover`,
 * lazy-loaded, with the caller-supplied alt so it's announced properly.
 *
 * Without `src`, it does NOT render a large empty placeholder box — there is
 * nothing to show yet, so nothing pretends there is. Instead it renders a
 * thin `aria-hidden` signal-gradient accent rule, keeping the card
 * content-led (name, tagline, description, chips carry the visual weight)
 * while still hinting at the signal design language.
 */
export function ProjectScreenshot({ src, alt, glow = false, className }: ProjectScreenshotProps) {
  if (src) {
    return (
      // eslint-disable-next-line jsx-a11y/no-img-element -- CDN/hosted screenshot asset, not a bundled image.
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'aspect-video w-full rounded-xl border border-signal/15 object-cover',
          glow && 'border-signal/35 shadow-[0_0_16px_-8px_var(--color-signal)]',
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-1 w-12 rounded-full bg-gradient-to-r from-signal/70 via-signal/25 to-transparent',
        glow && 'w-20 from-signal via-signal/45 to-transparent',
        className,
      )}
    />
  );
}
