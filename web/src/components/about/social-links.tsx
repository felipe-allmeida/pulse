import { useTranslation } from 'react-i18next';
import { ContactButtons } from '@/components/signal/contact-buttons';

/**
 * "Get in touch" — the About page's contact block. Replaces the old
 * GitHub/LinkedIn social-link row with the shared `ContactButtons` CTA row
 * (Calendly · Email · LinkedIn · WhatsApp).
 */
export function AboutContact() {
  const { t } = useTranslation('contact');
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">{t('contact:heading')}</h2>
      <ContactButtons />
    </div>
  );
}
