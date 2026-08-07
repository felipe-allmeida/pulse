import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArchitectureDiagram } from '@/components/home/architecture-diagram';
import { SendPulse } from '@/components/home/send-pulse';
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
 *
 * SendPulse sits right next to the diagram — the diagram explains the
 * pipeline, the button proves it: clicking it plays one traversal across
 * these same nodes and reports the genuinely measured round-trip. This
 * component owns `traversalKey` as the one piece of state bridging the two,
 * bumped by `SendPulse`'s `onPulse` callback.
 */
export function EngineeringShowcase() {
  const { t } = useTranslation('home');
  const [traversalKey, setTraversalKey] = useState(0);

  return (
    <section className="dark bg-background px-6 py-16 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Pill>{t('home:showcase.eyebrow')}</Pill>

        <ArchitectureDiagram traversalKey={traversalKey} />

        <SendPulse onPulse={() => setTraversalKey((key) => key + 1)} />
      </div>
    </section>
  );
}
