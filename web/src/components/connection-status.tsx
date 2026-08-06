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
  connected: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  reconnecting: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
  offline: 'border-transparent bg-destructive/15 text-destructive',
} as const;

export function ConnectionStatus() {
  const { t } = useTranslation('dashboard');
  const { connection } = usePulseHub();

  return (
    <Badge variant="outline" className={cn(STATUS_CLASS[connection])}>
      {t(`dashboard:connectionStatus.${STATUS_KEY[connection]}`)}
    </Badge>
  );
}
