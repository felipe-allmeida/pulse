import { useTranslation } from 'react-i18next';
import { ContactButtons } from '@/components/signal/contact-buttons';
import { SubsectionHeading } from '@/components/signal/subsection-heading';

/**
 * "Get in touch" — the About page's contact block. Replaces the old
 * GitHub/LinkedIn social-link row with the shared `ContactButtons` CTA row
 * (Calendly · Email · LinkedIn · WhatsApp).
 */
export function AboutContact() {
  const { t } = useTranslation('contact');
  return (
    <div className="flex flex-col gap-4">
      <SubsectionHeading>{t('contact:heading')}</SubsectionHeading>
      <ContactButtons />
    </div>
  );
}
