import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BellRing,
  Bot,
  CheckCircle2,
  FileText,
  Hand,
  Lightbulb,
  MessageSquare,
  Package,
  Table,
  Users,
  Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export type HelpCardKey = 'repetitive' | 'spreadsheet' | 'ai' | 'idea';

/** Ordered as rendered on the page. */
export const HELP_CARD_KEYS: readonly HelpCardKey[] = ['repetitive', 'spreadsheet', 'ai', 'idea'] as const;

const EDGE_DURATION_MS = 550;
const EDGE_STAGGER_MS = 350;
const TRAVERSAL_TOTAL_MS = EDGE_STAGGER_MS + EDGE_DURATION_MS;

/**
 * The icon triple per card: what the work looks like by hand, what takes it
 * over, what comes out. Deliberately literal — these are read at 16px next
 * to a three-word label, not decoded.
 */
const ICONS: Record<HelpCardKey, [typeof Hand, typeof Hand, typeof Hand]> = {
  repetitive: [Hand, Workflow, CheckCircle2],
  spreadsheet: [Table, BarChart3, BellRing],
  ai: [FileText, Bot, MessageSquare],
  idea: [Lightbulb, Package, Users],
};

/**
 * A small "by hand → on its own" diagram, one per help card. Three nodes and
 * two edges in the site's own visual grammar (mono labels, signal accent, a
 * dot travelling the edge) so the section reads as part of this site rather
 * than as a marketing block pasted onto it.
 *
 * The traversal plays once, when the diagram scrolls into view — the card is
 * not interactive, so there is no click to hang it off. Under
 * `prefers-reduced-motion` it never plays and the edges carry a static dot,
 * the same fallback the architecture diagram uses.
 */
export function HelpDiagram({ variant }: { variant: HelpCardKey }) {
  const { t } = useTranslation('home');
  const reducedMotion = useReducedMotion();
  const [traversing, setTraversing] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion || playedRef.current) return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || playedRef.current) return;
      playedRef.current = true;
      setTraversing(true);
      observer.disconnect();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!traversing) return;
    const timeout = setTimeout(() => setTraversing(false), TRAVERSAL_TOTAL_MS);
    return () => clearTimeout(timeout);
  }, [traversing]);

  const icons = ICONS[variant];
  const nodes = (['from', 'via', 'to'] as const).map((node, index) => ({
    key: node,
    Icon: icons[index],
    label: t(`home:help.cards.${variant}.diagram.${node}`),
  }));

  return (
    <div
      ref={rootRef}
      data-motion={reducedMotion ? 'static' : 'animated'}
      data-traversal={traversing ? 'playing' : 'idle'}
      className="flex items-center gap-0 font-mono"
    >
      {nodes.map((node, index) => (
        <div key={node.key} className="flex items-center">
          <div className="flex w-16 flex-col items-center gap-1.5 text-center">
            <div className="flex size-8 items-center justify-center rounded-full border border-signal/40 bg-background text-signal-strong">
              <node.Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="text-[10px] leading-tight text-muted-foreground">{node.label}</div>
          </div>

          {index < nodes.length - 1 && (
            <div className="relative mt-[-18px] h-px w-6 shrink-0 bg-signal/25 sm:w-8">
              {reducedMotion ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/60"
                />
              ) : (
                traversing && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_8px_2px_var(--color-signal)]"
                    style={{
                      animation: `signal-edge ${EDGE_DURATION_MS}ms ease-in-out 1`,
                      animationDelay: `${index * EDGE_STAGGER_MS}ms`,
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
