export type Metrics = {
  activeConnections: number;
  totalVisits: number;
};

export type VisitPoint = {
  lat: number;
  lon: number;
  city: string;
  country: string;
  at: string;
};

/** The caller's own coarse geo, as resolved by the API from the connecting IP. */
export type VisitorGeo = {
  city: string;
  country: string;
  lat: number;
  lon: number;
};

/** The most recent visit from a city other than the caller's — never the caller themselves. */
export type PreviousVisit = {
  city: string;
  country: string;
  at: string;
};

/**
 * `GET /api/visitor` — the visitor's own geo plus the historical counts the
 * rarity cascade picks a greeting from. Every count describes the state
 * *before* this visit lands, so the client adds the visitor in itself.
 */
export type VisitorContext = {
  geo: VisitorGeo | null;
  totalVisits: number;
  cityVisits: number;
  lastCityVisitAt: string | null;
  visitsLast24h: number;
  previous: PreviousVisit | null;
};

/** One place the site has been reached from, and how often. `city` is empty on country rows. */
export type PlaceCount = {
  city: string;
  country: string;
  count: number;
};

/**
 * `GET /api/stats` — all-time reach, aggregated over the whole audit log rather
 * than the 100-row window `/api/map` hands the map. Every figure shares that
 * endpoint's "resolved geo only" filter, so the rankings line up with the dots
 * on the map — and are deliberately smaller than `Metrics.totalVisits`, which
 * is a raw row count.
 */
export type Stats = {
  countries: number;
  cities: number;
  /** Oldest recorded visit — what "all-time" is relative to. Null before any visit resolves. */
  firstVisitAt: string | null;
  topCountries: PlaceCount[];
  topCities: PlaceCount[];
};

export type Reaction = {
  emoji: string;
  at: string;
};

export type PulseEvent =
  | { kind: 'visit'; city: string; country: string; at: string }
  | { kind: 'reaction'; emoji: string; at: string };
