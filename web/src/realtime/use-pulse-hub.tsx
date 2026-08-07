import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { useEventStore } from '@/stores/event-store';
import type { Reaction } from '@/types/pulse';
import { buildHub } from './hub';

const HEARTBEAT_INTERVAL_MS = 15_000;
const START_RETRY_MS = 5_000;

type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

type PulseHubContextValue = {
  count: number;
  connection: ConnectionStatus;
  /**
   * Resolves once the server has handled the `React` invocation (SignalR's
   * `invoke()` ack) — callers that need a genuine round-trip measurement
   * (e.g. "send a pulse") time from just before calling this to the
   * resolution. Rejects if the hub isn't connected or the invoke fails;
   * callers that don't care about the outcome may ignore the rejection.
   */
  react: (emoji: string) => Promise<void>;
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
      // A reaction doesn't change visits or metrics server-side (presence is
      // handled separately via PresenceUpdated/setCount), so there's nothing
      // to invalidate here — metrics and visits already refetch on their own
      // polling intervals (3s / 10s respectively).
      useEventStore.getState().push({ kind: 'reaction', emoji: reaction.emoji, at: reaction.at });
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

  const react = useCallback((emoji: string): Promise<void> => {
    const hub = connectionRef.current;
    if (!hub) return Promise.reject(new Error('not connected'));
    return hub.invoke('React', emoji);
  }, []);

  const value = useMemo<PulseHubContextValue>(
    () => ({ count, connection, react }),
    [count, connection, react],
  );

  return <PulseHubContext.Provider value={value}>{children}</PulseHubContext.Provider>;
}

export function usePulseHub(): PulseHubContextValue {
  const ctx = useContext(PulseHubContext);
  if (!ctx) throw new Error('usePulseHub must be used within a PulseHubProvider');
  return ctx;
}
