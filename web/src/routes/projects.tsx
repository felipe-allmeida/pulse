import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FEATURED_PROJECT_SLUG } from '@/components/projects/featured';
import { ProjectCard } from '@/components/projects/project-card';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { projects } from '@/content/projects';

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
});

/** The signal-language Projects index: eyebrow, one `<h1>`, and a responsive card grid with `pulse` featured wide. */
function ProjectsPage() {
  const { t } = useTranslation('projects');
  return (
    <div className="dark bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 pb-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <SectionEyebrow>{t('projects:pageEyebrow')}</SectionEyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('projects:pageTitle')}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              className={project.slug === FEATURED_PROJECT_SLUG ? 'md:col-span-2' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
