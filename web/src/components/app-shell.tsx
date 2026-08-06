import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ConnectionStatus } from '@/components/connection-status';
import { LanguageToggle } from '@/components/i18n/language-toggle';
import { TopNav } from '@/components/nav/top-nav';
import { PresenceBadge } from '@/components/presence-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import i18n from '@/i18n';

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const syncHtmlLang = () => {
      document.documentElement.lang = i18n.language;
    };
    syncHtmlLang();
    i18n.on('languageChanged', syncHtmlLang);
    return () => {
      i18n.off('languageChanged', syncHtmlLang);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Pulse
        </Link>
        <TopNav />
        <ConnectionStatus />
        <PresenceBadge />
        <div className="ml-auto flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
