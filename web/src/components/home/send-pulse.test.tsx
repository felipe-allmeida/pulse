import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Resolves/rejects on demand — lets a test observe the in-flight state. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const usePulseHubMock = vi.fn();

vi.mock('@/realtime/use-pulse-hub', () => ({
  usePulseHub: () => usePulseHubMock(),
}));

const { SendPulse, PULSE_PAYLOAD } = await import('./send-pulse');

describe('SendPulse', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders a single button with an accessible name', async () => {
    usePulseHubMock.mockReturnValue({ count: 3, connection: 'connected', react: vi.fn() });

    await renderWithI18n(<SendPulse />);

    expect(screen.getByRole('button', { name: /send a pulse/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('calls the hub send with the fixed pulse payload on click', async () => {
    const react = vi.fn().mockResolvedValue(undefined);
    usePulseHubMock.mockReturnValue({ count: 3, connection: 'connected', react });

    await renderWithI18n(<SendPulse />);
    await act(async () => {
      screen.getByRole('button', { name: /send a pulse/i }).click();
    });

    expect(react).toHaveBeenCalledWith(PULSE_PAYLOAD);
    expect(react).toHaveBeenCalledTimes(1);
  });

  it('renders and announces the measured round-trip duration once the send resolves', async () => {
    const { promise, resolve } = deferred<void>();
    const react = vi.fn().mockReturnValue(promise);
    usePulseHubMock.mockReturnValue({ count: 5, connection: 'connected', react });

    // A controllable clock rather than a one-shot value queue: React (and
    // testing-library) make plenty of their own `performance.now()` calls
    // around ours, so a fixed two-call sequence gets consumed by those
    // instead of by the component. Holding a mutable "current time" and
    // bumping it right before the send resolves isolates the measurement
    // to exactly the client-observed round trip.
    let clock = 1_000;
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => clock);

    await renderWithI18n(<SendPulse />);
    await act(async () => {
      screen.getByRole('button', { name: /send a pulse/i }).click();
    });

    clock = 1_038;
    await act(async () => {
      resolve();
      await promise;
    });

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/38 ms/);

    nowSpy.mockRestore();
  });

  it('shows the current presence count alongside the measured duration, never an invented number', async () => {
    const { promise, resolve } = deferred<void>();
    const react = vi.fn().mockReturnValue(promise);
    usePulseHubMock.mockReturnValue({ count: 12, connection: 'connected', react });

    let clock = 0;
    const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => clock);

    await renderWithI18n(<SendPulse />);
    await act(async () => {
      screen.getByRole('button', { name: /send a pulse/i }).click();
    });

    clock = 20;
    await act(async () => {
      resolve();
      await promise;
    });

    expect(screen.getByRole('status').textContent).toMatch(/12/);

    nowSpy.mockRestore();
  });

  it('disables the button while the send is in flight and re-enables it after', async () => {
    const { promise, resolve } = deferred<void>();
    const react = vi.fn().mockReturnValue(promise);
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });

    await renderWithI18n(<SendPulse />);
    const button = screen.getByRole('button', { name: /send a pulse/i });

    act(() => {
      button.click();
    });

    expect(button).toBeDisabled();

    await act(async () => {
      resolve();
      await promise;
    });

    expect(button).not.toBeDisabled();
  });

  it('ignores rapid re-clicks while a send is already in flight', async () => {
    const { promise, resolve } = deferred<void>();
    const react = vi.fn().mockReturnValue(promise);
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });

    await renderWithI18n(<SendPulse />);
    const button = screen.getByRole('button', { name: /send a pulse/i });

    act(() => {
      button.click();
      button.click();
      button.click();
    });

    expect(react).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve();
      await promise;
    });
  });

  it('shows an honest neutral state, never a fake time, when the send fails', async () => {
    const react = vi.fn().mockRejectedValue(new Error('offline'));
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'offline', react });

    await renderWithI18n(<SendPulse />);
    await act(async () => {
      screen.getByRole('button', { name: /send a pulse/i }).click();
    });

    const status = screen.getByRole('status');
    expect(status.textContent).not.toMatch(/\d+\s*ms/);
    expect(status.textContent).toMatch(/couldn't reach|could not reach/i);

    // The button stays usable after a failure.
    expect(screen.getByRole('button', { name: /send a pulse/i })).not.toBeDisabled();
  });

  it('does not schedule a traversal animation under prefers-reduced-motion', async () => {
    mockMatchMedia(true);
    const react = vi.fn().mockResolvedValue(undefined);
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });
    const onPulse = vi.fn();

    await renderWithI18n(<SendPulse onPulse={onPulse} />);
    await act(async () => {
      screen.getByRole('button', { name: /send a pulse/i }).click();
    });

    expect(onPulse).not.toHaveBeenCalled();
  });

  it('schedules a traversal animation when motion is not reduced', async () => {
    mockMatchMedia(false);
    const react = vi.fn().mockResolvedValue(undefined);
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react });
    const onPulse = vi.fn();

    await renderWithI18n(<SendPulse onPulse={onPulse} />);
    await act(async () => {
      screen.getByRole('button', { name: /send a pulse/i }).click();
    });

    expect(onPulse).toHaveBeenCalledTimes(1);
  });

  it('renders the localized pt-BR button label', async () => {
    usePulseHubMock.mockReturnValue({ count: 0, connection: 'connected', react: vi.fn() });

    await renderWithI18n(<SendPulse />, { locale: 'pt-BR' });

    expect(screen.getByRole('button', { name: /enviar um pulso/i })).toBeInTheDocument();
  });
});
