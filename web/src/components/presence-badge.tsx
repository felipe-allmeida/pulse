import { Badge } from '@/components/ui/badge';
import { usePulseHub } from '@/realtime/use-pulse-hub';

export function PresenceBadge() {
  const { count } = usePulseHub();

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span className="text-emerald-500">●</span>
      {count} online
    </Badge>
  );
}
