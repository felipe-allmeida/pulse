import { useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { usePulseHub } from '@/realtime/use-pulse-hub';

/**
 * The one payload "send a pulse" ever sends. Must be a member of the
 * server's allow-list (`PresenceHub.Allowed`) — anything else is silently
 * dropped. Picked for what it reads as in the event feed and doesn't need
 * to mean anything beyond "a signal was sent".
 */
export const PULSE_PAYLOAD = '🚀';

type SendState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; rttMs: number }
  | { status: 'error' };

type SendPulseProps = {
  /**
   * Called once, synchronously, right before the pulse is sent — the caller
   * (engineering-showcase.tsx) uses this to play the traversal animation on
   * the architecture diagram in step with the real request. Never called
   * under `prefers-reduced-motion`.
   */
  onPulse?: () => void;
};

/**
 * Replaces the old emoji-reactions widget: one button that pushes a real
 * event through the real pipeline (SignalR `React` → `Clients.All`, echoed
 * back to the sender) and reports the genuinely measured round-trip time.
 * No fabricated numbers — if the send fails, the result says so instead of
 * showing a time.
 */
export function SendPulse({ onPulse }: SendPulseProps) {
  const { t } = useTranslation('home');
  const { react, count } = usePulseHub();
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<SendState>({ status: 'idle' });
  // Belt-and-suspenders against double-sends from fast repeat clicks/taps
  // landing before the `disabled` attribute re-renders.
  const inFlightRef = useRef(false);

  async function handleClick() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setState({ status: 'pending' });

    if (!reducedMotion) onPulse?.();

    const t0 = performance.now();
    try {
      await react(PULSE_PAYLOAD);
      const rttMs = Math.round(performance.now() - t0);
      setState({ status: 'success', rttMs });
    } catch {
      setState({ status: 'error' });
    } finally {
      inFlightRef.current = false;
    }
  }

  const pending = state.status === 'pending';

  let resultText = '';
  if (state.status === 'success') {
    resultText = `${t('home:sendPulse.result', { ms: state.rttMs })} · ${t('home:sendPulse.seenBy', { count })}`;
  } else if (state.status === 'error') {
    resultText = t('home:sendPulse.error');
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className="h-11 min-w-44 border-transparent bg-signal text-signal-foreground hover:bg-signal/90"
      >
        <Zap aria-hidden="true" />
        {pending ? t('home:sendPulse.sending') : t('home:sendPulse.button')}
      </Button>

      {/* Persistent live region: the text inside changes rather than the
          element being conditionally mounted, so screen readers reliably
          announce each result. */}
      <p role="status" aria-live="polite" className="min-h-5 font-mono text-sm text-signal">
        {resultText}
      </p>
    </div>
  );
}
