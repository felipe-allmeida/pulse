import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

/**
 * The signal timeline: a left rule with aqua nodes, one per experience
 * entry — `role · **org**` (org in aqua), a mono period/meta line, and the
 * summary. Data is fully localized from `profile.experience`.
 *
 * The org name becomes a link to the employer's own site when `entry.url` is
 * set. It keeps the aqua weight either way, so a linked and an unlinked row
 * read as the same kind of thing — the underline on hover is the only tell,
 * rather than half the timeline sitting in a different colour.
 */
export function ExperienceTimeline() {
  const L = useLocalized();
  return (
    <ol className="flex flex-col gap-8 border-l border-signal/25 pl-6">
      {profile.experience.map((entry) => (
        <li key={`${entry.org}-${L(entry.role)}`} className="relative">
          <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2.5 rounded-full bg-signal" />
          <p className="text-sm font-medium text-foreground">
            {L(entry.role)} ·{' '}
            {entry.url ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-signal-strong underline-offset-4 hover:underline"
              >
                {entry.org}
              </a>
            ) : (
              <span className="font-semibold text-signal-strong">{entry.org}</span>
            )}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{L(entry.period)}</p>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{L(entry.summary)}</p>
        </li>
      ))}
    </ol>
  );
}
