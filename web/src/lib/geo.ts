import type { VisitPoint } from '@/types/pulse';

/**
 * GeoLite2 country names and the topojson (world-atlas / Natural Earth)
 * `properties.name` values don't always agree. This alias map normalizes
 * both spellings to the SAME key so a visit's country matches the right
 * map feature. Every entry below is listed as `variant -> canonical`;
 * `matchCountryName` normalizes any input (whichever side supplied it) to
 * that canonical key.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  // GeoLite2 full/formal name -> canonical key.
  'united states of america': 'united states',
  'russian federation': 'russia',
  'republic of korea': 'south korea',
  'korea, republic of': 'south korea',
  'czech republic': 'czechia',
  'united kingdom of great britain and northern ireland': 'united kingdom',
  'viet nam': 'vietnam',
  'lao people’s democratic republic': 'laos',
  "lao people's democratic republic": 'laos',
  'iran (islamic republic of)': 'iran',
  'islamic republic of iran': 'iran',
  'syrian arab republic': 'syria',
  'bolivia (plurinational state of)': 'bolivia',
  'venezuela (bolivarian republic of)': 'venezuela',
  'tanzania, united republic of': 'tanzania',
  'united republic of tanzania': 'tanzania',
  'moldova, republic of': 'moldova',
  'republic of moldova': 'moldova',
  'brunei darussalam': 'brunei',
  "democratic people's republic of korea": 'north korea',
  "korea (democratic people's republic of)": 'north korea',
  'congo, the democratic republic of the': 'democratic republic of the congo',
  'dem. rep. congo': 'democratic republic of the congo',
  'republic of the congo': 'congo',
  "côte d'ivoire": 'ivory coast',
  'cote d’ivoire': 'ivory coast',
  'burma': 'myanmar',
  'north macedonia': 'macedonia',
  'macedonia, the former yugoslav republic of': 'macedonia',

  // world-atlas/Natural Earth abbreviates several names in the bundled
  // countries-110m.json — alias those short forms to the same canonical
  // key as the GeoLite2 full name so the choropleth still matches.
  'central african rep.': 'central african republic',
  'bosnia and herz.': 'bosnia and herzegovina',
  'dominican rep.': 'dominican republic',
  'eq. guinea': 'equatorial guinea',
  'fr. s. antarctic lands': 'french southern territories',
  's. sudan': 'south sudan',
  'solomon is.': 'solomon islands',
  'falkland is.': 'falkland islands',
  'w. sahara': 'western sahara',
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normalizes a raw country name (from GeoLite2 or a topojson feature) into
 * a canonical key shared by both sources. Unknown names fall back to their
 * normalized form so they still key consistently even without an alias.
 */
export function matchCountryName(name: string): string {
  const normalized = normalize(name);
  return COUNTRY_ALIASES[normalized] ?? normalized;
}

/** Aggregates visit points into visit counts keyed by normalized country name. */
export function countryCounts(points: VisitPoint[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const point of points) {
    const key = matchCountryName(point.country);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Buckets visit points into hourly counts, keyed by ISO hour (e.g. "2026-08-04T21:00"). */
export function bucketByHour(points: VisitPoint[]): Array<{ hour: string; count: number }> {
  const counts = new Map<string, number>();
  for (const point of points) {
    const date = new Date(point.at);
    const hour = Number.isNaN(date.getTime())
      ? 'invalid'
      : `${date.toISOString().slice(0, 13)}:00`;
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}
