import { useTranslation } from 'react-i18next';
import { ArchitectureDiagram } from '@/components/home/architecture-diagram';
import { Pill } from '@/components/signal/pill';

/**
 * The engineering showcase band under the hero: the request/event pipeline
 * diagram — "how it works" — proving the "live distributed system" claim by
 * explaining the mechanism, not by re-showing numbers. The actual live
 * numbers and event stream live in exactly one place on the home page: the
 * "live proof" block further down (routes/index.tsx), which is also the
 * only surface fed by `useMetrics()`/`useEventStore()` here — showing them
 * twice, once mono/inline and once as dashboard cards a scroll away, read as
 * two different systems reporting the same thing.
 */
export function EngineeringShowcase() {
  const { t } = useTranslation('home');

  return (
    <section className="dark bg-background px-6 py-16 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Pill>{t('home:showcase.eyebrow')}</Pill>

        <ArchitectureDiagram />
      </div>
    </section>
  );
}
