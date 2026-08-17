import type { CaseStudyFlow as CaseStudyFlowContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyFlowProps {
  flow: CaseStudyFlowContent;
}

/**
 * A sequence of steps — a topology (what calls what) or a lifecycle (what
 * happens next) — as stacked rows on the same left rail the decisions and
 * highlights lists use.
 *
 * Deliberately one layout at every width. The earlier version put the steps
 * in a row on `sm+` and stacked them below, which meant two layouts, only one
 * of which anyone looked at — and five boxes across a prose column left each
 * one too narrow to hold its own label. Here the label column simply wraps
 * above the detail on a narrow screen: same elements, same order, no second
 * arrangement to maintain. The caption is rendered by the page section as its
 * heading, not here.
 */
export function CaseStudyFlow({ flow }: CaseStudyFlowProps) {
  const L = useLocalized();
  if (flow.steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {flow.summary ? (
        <p className="text-base leading-relaxed text-muted-foreground">{L(flow.summary)}</p>
      ) : null}
      <ol className="flex flex-col gap-4 border-l border-signal/25 pl-6">
        {flow.steps.map((step, index) => (
          <li key={index} className="relative flex flex-col gap-1 sm:flex-row sm:gap-4">
            <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2 rounded-full bg-signal" />
            <span className="font-mono text-xs font-medium text-signal-strong sm:w-40 sm:shrink-0 sm:pt-0.5">
              {step.label}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">{L(step.detail)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
