import type { CaseStudySection } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface CaseStudyDecisionsProps {
  sections: CaseStudySection[];
}

/**
 * A run of titled prose blocks on a left rail, each a claim and the reasoning
 * behind it. The page uses it twice: for a project's engineering decisions, and
 * for what changed under the author's direction. Each block's heading is an
 * `<h3>` so it nests under the section's `<h2>` (`SubsectionHeading`) and the
 * page keeps a single `<h1>`.
 */
export function CaseStudyDecisions({ sections }: CaseStudyDecisionsProps) {
  const L = useLocalized();
  if (sections.length === 0) return null;

  return (
    <ul className="flex flex-col gap-6 border-l border-signal/25 pl-6">
      {sections.map((section, index) => (
        <li key={index} className="relative flex flex-col gap-1.5">
          <span aria-hidden className="absolute top-2 -left-[1.8125rem] size-2 rounded-full bg-signal" />
          <h3 className="text-sm font-semibold text-foreground">{L(section.heading)}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{L(section.body)}</p>
        </li>
      ))}
    </ul>
  );
}
