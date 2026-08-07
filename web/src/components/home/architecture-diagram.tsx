import { useEffect, useRef, useState } from 'react';
import { Database, Globe, Server, Timer, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Node = {
  key: string;
  icon: typeof Globe;
  label: string;
  detail?: string;
};

const NODE_COUNT = 5;
const EDGE_COUNT = NODE_COUNT - 1;
const TRAVERSAL_EDGE_DURATION_MS = 550;
const TRAVERSAL_EDGE_STAGGER_MS = 350;
const TRAVERSAL_TOTAL_MS = (EDGE_COUNT - 1) * TRAVERSAL_EDGE_STAGGER_MS + TRAVERSAL_EDGE_DURATION_MS;

type ArchitectureDiagramProps = {
  /**
   * Bump this (e.g. an incrementing counter) to play one traversal of the
   * signal across every edge, left to right — the visible "a pulse just
   * went through the pipeline" moment. Ignored under
   * `prefers-reduced-motion` and on first mount. Leave undefined for the
   * diagram's own ambient animation only.
   */
  traversalKey?: number;
};

/**
 * The horizontal request/event pipeline behind this page: browser → API
 * (SignalR + Redis for presence/pubsub) → RabbitMQ → background worker →
 * Postgres. A signal pulse travels the connecting edges to sell the "this
 * page is a live distributed system" claim at a glance; frozen to a static
 * dot under `prefers-reduced-motion`. Passing `traversalKey` additionally
 * plays one brighter, one-shot traversal on top of the ambient animation —
 * used by "send a pulse" to show a real event crossing the pipeline.
 */
export function ArchitectureDiagram({ traversalKey }: ArchitectureDiagramProps) {
  const { t } = useTranslation('home');
  const reducedMotion = useReducedMotion();
  const [traversing, setTraversing] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (traversalKey === undefined || reducedMotion) return;

    setTraversing(true);
    const timeout = setTimeout(() => setTraversing(false), TRAVERSAL_TOTAL_MS);
    return () => clearTimeout(timeout);
    // Only the key change should replay the traversal — reducedMotion is
    // read at trigger time, not tracked as its own retrigger source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traversalKey]);

  const nodes: Node[] = [
    { key: 'web', icon: Globe, label: t('home:arch.web') },
    { key: 'api', icon: Server, label: t('home:arch.api'), detail: t('home:arch.apiDetail') },
    { key: 'queue', icon: Workflow, label: t('home:arch.queue') },
    { key: 'worker', icon: Timer, label: t('home:arch.worker') },
    { key: 'db', icon: Database, label: t('home:arch.db') },
  ];

  return (
    <div className="rounded-lg border border-signal/20 bg-signal-muted/10 p-4">
      <div className="overflow-x-auto">
        <div
          data-motion={reducedMotion ? 'static' : 'animated'}
          data-traversal={traversing ? 'playing' : 'idle'}
          className="relative flex min-w-max items-center gap-0 py-6 font-mono"
        >
          {nodes.map((node, index) => (
            <div key={node.key} className="flex items-center">
              <div className="flex w-24 flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full border border-signal/40 bg-background text-signal-strong">
                  <node.icon className="size-5" aria-hidden="true" />
                </div>
                <div className="text-xs font-medium text-foreground">{node.label}</div>
                {node.detail && <div className="text-[10px] text-muted-foreground">{node.detail}</div>}
              </div>

              {index < nodes.length - 1 && (
                <div className="relative mx-1 h-px w-10 shrink-0 bg-signal/25 sm:w-16">
                  {!reducedMotion && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-0 size-1.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-signal shadow-[0_0_6px_1px_var(--color-signal)]"
                      style={{ animation: `signal-edge 1.4s ease-in-out infinite`, animationDelay: `${index * 0.25}s` }}
                    />
                  )}
                  {reducedMotion && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/60"
                    />
                  )}
                  {traversing && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-signal shadow-[0_0_10px_2px_var(--color-signal)]"
                      style={{
                        animation: `signal-edge ${TRAVERSAL_EDGE_DURATION_MS}ms ease-in-out 1`,
                        animationDelay: `${index * TRAVERSAL_EDGE_STAGGER_MS}ms`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* The mechanism explanation is a full sentence meant to be read — sans,
          not mono. Node labels/details above stay mono: they're short data
          labels, not prose. */}
      <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
        {t('home:arch.caption')}
      </p>
    </div>
  );
}
