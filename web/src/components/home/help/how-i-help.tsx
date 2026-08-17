import { Calendar, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpCard } from '@/components/home/help/help-card';
import { HELP_CARD_KEYS } from '@/components/home/help/help-diagram';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { Button, buttonVariants } from '@/components/ui/button';
import { profile } from '@/content/profile';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
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
  const openAskWidget = useAskWidgetStore((s) => s.open);

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {HELP_CARD_KEYS.map((variant) => (
            <HelpCard key={variant} variant={variant} />
          ))}
        </div>

        {/*
          `open()` with no argument, unlike AskChips: this button asks the
          visitor to describe their own situation, so the widget opens with
          an empty composer rather than submitting a question for them.
        */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={() => openAskWidget()}
            className="border-transparent bg-signal text-signal-foreground hover:bg-signal/90"
          >
            <MessageCircle aria-hidden="true" />
            {t('home:help.cta.ask')}
          </Button>

          {profile.contact.calendly !== '' && (
            <a
              href={profile.contact.calendly}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
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
