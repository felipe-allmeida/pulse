import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/app-shell';
import { AskWidget } from '@/components/ask/ask-widget';
import { useRouteHead } from '@/lib/aio/use-route-head';
import { PulseHubProvider } from '@/realtime/use-pulse-hub';

function RootLayout() {
  // Retitles the document on client-side navigation; the per-route head each
  // document is served with comes from the AIO build step.
  useRouteHead();

  return (
    <PulseHubProvider>
      <AppShell>
        <Outlet />
        <AskWidget />
      </AppShell>
    </PulseHubProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
