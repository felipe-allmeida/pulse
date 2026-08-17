import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useTranslation } from 'react-i18next';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { countryCounts, matchCountryName } from '@/lib/geo';
import { useVisits } from '@/lib/api';
import { byNewest, EMPTY_POINTS } from '@/lib/points';
import { useWorld } from '@/hooks/use-world';

const WIDTH = 800;
const HEIGHT = 420;
const RECENT_PING_COUNT = 20;

type LiveMapProps = {
  /**
   * Optional content rendered opposite the card's heading. The home page uses
   * it to hang the live counters off the map's own header (see `MapStats`)
   * instead of giving them a `KpiRow` band of their own; `/live`, which keeps
   * that band, passes nothing and renders exactly as before.
   */
  stats?: ReactNode;
};

export function LiveMap({ stats }: LiveMapProps = {}) {
  const { t } = useTranslation('dashboard');
  const { data } = useVisits();
  const points = data ?? EMPTY_POINTS;

  const counts = useMemo(() => countryCounts(points), [points]);
  const maxCount = useMemo(() => Math.max(0, ...counts.values()), [counts]);
  const pings = useMemo(() => byNewest(points, RECENT_PING_COUNT), [points]);

  const world = useWorld();
  /*
    Undefined until the geometry lands. Do NOT substitute an empty
    FeatureCollection to keep this non-null: `fitSize` derives its scale from
    the object's bounds, and empty bounds give an Infinity scale, so every
    `projection([lon, lat])` call downstream returns NaN and the pings render
    at NaN coordinates rather than not rendering.
  */
  const projected = useMemo(() => {
    if (!world) return undefined;
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], world);
    return { projection, path: geoPath(projection) };
  }, [world]);

  const loggedUnmatchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!import.meta.env.DEV || !world) return;
    const featureKeys = new Set(world.features.map((f) => matchCountryName(f.properties.name)));
    const unmatched = Array.from(counts.keys()).filter(
      (key) => !featureKeys.has(key) && !loggedUnmatchedRef.current.has(key)
    );
    if (unmatched.length === 0) return;
    for (const key of unmatched) loggedUnmatchedRef.current.add(key);
    // eslint-disable-next-line no-console
    console.warn('[LiveMap] visit countries with no matching map feature:', unmatched);
  }, [counts, world]);

  return (
    <Card className="flex h-full flex-col border-signal/20 bg-signal-muted/10">
      {/*
        `CardHeader` is a grid by default; with stats present it becomes a row
        that splits heading and counters to opposite ends, stacking on narrow
        viewports so neither gets squeezed.
      */}
      <CardHeader className={stats ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between' : undefined}>
        <SubsectionHeading>{t('dashboard:liveMap.title')}</SubsectionHeading>
        {stats}
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={t('dashboard:liveMap.ariaLabel')}
        >
          <g>
            {/*
              Empty until the geometry lands (see useWorld) — which also
              means it's empty for the whole build-time render, since effects
              never run there. The country outlines are ~200 KB of path data
              per document and carry no information a crawler can use — the
              map is decoration around the numbers, and the numbers are live
              anyway. The client draws it a moment later, from the same data
              already in the bundle. Everything else on the page prerenders
              normally.
            */}
            {(projected ? world!.features : []).map((geo) => {
              const count = counts.get(matchCountryName(geo.properties.name)) ?? 0;
              const ratio = maxCount > 0 ? count / maxCount : 0;
              const fill = `color-mix(in oklch, var(--color-chart-1) ${Math.round(ratio * 100)}%, var(--color-muted))`;
              return (
                <path key={geo.id ?? geo.properties.name} d={projected!.path(geo) ?? undefined} fill={fill} stroke="var(--color-background)" strokeWidth={0.5}>
                  {/* One interpolated string, not text + value siblings: React
                      cannot collapse an array of children into a <title>, and
                      warns about it on every build-time render. */}
                  <title>{`${geo.properties.name} — ${t('dashboard:liveMap.visitCount', { count })}`}</title>
                </path>
              );
            })}
          </g>
          <g>
            {(projected ? pings : []).map((p, i) => {
              const coords = projected!.projection([p.lon, p.lat]);
              if (!coords) return null;
              const [x, y] = coords;
              return (
                <g key={`${p.at}-${p.city}-${i}`} transform={`translate(${x}, ${y})`}>
                  <circle className="live-map-ping-ring" r={3} fill="none" stroke="var(--color-chart-1)" strokeWidth={1.5}>
                    <title>{`${p.city}, ${p.country}`}</title>
                  </circle>
                  <circle r={2} fill="var(--color-chart-1)">
                    <title>{`${p.city}, ${p.country}`}</title>
                  </circle>
                </g>
              );
            })}
          </g>
        </svg>
        <a
          href="https://db-ip.com"
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-right text-xs text-muted-foreground hover:underline"
        >
          {t('dashboard:ipAttribution')}
        </a>
      </CardContent>
    </Card>
  );
}
