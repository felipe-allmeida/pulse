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
    // Guards every callback below (retry loop, handler registration, start,
    // heartbeat) so a late-arriving buildHub() resolution — after unmount or
    // React StrictMode's dev double-invoke — can't wire up state that
    // nothing will ever tear down.
    let cancelled = false;
    let hub: HubConnection | undefined;
    let onPresenceUpdated: ((n: number) => void) | undefined;
    let onReactionReceived: ((reaction: Reaction) => void) | undefined;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    void buildHub().then((built) => {
      if (cancelled) return;
      hub = built;
      connectionRef.current = built;

      onPresenceUpdated = (n: number) => setCount(n);
      onReactionReceived = (reaction: Reaction) => {
        // A reaction doesn't change visits or metrics server-side (presence
        // is handled separately via PresenceUpdated/setCount), so there's
        // nothing to invalidate here — metrics and visits already refetch on
        // their own polling intervals (3s / 10s respectively).
        useEventStore.getState().push({ kind: 'reaction', emoji: reaction.emoji, at: reaction.at });
      };

      built.on('PresenceUpdated', onPresenceUpdated);
      built.on('ReactionReceived', onReactionReceived);
      built.onreconnecting(() => setConnection('reconnecting'));
      built.onreconnected(() => setConnection('connected'));
      built.onclose(() => setConnection('offline'));

      // withAutomaticReconnect() only resumes a connection that previously
      // succeeded — it never retries a failed *initial* start(). So a
      // failure here (backend down at page load, CORS, etc.) needs its own
      // bounded self-heal retry, otherwise the dashboard is stuck 'offline'
      // forever even after the backend comes back up.
      const attemptStart = () => {
        built
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

      heartbeat = setInterval(() => {
        built.invoke('Heartbeat').catch(() => {});
      }, HEARTBEAT_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (heartbeat) clearInterval(heartbeat);
      if (hub && onPresenceUpdated) hub.off('PresenceUpdated', onPresenceUpdated);
      if (hub && onReactionReceived) hub.off('ReactionReceived', onReactionReceived);
      // stop() rejects when called mid-handshake (fast mount/unmount, e.g.
      // React StrictMode's dev double-invoke) — swallow it, we're tearing
      // down regardless. If the hub never finished loading, there's nothing
      // to stop.
      void hub?.stop().catch(() => {});
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
