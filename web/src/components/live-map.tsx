import { useEffect, useMemo, useRef } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useTranslation } from 'react-i18next';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { countryCounts, matchCountryName } from '@/lib/geo';
import { useVisits } from '@/lib/api';
import { byNewest, EMPTY_POINTS } from '@/lib/points';
import { world } from '@/lib/world';

const WIDTH = 800;
const HEIGHT = 420;
const RECENT_PING_COUNT = 20;

const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], world);
const path = geoPath(projection);

export function LiveMap() {
  const { t } = useTranslation('dashboard');
  const { data } = useVisits();
  const points = data ?? EMPTY_POINTS;

  const counts = useMemo(() => countryCounts(points), [points]);
  const maxCount = useMemo(() => Math.max(0, ...counts.values()), [counts]);
  const pings = useMemo(() => byNewest(points, RECENT_PING_COUNT), [points]);

  const loggedUnmatchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const featureKeys = new Set(world.features.map((f) => matchCountryName(f.properties.name)));
    const unmatched = Array.from(counts.keys()).filter(
      (key) => !featureKeys.has(key) && !loggedUnmatchedRef.current.has(key)
    );
    if (unmatched.length === 0) return;
    for (const key of unmatched) loggedUnmatchedRef.current.add(key);
    // eslint-disable-next-line no-console
    console.warn('[LiveMap] visit countries with no matching map feature:', unmatched);
  }, [counts]);

  return (
    <Card className="border-signal/20 bg-signal-muted/10">
      <CardHeader>
        <SubsectionHeading>{t('dashboard:liveMap.title')}</SubsectionHeading>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={t('dashboard:liveMap.ariaLabel')}
        >
          <g>
            {world.features.map((geo) => {
              const count = counts.get(matchCountryName(geo.properties.name)) ?? 0;
              const ratio = maxCount > 0 ? count / maxCount : 0;
              const fill = `color-mix(in oklch, var(--color-chart-1) ${Math.round(ratio * 100)}%, var(--color-muted))`;
              return (
                <path key={geo.id ?? geo.properties.name} d={path(geo) ?? undefined} fill={fill} stroke="var(--color-background)" strokeWidth={0.5}>
                  <title>
                    {geo.properties.name} — {t('dashboard:liveMap.visitCount', { count })}
                  </title>
                </path>
              );
            })}
          </g>
          <g>
            {pings.map((p, i) => {
              const coords = projection([p.lon, p.lat]);
              if (!coords) return null;
              const [x, y] = coords;
              return (
                <g key={`${p.at}-${p.city}-${i}`} transform={`translate(${x}, ${y})`}>
                  <circle className="live-map-ping-ring" r={3} fill="none" stroke="var(--color-chart-1)" strokeWidth={1.5}>
                    <title>
                      {p.city}, {p.country}
                    </title>
                  </circle>
                  <circle r={2} fill="var(--color-chart-1)">
                    <title>
                      {p.city}, {p.country}
                    </title>
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
