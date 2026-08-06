import { Calendar, ExternalLink, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from '@/components/ui/button';
import type { ContactConfig } from '@/content/profile';
import { profile } from '@/content/profile';
import { cn } from '@/lib/utils';

export interface ContactButtonsProps {
  /** Defaults to `profile.contact`; override for tests or previews. */
  contact?: ContactConfig;
  className?: string;
}

/**
 * The contact CTA row — Calendly (primary) + Email/LinkedIn/WhatsApp. Every
 * link opens in a new tab with `rel="noreferrer"`. The Calendly button is
 * omitted entirely when its URL is blank (e.g. before Felipe fills in the
 * real link) rather than rendering a dead/disabled control.
 */
export function ContactButtons({ contact = profile.contact, className }: ContactButtonsProps) {
  const { t } = useTranslation('contact');

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {contact.calendly !== '' && (
        <a
          href={contact.calendly}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'border-transparent bg-signal text-signal-foreground hover:bg-signal/90',
          )}
        >
          <Calendar aria-hidden />
          {t('contact:bookCall')}
        </a>
      )}
      <a
        href={`mailto:${contact.email}`}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
      >
        <Mail aria-hidden />
        {t('contact:email')}
      </a>
      <a
        href={contact.linkedin}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
      >
        <ExternalLink aria-hidden />
        {t('contact:linkedin')}
      </a>
      <a
        href={contact.whatsapp}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
      >
        <MessageCircle aria-hidden />
        {t('contact:whatsapp')}
      </a>
    </div>
  );
}
