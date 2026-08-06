import { useTranslation } from 'react-i18next';
import { ArchitectureDiagram } from '@/components/home/architecture-diagram';
import { EventStream } from '@/components/home/event-stream';
import { StatTiles } from '@/components/home/stat-tiles';

/**
 * The engineering showcase band under the hero: real-metric stat tiles, a
 * live event stream, and the request/event pipeline diagram — the page
 * proving the "live distributed system" claim by what it does, not just
 * what it says.
 */
export function EngineeringShowcase() {
  const { t } = useTranslation('home');

  return (
    <section className="dark bg-background px-6 py-16 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-signal/30 bg-signal-muted/40 px-3 py-1 font-mono text-xs text-signal">
          {t('home:showcase.eyebrow')}
        </span>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <StatTiles />
          </div>
          <div className="lg:col-span-2">
            <EventStream />
          </div>
        </div>

        <ArchitectureDiagram />
      </div>
    </section>
  );
}
