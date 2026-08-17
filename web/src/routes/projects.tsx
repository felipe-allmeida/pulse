import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/page-shell';
import { FEATURED_PROJECT_SLUG } from '@/components/projects/featured';
import { ProjectCard } from '@/components/projects/project-card';
import { VentureSection } from '@/components/projects/venture-section';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { projects } from '@/content/projects';
import { ventureBySlug } from '@/content/ventures';
import { groupProjects } from '@/lib/project-groups';

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
});

/** The signal-language Projects index: eyebrow, one `<h1>`, and a responsive card grid with `pulse` featured wide. */
function ProjectsPage() {
  const { t } = useTranslation('projects');
  return (
    <PageShell className="gap-8 py-16 pb-24">
      <div className="flex flex-col gap-3">
        <SectionEyebrow>{t('projects:pageEyebrow')}</SectionEyebrow>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t('projects:pageTitle')}
        </h1>
      </div>

      <div className="flex flex-col gap-10">
        {groupProjects(projects).map((group, index) =>
          group.kind === 'venture' ? (
            <VentureSection
              key={group.ventureSlug}
              venture={ventureBySlug(group.ventureSlug)!}
              projects={group.projects}
            />
          ) : (
            <div key={`standalone-${index}`} className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {group.projects.map((project) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  className={project.slug === FEATURED_PROJECT_SLUG ? 'md:col-span-2' : undefined}
                />
              ))}
            </div>
          ),
        )}
      </div>
    </PageShell>
  );
}
