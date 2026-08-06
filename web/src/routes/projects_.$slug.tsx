import { createFileRoute } from '@tanstack/react-router';
import { ProjectDetail } from '@/components/projects/project-detail';

export const Route = createFileRoute('/projects_/$slug')({
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  const { slug } = Route.useParams();
  return <ProjectDetail slug={slug} />;
}
