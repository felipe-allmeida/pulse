import { CvButton } from '@/components/nav/cv-button';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

// TODO: swap the initials placeholder for a real photo once web/public/felipe.jpg lands.
export function AboutHero() {
  const L = useLocalized();
  const nameParts = profile.name.trim().split(/\s+/);
  const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div
        aria-hidden
        className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground"
      >
        {initials}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <p className="text-muted-foreground">{L(profile.title)}</p>
        <p className="text-sm">{L(profile.tagline)}</p>
      </div>

      <CvButton />
    </div>
  );
}
