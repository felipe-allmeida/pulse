import { useTranslation } from 'react-i18next';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlaceCount } from '@/types/pulse';

const SKELETON_ROWS = 5;

type RankedPlacesProps = {
  title: string;
  /** The distinct-place count shown beside the title — the whole of which `places` is the busiest slice. */
  total: number | undefined;
  /** Wording for that count, e.g. "12 countries". */
  totalLabel: string;
  places: PlaceCount[] | undefined;
  isLoading: boolean;
  /** How to name one row. Country rows carry an empty `city`, so they format differently. */
  format: (place: PlaceCount) => string;
};

/**
 * A ranked list of places with a proportion bar per row.
 *
 * The bar is scaled against the busiest row rather than the total, because the
 * point of the shape is "how do these compare to each other", and against a
 * total dominated by one origin city every other bar collapses to a sliver.
 */
export function RankedPlaces({ title, total, totalLabel, places, isLoading, format }: RankedPlacesProps) {
  const { t, i18n } = useTranslation('dashboard');
  const rows = places ?? [];
  const max = Math.max(1, ...rows.map((p) => p.count));
  const formatCount = (n: number) => new Intl.NumberFormat(i18n.language).format(n);

  return (
    <Card className="flex h-full flex-col border-signal/20 bg-signal-muted/10">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <SubsectionHeading>{title}</SubsectionHeading>
        {total !== undefined && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{totalLabel}</span>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <ul className="flex flex-col gap-3">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <li key={`skeleton-${i}`} className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-1.5 w-full" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard:rankedPlaces.empty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((place) => (
              <li key={`${place.country}-${place.city}`} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-foreground/90">{format(place)}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatCount(place.count)}
                  </span>
                </div>
                {/*
                  Presentational: the row's text already states the place and
                  its count, so a screen reader reading the bar as well would
                  just repeat it.
                */}
                <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-signal-strong"
                    style={{ width: `${Math.max(2, Math.round((place.count / max) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
