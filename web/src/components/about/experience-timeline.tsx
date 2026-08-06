import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

/**
 * The signal timeline: a left rule with aqua nodes, one per experience
 * entry — `role · **org**` (org in aqua), a mono period/meta line, and the
 * summary. Data is fully localized from `profile.experience`.
 */
export function ExperienceTimeline() {
  const L = useLocalized();
  return (
    <ol className="flex flex-col gap-8 border-l border-signal/25 pl-6">
      {profile.experience.map((entry) => (
        <li key={`${entry.org}-${L(entry.role)}`} className="relative">
          <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2.5 rounded-full bg-signal" />
          <p className="text-sm font-medium text-foreground">
            {L(entry.role)} · <span className="font-semibold text-signal">{entry.org}</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">{L(entry.period)}</p>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{L(entry.summary)}</p>
        </li>
      ))}
    </ol>
  );
}
