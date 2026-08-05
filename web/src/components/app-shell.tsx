import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ConnectionStatus } from '@/components/connection-status';
import { TopNav } from '@/components/nav/top-nav';
import { PresenceBadge } from '@/components/presence-badge';
import { ThemeToggle } from '@/components/theme-toggle';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Pulse
        </Link>
        <TopNav />
        <ConnectionStatus />
        <PresenceBadge />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
