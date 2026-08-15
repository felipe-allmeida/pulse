import { Link } from '@tanstack/react-router';
import { ExternalLink, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FEATURED_PROJECT_SLUG } from '@/components/projects/featured';
import { ProjectCover } from '@/components/projects/project-cover';
import { ProjectScreenshot } from '@/components/projects/project-screenshot';
import { Chip } from '@/components/signal/chip';
import type { Project } from '@/content/projects';
import { useLocalized } from '@/i18n/use-localized';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

/**
 * The signal project card: a content-led layout — title + sans tagline,
 * description, tech chips, role/period line carry the visual weight, not an
 * empty media box. Tagline/description are prose (sans, not aqua — aqua
 * stays an accent, used on the featured whisper and hover states, not as a
 * body-text color); the tech chips and role/period line stay mono, they're
 * data. When `project.screenshot` is set, the real image renders up top;
 * otherwise a thin signal accent rule stands in for it — never a giant void.
 * The whole card is a stretched link to its dedicated `/projects/$slug`
 * page — a project's own links render whatever its visibility —
 * `visibility` describes the source, not the product, so a private project
 * may still point at a public product site — and sit above the overlay so
 * they stay independently clickable rather than nesting an `<a>` inside an
 * `<a>`. `pulse` renders with a tamed featured accent (a
 * border/shadow whisper, not a neon halo).
 */
export function ProjectCard({ project, className }: ProjectCardProps) {
  const { t } = useTranslation('projects');
  const L = useLocalized();
  const featured = project.slug === FEATURED_PROJECT_SLUG;

  return (
    <article
      data-featured={featured}
      className={cn(
        'group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-signal/20 bg-signal-muted/10 p-6 transition-colors hover:border-signal/40',
        featured && 'border-signal/30 shadow-[0_0_20px_-14px_var(--color-signal)]',
        className,
      )}
    >
      {project.screenshot ? (
        <ProjectScreenshot
          src={project.screenshot}
          alt={t('projects:screenshotAlt', { name: project.name })}
          glow={featured}
        />
      ) : (
        <ProjectCover project={project} glow={featured} />
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
        <p className="text-sm font-medium text-foreground/80">{L(project.tagline)}</p>
      </div>

      <p className="text-sm text-muted-foreground">{L(project.description)}</p>

      <div className="flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <Chip key={tech}>{tech}</Chip>
        ))}
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        {L(project.role)}
        {project.period ? ` · ${L(project.period)}` : ''}
      </p>

      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-1">
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
        {project.visibility === 'private' ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden className="size-3.5" />
            {t('projects:privateLabel')}
          </span>
        ) : null}
      </div>

      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        aria-label={t('projects:viewDetails', { name: project.name })}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-strong"
      />
    </article>
  );
}
