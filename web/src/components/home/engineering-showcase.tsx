import { useTranslation } from 'react-i18next';
import { ArchitectureDiagram } from '@/components/home/architecture-diagram';
import { Pill } from '@/components/signal/pill';

/**
 * The engineering showcase band under the hero: the request/event pipeline
 * diagram — "how it works" — proving the "live distributed system" claim by
 * explaining the mechanism, not by re-showing numbers. The actual live
 * numbers and event stream live in exactly one place on the home page: the
 * "live proof" block further down (routes/index.tsx).
 *
 * This band used to host "send a pulse", whose click played one traversal
 * across these nodes and reported the measured round-trip. That button was
 * the best possible pitch for a hiring engineer and the wrong one for the
 * founder this site now sells to; it was replaced by the "How can I help
 * you?" section above. The diagram keeps its ambient animation —
 * `ArchitectureDiagram` treats `traversalKey` as optional and simply skips
 * the one-shot traversal when nothing passes it.
 */
export function EngineeringShowcase() {
  const { t } = useTranslation('home');

  return (
    <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Pill>{t('home:showcase.eyebrow')}</Pill>
        <ArchitectureDiagram />
      </div>
    </section>
  );
}
