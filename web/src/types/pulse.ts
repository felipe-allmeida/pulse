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

export type Reaction = {
  emoji: string;
  at: string;
};

export type PulseEvent =
  | { kind: 'visit'; city: string; country: string; at: string }
  | { kind: 'reaction'; emoji: string; at: string };
