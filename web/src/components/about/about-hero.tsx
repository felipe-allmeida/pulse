import { useTranslation } from 'react-i18next';
import { CvButton } from '@/components/nav/cv-button';
import { StatusPill } from '@/components/signal/status-pill';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

// TODO: swap the initials placeholder for a real photo once web/public/felipe.jpg lands.
export function AboutHero() {
  const L = useLocalized();
  const { t } = useTranslation('about');
  const nameParts = profile.name.trim().split(/\s+/);
  const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <StatusPill detail={t('about:heroStatusDetail')} />

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div
          aria-hidden
          className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-signal/50 bg-signal-muted/20 font-mono text-2xl font-semibold text-signal"
        >
          {initials}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{profile.name}</h1>
          <p className="font-mono text-sm text-signal sm:text-base">{L(profile.title)}</p>
          <p className="max-w-xl font-mono text-xs text-signal/70 sm:text-sm">{L(profile.tagline)}</p>
        </div>
      </div>

      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(profile.bio)}</p>

      <div>
        <CvButton className="h-10 px-6" />
      </div>
    </div>
  );
}
