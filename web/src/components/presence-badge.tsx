import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { usePulseHub } from '@/realtime/use-pulse-hub';

export function PresenceBadge() {
  const { t, i18n } = useTranslation('dashboard');
  const { count } = usePulseHub();
  const formattedCount = new Intl.NumberFormat(i18n.language).format(count);

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span className="text-emerald-500">●</span>
      {t('dashboard:presence.online', { count, formattedCount })}
    </Badge>
  );
}
