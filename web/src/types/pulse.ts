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

export type Reaction = {
  emoji: string;
  at: string;
};

export type PulseEvent = {
  kind: 'visit' | 'reaction';
  label: string;
  at: string;
};
