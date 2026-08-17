import { useTranslation } from 'react-i18next';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

/**
 * Education, plus the spoken-language line the CV carries under it.
 *
 * Deliberately *not* the aqua-node timeline used for experience: two identical
 * rails stacked one after the other would read as one long career list, and
 * degrees are a flat set rather than a sequence the reader follows. So this is
 * a plain stack — credential, org, mono period — sharing the timeline's type
 * scale but none of its ornament.
 */
export function EducationList() {
  const L = useLocalized();
  const { t } = useTranslation('about');

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-5">
        {profile.education.map((entry) => (
          <li key={`${entry.org}-${entry.credential.en}`} className="flex flex-col">
            <p className="text-sm font-medium text-foreground">{L(entry.credential)}</p>
            <p className="text-sm text-muted-foreground">{entry.org}</p>
            <p className="font-mono text-xs text-muted-foreground">{L(entry.period)}</p>
          </li>
        ))}
      </ul>

      <p className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-baseline sm:gap-4">
        <span className="w-36 shrink-0 font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {t('about:languagesLabel')}
        </span>
        <span>{L(profile.languages)}</span>
      </p>
    </div>
  );
}
