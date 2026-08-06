import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { usePulseHub } from '@/realtime/use-pulse-hub';

export function PresenceBadge() {
  const { t, i18n } = useTranslation('dashboard');
  const { count } = usePulseHub();
  const formattedCount = new Intl.NumberFormat(i18n.language).format(count);

  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-signal/30 bg-signal-muted/20 font-mono text-[11px] tracking-wide tabular-nums text-signal uppercase"
    >
      <span aria-hidden className="text-signal">
        ●
      </span>
      {t('dashboard:presence.online', { count, formattedCount })}
    </Badge>
  );
}
