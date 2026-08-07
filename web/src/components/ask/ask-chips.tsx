import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/signal/chip';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { useAskWidgetStore } from '@/stores/ask-widget-store';

/**
 * Three ready-made recruiter questions, rendered as `Chip`-styled buttons.
 * Clicking one opens the Ask widget (mounted once in `__root.tsx`) with
 * that question already submitted — turning idle scrolling into the
 * conversation that actually sells Felipe. Reuses the exact same 3
 * questions the widget itself offers as in-sheet suggestions
 * (`ask:suggestions.*`), so there's only one place that decides what the
 * "good" recruiter questions are.
 */
export function AskChips() {
  const { t } = useTranslation('ask');
  const open = useAskWidgetStore((s) => s.open);

  const questions = [
    t('ask:suggestions.kubernetes'),
    t('ask:suggestions.stack'),
    t('ask:suggestions.remote'),
  ];

  return (
    <div className="flex flex-col gap-3">
      <SectionEyebrow>{t('ask:chips.heading')}</SectionEyebrow>
      <div className="flex flex-wrap gap-3">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => open(question)}
            className="inline-flex min-h-11 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Chip>{question}</Chip>
          </button>
        ))}
      </div>
    </div>
  );
}
