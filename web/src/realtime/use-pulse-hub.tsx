import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { queryClient } from '@/lib/query-client';
import { useEventStore } from '@/stores/event-store';
import type { Reaction } from '@/types/pulse';
import { buildHub } from './hub';

const HEARTBEAT_INTERVAL_MS = 15_000;
const START_RETRY_MS = 5_000;

type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

type PulseHubContextValue = {
  count: number;
  connection: ConnectionStatus;
  react: (emoji: string) => void;
};

const PulseHubContext = createContext<PulseHubContextValue | null>(null);

export function PulseHubProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [connection, setConnection] = useState<ConnectionStatus>('offline');
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const hub = buildHub();
    connectionRef.current = hub;
    // Guards the initial-start retry loop so it stops scheduling once the
    // effect has been cleaned up (unmount / StrictMode double-invoke).
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const onPresenceUpdated = (n: number) => setCount(n);
    const onReactionReceived = (reaction: Reaction) => {
      useEventStore.getState().push({ kind: 'reaction', label: `Reaction ${reaction.emoji}`, at: reaction.at });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    };

    hub.on('PresenceUpdated', onPresenceUpdated);
    hub.on('ReactionReceived', onReactionReceived);
    hub.onreconnecting(() => setConnection('reconnecting'));
    hub.onreconnected(() => setConnection('connected'));
    hub.onclose(() => setConnection('offline'));

    // withAutomaticReconnect() only resumes a connection that previously
    // succeeded — it never retries a failed *initial* start(). So a failure
    // here (backend down at page load, CORS, etc.) needs its own bounded
    // self-heal retry, otherwise the dashboard is stuck 'offline' forever
    // even after the backend comes back up.
    const attemptStart = () => {
      hub
        .start()
        .then(() => {
          if (!cancelled) setConnection('connected');
        })
        .catch(() => {
          if (cancelled) return;
          setConnection('offline');
          retryTimeout = setTimeout(attemptStart, START_RETRY_MS);
        });
    };
    attemptStart();

    const heartbeat = setInterval(() => {
      hub.invoke('Heartbeat').catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      clearInterval(heartbeat);
      hub.off('PresenceUpdated', onPresenceUpdated);
      hub.off('ReactionReceived', onReactionReceived);
      // stop() rejects when called mid-handshake (fast mount/unmount, e.g.
      // React StrictMode's dev double-invoke) — swallow it, we're tearing
      // down regardless.
      hub.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, []);

  const react = (emoji: string) => {
    connectionRef.current?.invoke('React', emoji).catch(() => {});
  };

  return <PulseHubContext.Provider value={{ count, connection, react }}>{children}</PulseHubContext.Provider>;
}

export function usePulseHub(): PulseHubContextValue {
  const ctx = useContext(PulseHubContext);
  if (!ctx) throw new Error('usePulseHub must be used within a PulseHubProvider');
  return ctx;
}
