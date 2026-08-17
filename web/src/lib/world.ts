import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

type CountryProperties = { name: string };
export type World = FeatureCollection<Geometry, CountryProperties>;

let cached: World | undefined;
let inFlight: Promise<World> | undefined;

/**
 * World landmasses as a GeoJSON FeatureCollection, decoded from the bundled
 * Natural Earth topojson.
 *
 * Dynamic on purpose. The topojson is 108 KB of JSON plus a decode, and a
 * static import put both into the route chunk — 431 KB raw, the largest in the
 * build, and the thing the mount now waits on (see mount-when-ready.ts).
 *
 * Nothing on the first paint needs it: HeroMap draws to a canvas, which
 * prerenders empty, and LiveMap deliberately omits the country paths from the
 * build-time render. The geometry is post-swap decoration, so it loads like
 * decoration.
 */
export async function loadWorld(): Promise<World> {
  if (cached) return cached;
  // Concurrent callers (both maps mount together on the home page) share one
  // fetch and one decode rather than racing to do it twice.
  inFlight ??= (async () => {
    const [{ feature }, { default: topology }] = await Promise.all([
      import('topojson-client'),
      import('@/assets/countries-110m.json'),
    ]);
    const typed = topology as unknown as Topology<{
      countries: GeometryCollection<CountryProperties>;
    }>;
    cached = feature(typed, typed.objects.countries) as World;
    return cached;
  })();
  return inFlight;
}

/** The geometry if `loadWorld()` has already resolved — for sync render paths. */
export function worldIfLoaded(): World | undefined {
  return cached;
}
