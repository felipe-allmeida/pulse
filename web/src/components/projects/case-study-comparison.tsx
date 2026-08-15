import type {
  CaseStudyComparison as CaseStudyComparisonContent,
  CaseStudyComparisonSide,
} from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyComparisonProps {
  comparison: CaseStudyComparisonContent;
}

/**
 * Below this, a bar rounds away to nothing and stops reading as a quantity.
 * A weight of exactly zero is exempt: the floor exists to keep a small number
 * visible, never to draw one that isn't there.
 */
const MIN_BAR_PERCENT = 1.5;

/**
 * A before/after figure: two horizontal bars whose lengths come from the same
 * `weight` values the labels quote, so the picture cannot claim a proportion
 * the numbers do not. Plain elements rather than SVG — two boxes are not
 * geometry, and HTML keeps the labels as selectable text that a screen reader
 * reads in order without a `role="img"` description restating them.
 */
export function CaseStudyComparison({ comparison }: CaseStudyComparisonProps) {
  const L = useLocalized();
  const { before, after, source } = comparison;
  const largest = Math.max(before.weight, after.weight);
  if (largest <= 0) return null;

  const row = (side: CaseStudyComparisonSide, tone: string) => {
    const percent = side.weight <= 0 ? 0 : Math.max((side.weight / largest) * 100, MIN_BAR_PERCENT);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-foreground/80">{L(side.label)}</span>
          <span className="font-mono text-sm font-medium tabular-nums text-signal-strong">
            {L(side.value)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-signal-muted/20">
          <div data-bar className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  return (
    <figure className="m-0 flex max-w-2xl flex-col gap-4">
      {row(before, 'bg-signal/40')}
      {row(after, 'bg-signal')}
      {source ? (
        <figcaption className="text-xs leading-relaxed text-muted-foreground">{L(source)}</figcaption>
      ) : null}
    </figure>
  );
}
