import { Heart, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    /*
      `h-full` + the flex column below let this card track the height of
      whatever it sits beside in a grid row (the map on `/`, the visits chart
      on `/live`) and hand that height down to the list. The list used to cap
      itself at a fixed `max-h-80`, which was independent of the card the grid
      had already stretched: short of the card's height it left dead space
      under the last entry, and past it hid entries behind a scroll boundary
      that didn't line up with anything visible. `min-h-0` on the content is
      what lets the scroll container actually shrink inside the flex parent.
    */
    <Card className="flex h-full flex-col border-signal/20 bg-signal-muted/10">
      <CardHeader>
        <SubsectionHeading>{t('dashboard:eventFeed.title')}</SubsectionHeading>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard:eventFeed.empty')}</p>
        ) : (
          <ul className="flex h-full flex-col gap-3 overflow-y-auto">
            {events.map((event: PulseEvent, index) => {
              const Icon = KIND_ICON[event.kind];
              const label =
                event.kind === 'visit'
                  ? t('dashboard:eventFeed.visit', { city: event.city, country: event.country })
                  : t('dashboard:eventFeed.pulse', { emoji: event.emoji });
              return (
                <li key={`${event.at}-${index}`} className="flex items-start gap-2 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-signal-strong" aria-hidden="true" />
                  <span className="flex-1 text-foreground/90">{label}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
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
