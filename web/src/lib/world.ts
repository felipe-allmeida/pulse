import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import countriesTopology from '@/assets/countries-110m.json';

type CountryProperties = { name: string };

const topology = countriesTopology as unknown as Topology<{
  countries: GeometryCollection<CountryProperties>;
}>;

/**
 * World landmasses as a GeoJSON FeatureCollection, decoded once from the
 * bundled world-atlas/Natural Earth topojson. Shared by every consumer that
 * needs the map geometry (`LiveMap`, `HeroMap`) so there is a single decode
 * and a single source of truth for the geometry + `properties.name` values
 * `matchCountryName` aliases against.
 */
export const world = feature(topology, topology.objects.countries);
