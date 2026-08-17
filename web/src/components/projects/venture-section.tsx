import { useTranslation } from 'react-i18next';
import { CaseStudyDecisions } from '@/components/projects/case-study-decisions';
import { ProjectCard } from '@/components/projects/project-card';
import type { Project } from '@/content/projects';
import type { Venture } from '@/content/ventures';
import { useLocalized } from '@/i18n/use-localized';

export interface VentureSectionProps {
  venture: Venture;
  projects: Project[];
}

/**
 * One venture's projects under a shared header.
 *
 * The header exists because six cards from one client, dropped loose into the
 * grid, read as six unrelated systems and drown the rest of the portfolio. It
 * carries what the cards individually cannot: whose organization this is, on
 * what terms, and how a team of three shipped all of it.
 *
 * `engagement` is rendered next to the name rather than buried in the summary.
 * A reader scanning the page should not have to infer that this is a client of
 * the author's studio rather than an employer.
 */
export function VentureSection({ venture, projects }: VentureSectionProps) {
  const { t } = useTranslation('projects');
  const L = useLocalized();

  return (
    <section aria-label={venture.name} className="flex flex-col gap-6 rounded-2xl border border-signal/15 bg-signal-muted/5 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {venture.url ? (
              <a
                href={venture.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-signal-strong"
              >
                {venture.name}
              </a>
            ) : (
              venture.name
            )}
          </h2>
          {venture.engagement ? (
            <span className="rounded-full border border-signal/30 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              {L(venture.engagement)}
            </span>
          ) : null}
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          {L(venture.role)} · {L(venture.period)}
          {venture.team ? ` · ${L(venture.team)}` : ''}
        </p>

        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{L(venture.summary)}</p>
      </div>

      {venture.practices ? (
        <div className="flex flex-col gap-3">
          {/*
            A label, not a heading. The venture's name is this section's `<h2>`
            and `CaseStudyDecisions` emits an `<h3>` per practice, so a second
            `<h2>` here would put a group label at the same outline level as
            the thing it groups.
          */}
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {t('projects:venturePracticesHeading')}
          </p>
          <CaseStudyDecisions sections={venture.practices} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
