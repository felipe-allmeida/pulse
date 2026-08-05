import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/projects')({
  component: () => <h1 className="text-2xl font-semibold">Projects</h1>,
});
