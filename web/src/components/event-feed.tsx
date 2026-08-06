import { Heart, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/format';
import { useEventStore } from '@/stores/event-store';
import type { PulseEvent } from '@/types/pulse';

const KIND_ICON = {
  visit: MapPin,
  reaction: Heart,
} as const;

type EventFeedProps = {
  /** Reference instant for relative-time formatting. Defaults to the real current time. */
  now?: Date;
};

export function EventFeed({ now = new Date() }: EventFeedProps = {}) {
  const { t, i18n } = useTranslation('dashboard');
  const events = useEventStore((s) => s.events);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard:eventFeed.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard:eventFeed.empty')}</p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {events.map((event: PulseEvent, index) => {
              const Icon = KIND_ICON[event.kind];
              const label =
                event.kind === 'visit'
                  ? t('dashboard:eventFeed.visit', { city: event.city, country: event.country })
                  : t('dashboard:eventFeed.reaction', { emoji: event.emoji });
              return (
                <li key={`${event.at}-${index}`} className="flex items-start gap-2 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(event.at, now, i18n.language)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
