import { Badge } from '@/components/ui/badge';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

export function SkillGroups() {
  const L = useLocalized();
  return (
    <div className="flex flex-col gap-4">
      {profile.skills.map((group) => (
        <div key={group.group.en} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="w-32 shrink-0 text-sm font-medium text-muted-foreground">{L(group.group)}</span>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
