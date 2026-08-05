import { createFileRoute } from '@tanstack/react-router';
import { ProjectCard } from '@/components/projects/project-card';
import { projects } from '@/content/projects';

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-24">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
