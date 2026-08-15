import { Link } from '@tanstack/react-router';
import { ExternalLink, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CaseStudyComparison } from '@/components/projects/case-study-comparison';
import { CaseStudyDecisions } from '@/components/projects/case-study-decisions';
import { CaseStudyFlow } from '@/components/projects/case-study-flow';
import { CaseStudyMetrics } from '@/components/projects/case-study-metrics';
import { CaseStudyScript } from '@/components/projects/case-study-script';
import { CaseStudyTable } from '@/components/projects/case-study-table';
import { FEATURED_PROJECT_SLUG } from '@/components/projects/featured';
import { ProjectContribution } from '@/components/projects/project-contribution';
import { ProjectScreenshot } from '@/components/projects/project-screenshot';
import { Chip } from '@/components/signal/chip';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { SubsectionHeading } from '@/components/signal/subsection-heading';
import { projects } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';

export interface ProjectDetailProps {
  slug: string;
}

/**
 * The dedicated signal page for a single project, looked up by `slug` from
 * `projects`. Unknown slugs render a localized not-found state instead of
 * crashing. External links (GitHub/live) render only for
 * `visibility: 'public'` — the same confidentiality invariant enforced on
 * the card holds here too, in both locales. Exactly one `<h1>`.
 */
export function ProjectDetail({ slug }: ProjectDetailProps) {
  const { t } = useTranslation('projects');
  const L = useLocalized();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center sm:px-10">
          <SectionEyebrow>/projects</SectionEyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('projects:notFoundHeading')}</h1>
          <p className="max-w-md text-muted-foreground">{t('projects:notFoundBody')}</p>
          <Link
            to="/projects"
            className="font-mono text-sm text-signal-strong underline-offset-4 hover:underline"
          >
            ← {t('projects:backToProjects')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <SectionEyebrow>/projects/{project.slug}</SectionEyebrow>
            <Link
              to="/projects"
              className="font-mono text-xs text-muted-foreground transition-colors hover:text-signal-strong"
            >
              ← {t('projects:backToProjects')}
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{project.name}</h1>
            <p className="text-base font-medium text-foreground/80 sm:text-lg">{L(project.tagline)}</p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            {L(project.role)}
            {project.period ? ` · ${L(project.period)}` : ''}
          </p>

          <div className="flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <Chip key={tech}>{tech}</Chip>
            ))}
          </div>

          {project.visibility === 'public' ? (
            <div className="flex flex-wrap gap-3">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-signal/60 hover:text-signal-strong"
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                  {link.label}
                </a>
              ))}
            </div>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground">
              <Lock aria-hidden className="size-3.5" />
              {t('projects:privateLabel')}
            </span>
          )}
        </div>

        <ProjectScreenshot
          src={project.screenshot}
          alt={t('projects:screenshotAlt', { name: project.name })}
          glow={project.slug === FEATURED_PROJECT_SLUG}
        />

        {project.detail?.overview ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:overviewHeading')}</SubsectionHeading>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(project.detail.overview)}</p>
          </section>
        ) : null}

        {project.detail?.contribution ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:contributionHeading')}</SubsectionHeading>
            <ProjectContribution contribution={project.detail.contribution} />
          </section>
        ) : null}

        {project.detail?.problem ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:problemHeading')}</SubsectionHeading>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(project.detail.problem)}</p>
          </section>
        ) : null}

        {project.detail?.metrics && project.detail.metrics.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:metricsHeading')}</SubsectionHeading>
            <CaseStudyMetrics metrics={project.detail.metrics} note={project.detail.metricsNote} />
          </section>
        ) : null}

        {project.detail?.architecture && project.detail.architecture.steps.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>
              {project.detail.architecture.caption
                ? L(project.detail.architecture.caption)
                : t('projects:architectureHeading')}
            </SubsectionHeading>
            <CaseStudyFlow flow={project.detail.architecture} />
          </section>
        ) : null}

        {project.detail?.states?.caption && project.detail.states.steps.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.states.caption)}</SubsectionHeading>
            <CaseStudyFlow flow={project.detail.states} />
          </section>
        ) : null}

        {project.detail?.script && project.detail.script.lines.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.script.caption)}</SubsectionHeading>
            <CaseStudyScript script={project.detail.script} />
          </section>
        ) : null}

        {project.detail?.comparison &&
        Math.max(project.detail.comparison.before.weight, project.detail.comparison.after.weight) > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.comparison.caption)}</SubsectionHeading>
            <CaseStudyComparison comparison={project.detail.comparison} />
          </section>
        ) : null}

        {project.detail?.table && project.detail.table.rows.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{L(project.detail.table.caption)}</SubsectionHeading>
            <CaseStudyTable table={project.detail.table} />
          </section>
        ) : null}

        {project.detail?.highlights && project.detail.highlights.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:highlightsHeading')}</SubsectionHeading>
            <ul className="flex flex-col gap-3 border-l border-signal/25 pl-6">
              {project.detail.highlights.map((highlight) => (
                <li key={L(highlight)} className="relative text-sm text-muted-foreground">
                  <span aria-hidden className="absolute top-1.5 -left-[1.8125rem] size-2 rounded-full bg-signal" />
                  {L(highlight)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {project.detail?.decisions && project.detail.decisions.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:decisionsHeading')}</SubsectionHeading>
            <CaseStudyDecisions decisions={project.detail.decisions} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
