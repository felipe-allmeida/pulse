import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { usePulseHub } from '@/realtime/use-pulse-hub';
import { cn } from '@/lib/utils';

const STATUS_KEY = {
  connected: 'connected',
  reconnecting: 'reconnecting',
  offline: 'offline',
} as const;

const STATUS_CLASS = {
  connected: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  reconnecting: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  offline: 'border-destructive/30 bg-destructive/10 text-destructive',
} as const;

export function ConnectionStatus() {
  const { t } = useTranslation('dashboard');
  const { connection } = usePulseHub();

  return (
    <Badge
      variant="outline"
      className={cn('font-mono text-[11px] tracking-wide uppercase', STATUS_CLASS[connection])}
    >
      {t(`dashboard:connectionStatus.${STATUS_KEY[connection]}`)}
    </Badge>
  );
}
