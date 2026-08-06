import { Heart, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';
import type { PulseEvent } from '@/types/pulse';

const MAX_VISIBLE = 5;

const KIND_ICON = {
  visit: MapPin,
  reaction: Heart,
} as const;

function eventLabel(t: (key: string, opts?: Record<string, unknown>) => string, event: PulseEvent): string {
  return event.kind === 'visit'
    ? t('dashboard:eventFeed.visit', { city: event.city, country: event.country })
    : t('dashboard:eventFeed.reaction', { emoji: event.emoji });
}

/**
 * Compact, decorative live feed for the engineering showcase — reuses the
 * same `PulseEvent` store the dashboard's `EventFeed` reads from (populated
 * by `useVisitFeed`, mounted elsewhere) rather than fetching anything of its
 * own. Shows the most recent {@link MAX_VISIBLE} events, newest first, and
 * reuses the dashboard's `eventFeed` translation keys so the wording never
 * drifts between the two surfaces.
 */
export function EventStream() {
  const { t } = useTranslation(['home', 'dashboard']);
  const events = useEventStore((s) => s.events);
  const reducedMotion = useReducedMotion();
  const visible = events.slice(0, MAX_VISIBLE);

  return (
    <div className="rounded-lg border border-signal/20 bg-signal-muted/10 p-4 font-mono">
      <div className="flex items-center justify-end gap-1.5 text-xs text-signal">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full rounded-full bg-signal opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
        </span>
        {t('home:eventStream.live')}
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('dashboard:eventFeed.empty')}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {visible.map((event, index) => {
            const Icon = KIND_ICON[event.kind];
            return (
              <li
                key={`${event.at}-${index}`}
                data-motion={reducedMotion ? 'static' : 'animated'}
                className={cn(
                  'flex items-start gap-2 text-sm text-foreground/90',
                  !reducedMotion && 'animate-event-slide-in',
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
                <span className="flex-1 truncate">{eventLabel(t, event)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
