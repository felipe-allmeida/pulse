import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/query-client';
import { useEventStore } from '@/stores/event-store';
import { PulseHubProvider, usePulseHub } from './use-pulse-hub';

type Handler = (...args: unknown[]) => void;

function createFakeHub() {
  const handlers = new Map<string, Handler[]>();
  return {
    on: vi.fn((event: string, cb: Handler) => {
      const list = handlers.get(event) ?? [];
      list.push(cb);
      handlers.set(event, list);
    }),
    off: vi.fn((event: string, cb: Handler) => {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== cb));
    }),
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    invoke: vi.fn(async () => {}),
    onreconnecting: vi.fn(),
    onreconnected: vi.fn(),
    onclose: vi.fn(),
    fire: (event: string, ...args: unknown[]) => {
      for (const cb of handlers.get(event) ?? []) cb(...args);
    },
  };
}

const fakeHub = createFakeHub();

// Overridable per-test so the "unmount before buildHub() resolves" test can
// control exactly when the promise settles, instead of it auto-resolving.
let buildHubImpl: () => Promise<ReturnType<typeof createFakeHub>> = () => Promise.resolve(fakeHub);

vi.mock('./hub', () => ({
  buildHub: () => buildHubImpl(),
}));

function Probe() {
  const { count, connection, react } = usePulseHub();
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="connection">{connection}</span>
      <button onClick={() => react('🔥')}>react</button>
    </div>
  );
}

describe('PulseHubProvider / usePulseHub', () => {
  beforeEach(() => {
    fakeHub.on.mockClear();
    fakeHub.off.mockClear();
    fakeHub.start.mockClear();
    fakeHub.stop.mockClear();
    fakeHub.invoke.mockClear();
    useEventStore.setState({ events: [] });
    buildHubImpl = () => Promise.resolve(fakeHub);
  });

  it('tracks presence count from PresenceUpdated', async () => {
    render(
      <PulseHubProvider>
        <Probe />
      </PulseHubProvider>,
    );

    await act(async () => {
      // Let the buildHub() promise settle so handlers are registered on the
      // hub before we fire an event at it.
      await Promise.resolve();
      fakeHub.fire('PresenceUpdated', 3);
    });

    expect(screen.getByTestId('count').textContent).toBe('3');
  });

  it('pushes a reaction event into the event store on ReactionReceived', async () => {
    render(
      <PulseHubProvider>
        <Probe />
      </PulseHubProvider>,
    );

    await act(async () => {
      // Let the buildHub() promise settle so handlers are registered on the
      // hub before we fire an event at it.
      await Promise.resolve();
      fakeHub.fire('ReactionReceived', { emoji: '🎉', at: '2026-08-04T10:00:00Z' });
    });

    expect(useEventStore.getState().events[0]).toEqual({
      kind: 'reaction',
      emoji: '🎉',
      at: '2026-08-04T10:00:00Z',
    });
  });

  it('does not invalidate visits or metrics queries on ReactionReceived (presence is handled via setCount)', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    render(
      <PulseHubProvider>
        <Probe />
      </PulseHubProvider>,
    );

    await act(async () => {
      // Let the buildHub() promise settle so handlers are registered on the
      // hub before we fire an event at it — otherwise the event is dropped
      // silently and this negative assertion passes vacuously regardless of
      // what onReactionReceived actually does.
      await Promise.resolve();
      fakeHub.fire('ReactionReceived', { emoji: '🎉', at: '2026-08-04T10:00:00Z' });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    invalidateSpy.mockRestore();
  });

  it('keeps a stable context value reference across unrelated re-renders', async () => {
    const seen: unknown[] = [];

    function ValueProbe() {
      seen.push(usePulseHub());
      return null;
    }

    function Wrapper() {
      const [, setTick] = useState(0);
      return (
        <PulseHubProvider>
          <ValueProbe />
          <button onClick={() => setTick((t) => t + 1)}>tick</button>
        </PulseHubProvider>
      );
    }

    render(<Wrapper />);
    // Let the hub's start() promise settle so `connection` stabilizes before
    // we capture the reference we compare against.
    await act(async () => {
      await Promise.resolve();
    });
    const first = seen[seen.length - 1];

    await act(async () => {
      screen.getByText('tick').click();
    });
    const second = seen[seen.length - 1];

    expect(second).toBe(first);
  });

  it('invokes React on the hub when react() is called', async () => {
    render(
      <PulseHubProvider>
        <Probe />
      </PulseHubProvider>,
    );

    await act(async () => {
      // Let the buildHub() promise settle so connectionRef is populated
      // before we invoke react() on it.
      await Promise.resolve();
      screen.getByText('react').click();
    });

    expect(fakeHub.invoke).toHaveBeenCalledWith('React', '🔥');
  });

  it('sends a Heartbeat every 15s and stops on unmount', async () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(
        <PulseHubProvider>
          <Probe />
        </PulseHubProvider>,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(fakeHub.invoke).toHaveBeenCalledWith('Heartbeat');

      unmount();
      expect(fakeHub.stop).toHaveBeenCalled();

      fakeHub.invoke.mockClear();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(fakeHub.invoke).not.toHaveBeenCalledWith('Heartbeat');
    } finally {
      vi.useRealTimers();
    }
  });

  it('recovers from a failed initial start by retrying after 5s, without throwing', async () => {
    vi.useFakeTimers();
    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (event: Event) => {
      unhandledRejections.push((event as PromiseRejectionEvent).reason);
    };
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    try {
      // First start() rejects (handshake failure at page load); subsequent
      // calls fall back to the default resolved implementation.
      fakeHub.start.mockImplementationOnce(() => Promise.reject(new Error('handshake failed')));

      render(
        <PulseHubProvider>
          <Probe />
        </PulseHubProvider>,
      );

      // Let the rejected start() promise settle.
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(fakeHub.start).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('connection').textContent).toBe('offline');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });

      expect(fakeHub.start).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('connection').textContent).toBe('connected');
      expect(unhandledRejections).toEqual([]);
    } finally {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      vi.useRealTimers();
    }
  });

  it('does not register handlers, start, or leak a heartbeat when unmounted before buildHub() resolves', async () => {
    // React StrictMode double-invokes effects in dev, and any unmount can
    // race an in-flight dynamic import — this simulates buildHub() arriving
    // *after* the effect has already been cleaned up.
    const lateHub = createFakeHub();
    let resolveBuild!: (hub: ReturnType<typeof createFakeHub>) => void;
    buildHubImpl = () => new Promise((resolve) => { resolveBuild = resolve; });

    const { unmount } = render(
      <PulseHubProvider>
        <Probe />
      </PulseHubProvider>,
    );

    // Unmount synchronously, before anything has been awaited — buildHub()'s
    // promise is still pending and its .then() callback has not run yet.
    unmount();

    // Now let the build "arrive late" and flush microtasks.
    await act(async () => {
      resolveBuild(lateHub);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(lateHub.on).not.toHaveBeenCalled();
    expect(lateHub.start).not.toHaveBeenCalled();
    expect(lateHub.stop).not.toHaveBeenCalled();

    // A heartbeat scheduled from the late callback would never be cleared
    // (cleanup already ran) — confirm none was scheduled by advancing well
    // past the interval and checking invoke was never reached.
    vi.useFakeTimers();
    try {
      await vi.advanceTimersByTimeAsync(60_000);
      expect(lateHub.invoke).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
