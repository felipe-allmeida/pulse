import { Chip } from '@/components/signal/chip';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

/** Grouped skill rows — a mono group label + signal `Chip`s per group. */
export function SkillGroups() {
  const L = useLocalized();
  return (
    <div className="flex flex-col gap-4">
      {profile.skills.map((group) => (
        <div key={group.group.en} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="w-36 shrink-0 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {L(group.group)}
          </span>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
