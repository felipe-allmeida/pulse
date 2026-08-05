import { create } from 'zustand';
import type { PulseEvent } from '@/types/pulse';

const MAX_EVENTS = 50;

type EventState = {
  events: PulseEvent[];
  push: (e: PulseEvent) => void;
};

export const useEventStore = create<EventState>()((set) => ({
  events: [],
  push: (e) => set((s) => ({ events: [e, ...s.events].slice(0, MAX_EVENTS) })),
}));
