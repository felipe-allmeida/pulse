import { useTranslation } from 'react-i18next';
import { faq } from '@/content/faq';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { useLocalized } from '@/i18n/use-localized';

/**
 * The About page's FAQ.
 *
 * Plain, always-visible question/answer pairs — no accordion. The point of
 * this section is to be quotable: an answer engine lifting "Is Felipe open to
 * new opportunities?" straight out of the page is the whole reason it exists,
 * and the same text is emitted as `FAQPage` JSON-LD from the same source.
 * Content hidden behind a disclosure widget is weaker on both counts, and the
 * answers are short enough that hiding them buys nothing.
 */
export function FaqSection() {
  const L = useLocalized();
  const { t } = useTranslation('about');

  return (
    <section className="flex flex-col gap-6">
      <SubsectionHeading>{t('about:faqHeading')}</SubsectionHeading>

      <dl className="flex flex-col gap-8">
        {faq.map((entry) => (
          <div key={entry.id} id={entry.id} className="flex scroll-mt-24 flex-col gap-2">
            {/*
              A <dt>/<dd> pair rather than heading + paragraph: the questions
              are a list of terms being defined, not sections of the page, and
              About already owns its heading outline (h1 + the SubsectionHeading
              h2s). Slotting seven h3s in between would flatten that.
            */}
            <dt className="text-base font-semibold text-foreground">{L(entry.question)}</dt>
            <dd className="text-base leading-relaxed text-muted-foreground">{L(entry.answer)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
