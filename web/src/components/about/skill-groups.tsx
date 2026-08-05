import { Badge } from '@/components/ui/badge';
import { profile } from '@/content/profile';

export function SkillGroups() {
  return (
    <div className="flex flex-col gap-4">
      {profile.skills.map((group) => (
        <div key={group.group} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="w-32 shrink-0 text-sm font-medium text-muted-foreground">{group.group}</span>
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
