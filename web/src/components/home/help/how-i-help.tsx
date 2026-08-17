import { Calendar, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpCard } from '@/components/home/help/help-card';
import { HELP_CARD_KEYS } from '@/components/home/help/help-cards';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { buttonVariants } from '@/components/ui/button';
import { profile } from '@/content/profile';
import { cn } from '@/lib/utils';

/**
 * The home page's offer, sitting where "send a pulse" used to. That button
 * proved the pipeline was live, which is the right pitch for a hiring
 * engineer and the wrong one for the founder this site now sells to — a
 * founder does not evaluate a round-trip time. Four problems they recognise
 * from their own week, in their own words, with the engineering folded into
 * each card's disclosure for whoever they forward the link to.
 */
export function HowIHelp() {
  const { t } = useTranslation('home');
  const [featuredKey, ...compactKeys] = HELP_CARD_KEYS;

  return (
    <section className="bg-background px-6 py-14 text-foreground sm:px-10 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SectionEyebrow>{t('home:help.eyebrow')}</SectionEyebrow>
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            {t('home:help.heading')}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{t('home:help.lede')}</p>
        </div>

        {/*
          Asymmetric on purpose. Four identically weighted cards gave the
          reader no entry point, so the first — repetitive manual work, the
          problem a founder recognises fastest — runs the full width and the
          other three share a row beneath it. Promoting a different offer is a
          reorder of HELP_CARD_KEYS, not a rewrite of this file.
        */}
        <div className="flex flex-col gap-4">
          <HelpCard variant={featuredKey} featured />

          <div data-help-row className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {compactKeys.map((variant) => (
              <HelpCard key={variant} variant={variant} />
            ))}
          </div>
        </div>

        {/*
          A real channel, not the Ask widget. That widget is a retrieval
          assistant scoped to Felipe's profile — a founder who accepted this
          invitation and described their actual problem was told the assistant
          had no information about Felipe, at the highest point of buying
          intent on the page. The message is handed over mid-sentence so the
          founder finishes it instead of facing an empty composer.
        */}
        <div className="flex flex-wrap items-center gap-3">
          {profile.contact.whatsapp !== '' && (
            <a
              href={`${profile.contact.whatsapp}?text=${encodeURIComponent(t('home:help.cta.whatsappMessage'))}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t('home:help.cta.askAria')}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'min-h-11 border-transparent bg-signal text-signal-foreground hover:bg-signal/90',
              )}
            >
              <MessageCircle aria-hidden="true" />
              {t('home:help.cta.ask')}
            </a>
          )}

          {profile.contact.calendly !== '' && (
            <a
              href={profile.contact.calendly}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-11')}
            >
              <Calendar aria-hidden="true" />
              {t('home:help.cta.book')}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
