import { createFileRoute } from '@tanstack/react-router';
import { WatchedPage } from '@/components/watched/watched-page';

export const Route = createFileRoute('/watched')({
  component: WatchedPage,
});
