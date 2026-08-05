import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePulseHub } from '@/realtime/use-pulse-hub';
import { useEventStore } from '@/stores/event-store';
import type { PulseEvent } from '@/types/pulse';

/** Server allow-list — keep in sync with the hub's accepted emoji. */
export const REACTION_EMOJIS = ['👋', '❤️', '🔥', '👏', '🎉', '🚀', '😮', '💯'] as const;

const FLOAT_DURATION_MS = 1200;

type FloatingReaction = {
  id: number;
  emoji: string;
};

/** Reaction event labels are produced as `Reaction ${emoji}` (see use-pulse-hub.tsx). */
function emojiFromReactionLabel(label: string): string | null {
  const [prefix, emoji] = label.split(' ');
  return prefix === 'Reaction' && emoji ? emoji : null;
}

export function Reactions() {
  const { react } = usePulseHub();
  const events = useEventStore((s) => s.events);
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const lastSeenRef = useRef<PulseEvent | null>(null);
  const nextIdRef = useRef(0);

  useEffect(() => {
    const latest = events[0];
    if (!latest || latest === lastSeenRef.current) return;
    lastSeenRef.current = latest;

    if (latest.kind !== 'reaction') return;
    const emoji = emojiFromReactionLabel(latest.label);
    if (!emoji) return;

    const id = nextIdRef.current++;
    setFloating((current) => [...current, { id, emoji }]);
    const timeout = setTimeout(() => {
      setFloating((current) => current.filter((f) => f.id !== id));
    }, FLOAT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [events]);

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-full flex justify-center">
        {floating.map((f) => (
          <span key={f.id} className="animate-reaction-float absolute text-2xl">
            {f.emoji}
          </span>
        ))}
      </div>
      {REACTION_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="button"
          variant="outline"
          size="icon"
          aria-label={`React with ${emoji}`}
          onClick={() => react(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}
