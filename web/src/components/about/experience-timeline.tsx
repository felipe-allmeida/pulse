import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

export function ExperienceTimeline() {
  const L = useLocalized();
  return (
    <ol className="flex flex-col gap-6">
      {profile.experience.map((entry) => (
        <li key={`${entry.org}-${L(entry.role)}`} className="border-l-2 border-border pl-4">
          <p className="text-sm font-medium">
            {L(entry.role)} <span className="text-muted-foreground">@ {entry.org}</span>
          </p>
          <p className="text-xs text-muted-foreground">{entry.period}</p>
          <p className="mt-1 text-sm">{L(entry.summary)}</p>
        </li>
      ))}
    </ol>
  );
}
