import { profile } from '@/content/profile';

export function ExperienceTimeline() {
  return (
    <ol className="flex flex-col gap-6">
      {profile.experience.map((entry) => (
        <li key={`${entry.org}-${entry.role}`} className="border-l-2 border-border pl-4">
          <p className="text-sm font-medium">
            {entry.role} <span className="text-muted-foreground">@ {entry.org}</span>
          </p>
          <p className="text-xs text-muted-foreground">{entry.period}</p>
          <p className="mt-1 text-sm">{entry.summary}</p>
        </li>
      ))}
    </ol>
  );
}
