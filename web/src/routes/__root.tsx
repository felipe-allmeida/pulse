import { Suspense, lazy } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/app-shell';
import { useRouteHead } from '@/lib/aio/use-route-head';
import { PulseHubProvider } from '@/realtime/use-pulse-hub';

/*
  The panel is a Sheet that starts closed, but it sat in the root layout —
  so every page loaded its store, plus the projects, profile and FAQ content
  it answers from, before anyone asked anything. Lazy here rather than inside
  the component because the import graph is what costs, not the render.
*/
const AskWidget = lazy(() =>
  import('@/components/ask/ask-widget').then((m) => ({ default: m.AskWidget })),
);

function RootLayout() {
  // Retitles the document on client-side navigation; the per-route head each
  // document is served with comes from the AIO build step.
  useRouteHead();

  return (
    <PulseHubProvider>
      <AppShell>
        <Outlet />
        <Suspense fallback={null}>
          <AskWidget />
        </Suspense>
      </AppShell>
    </PulseHubProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
