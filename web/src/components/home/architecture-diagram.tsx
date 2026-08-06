import { Database, Globe, Server, Timer, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Node = {
  key: string;
  icon: typeof Globe;
  label: string;
  detail?: string;
};

/**
 * The horizontal request/event pipeline behind this page: browser → API
 * (SignalR + Redis for presence/pubsub) → RabbitMQ → background worker →
 * Postgres. A signal pulse travels the connecting edges to sell the "this
 * page is a live distributed system" claim at a glance; frozen to a static
 * dot under `prefers-reduced-motion`.
 */
export function ArchitectureDiagram() {
  const { t } = useTranslation('home');
  const reducedMotion = useReducedMotion();

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
          className="relative flex min-w-max items-center gap-0 py-6 font-mono"
        >
          {nodes.map((node, index) => (
            <div key={node.key} className="flex items-center">
              <div className="flex w-24 flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full border border-signal/40 bg-background text-signal">
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 max-w-3xl font-mono text-xs leading-relaxed text-muted-foreground">
        {t('home:arch.caption')}
      </p>
    </div>
  );
}
