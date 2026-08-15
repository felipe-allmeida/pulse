import type { CaseStudySection } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyDecisionsProps {
  decisions: CaseStudySection[];
}

/**
 * The "why X and not Y" blocks of a case study, sharing the left-rail-and-dot
 * treatment the highlights list uses. Each decision's heading is an `<h3>` so
 * it nests under the section's `<h2>` (`SubsectionHeading`) and the page keeps
 * a single `<h1>`.
 */
export function CaseStudyDecisions({ decisions }: CaseStudyDecisionsProps) {
  const L = useLocalized();
  if (decisions.length === 0) return null;

  return (
    <ul className="flex flex-col gap-6 border-l border-signal/25 pl-6">
      {decisions.map((decision, index) => (
        <li key={index} className="relative flex flex-col gap-1.5">
          <span aria-hidden className="absolute top-2 -left-[1.8125rem] size-2 rounded-full bg-signal" />
          <h3 className="text-sm font-semibold text-foreground">{L(decision.heading)}</h3>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{L(decision.body)}</p>
        </li>
      ))}
    </ul>
  );
}
