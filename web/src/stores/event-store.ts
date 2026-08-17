import { create } from 'zustand';
import type { PulseEvent } from '@/types/pulse';

const MAX_EVENTS = 50;

type EventState = {
  events: PulseEvent[];
  /**
   * Identities (see `visitIdentity`) of every visit already folded into
   * `events`. It lives here, beside the events themselves, rather than in a
   * ref inside `useVisitFeed` — the store is a singleton shared by `/` and
   * `/live`, so a per-instance ref reset itself on every route change and let
   * the next mount replay visits the feed was already showing.
   */
  seenVisits: Set<string>;
  push: (e: PulseEvent) => void;
  markSeen: (ids: string[]) => void;
};

export const useEventStore = create<EventState>()((set) => ({
  events: [],
  seenVisits: new Set(),
  push: (e) => set((s) => ({ events: [e, ...s.events].slice(0, MAX_EVENTS) })),
  markSeen: (ids) => set((s) => ({ seenVisits: new Set([...s.seenVisits, ...ids]) })),
}));
