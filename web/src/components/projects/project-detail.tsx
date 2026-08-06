import { Link } from '@tanstack/react-router';
import { ExternalLink, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FEATURED_PROJECT_SLUG } from '@/components/projects/featured';
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
      <div className="dark bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center sm:px-10">
          <SectionEyebrow>/projects</SectionEyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('projects:notFoundHeading')}</h1>
          <p className="max-w-md text-muted-foreground">{t('projects:notFoundBody')}</p>
          <Link
            to="/projects"
            className="font-mono text-sm text-signal underline-offset-4 hover:underline"
          >
            ← {t('projects:backToProjects')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dark bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <SectionEyebrow>/projects/{project.slug}</SectionEyebrow>
            <Link
              to="/projects"
              className="font-mono text-xs text-muted-foreground transition-colors hover:text-signal"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-signal/60 hover:text-signal"
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

        <ProjectScreenshot glow={project.slug === FEATURED_PROJECT_SLUG} className="h-64" />

        {project.detail?.overview ? (
          <section className="flex flex-col gap-3">
            <SubsectionHeading>{t('projects:overviewHeading')}</SubsectionHeading>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{L(project.detail.overview)}</p>
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
      </div>
    </div>
  );
}
