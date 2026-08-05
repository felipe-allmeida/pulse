import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/app-shell';
import { AskWidget } from '@/components/ask/ask-widget';
import { PulseHubProvider } from '@/realtime/use-pulse-hub';

export const Route = createRootRoute({
  component: () => (
    <PulseHubProvider>
      <AppShell>
        <Outlet />
        <AskWidget />
      </AppShell>
    </PulseHubProvider>
  ),
});
