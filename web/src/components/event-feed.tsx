import { Heart, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/components/recent-visits-table';
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
  const events = useEventStore((s) => s.events);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {events.map((event: PulseEvent, index) => {
              const Icon = KIND_ICON[event.kind];
              return (
                <li key={`${event.at}-${index}`} className="flex items-start gap-2 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{event.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(event.at, now)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
