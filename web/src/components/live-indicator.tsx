import { useTranslation } from 'react-i18next';
import { usePulseHub } from '@/realtime/use-pulse-hub';
import { cn } from '@/lib/utils';

const STATUS_KEY = {
  connected: 'connected',
  reconnecting: 'reconnecting',
  offline: 'offline',
} as const;

const DOT_CLASS = {
  connected: 'bg-signal shadow-[0_0_6px_var(--color-signal)]',
  reconnecting: 'bg-amber-400',
  offline: 'bg-destructive',
} as const;

/**
 * The header's single live indicator: one compact pill (status dot + "N
 * online"), replacing the old `ConnectionStatus` + `PresenceBadge` pair.
 * Connection state is carried by the dot color and the `title`/`aria-label`
 * ("Connected — 4 online" etc.) rather than a second visible badge — a
 * screen-reader user gets both pieces of information from the one element,
 * a sighted user gets the count at a glance and the connection detail on
 * hover/focus. `role="status"` matches its job (a live, changing count) and
 * gives the aria-label its accessible name.
 */
export function LiveIndicator() {
  const { t, i18n } = useTranslation('dashboard');
  const { connection, count } = usePulseHub();
  const formattedCount = new Intl.NumberFormat(i18n.language).format(count);
  const statusLabel = t(`dashboard:connectionStatus.${STATUS_KEY[connection]}`);
  const countLabel = t('dashboard:presence.online', { count, formattedCount });
  const label = t('dashboard:liveIndicator.ariaLabel', { status: statusLabel, count: countLabel });

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-signal/30 bg-signal-muted/20 px-2.5 py-1 font-mono text-[11px] tracking-wide tabular-nums text-signal-strong uppercase"
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT_CLASS[connection])} />
      {countLabel}
    </span>
  );
}
