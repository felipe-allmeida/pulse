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
        {/*
          The trigger has to be eager: present at first paint, present in
          prerendered HTML. `AskWidget` (web/src/components/ask/ask-widget.tsx)
          is the Sheet + trigger shell only — it lazily loads the panel body
          itself, on first open, so the split lives inside the component and
          not at this call site. See that file for the reasoning.
        */}
        <AskWidget />
      </AppShell>
    </PulseHubProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
