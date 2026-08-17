import type { ProjectContribution as ProjectContributionContent } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface ProjectContributionProps {
  contribution: ProjectContributionContent;
}

/**
 * What the author did on a project, as its own section rather than a line in
 * the header — on a portfolio this is the part a reader came for, and a mono
 * caption under the tagline is the easiest thing on the page to skip.
 *
 * `boundary` renders set apart and muted: it qualifies the claim above it
 * rather than adding to it. Deliberately not italicised — italics reads as an
 * aside, and this is the one line in the section that must not be skimmed past.
 */
export function ProjectContribution({ contribution }: ProjectContributionProps) {
  const L = useLocalized();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base leading-relaxed text-foreground/80">{L(contribution.summary)}</p>
      {contribution.areas && contribution.areas.length > 0 ? (
        <ul className="flex flex-col gap-2 border-l border-signal/25 pl-6">
          {contribution.areas.map((area, index) => (
            <li key={index} className="relative text-sm text-muted-foreground">
              <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2 rounded-full bg-signal" />
              {L(area)}
            </li>
          ))}
        </ul>
      ) : null}
      {contribution.boundary ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {L(contribution.boundary)}
        </p>
      ) : null}
    </div>
  );
}
