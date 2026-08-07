import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { LanguageToggle } from '@/components/i18n/language-toggle';
import { LiveIndicator } from '@/components/live-indicator';
import { TopNav } from '@/components/nav/top-nav';
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
      {/*
        The header now follows the site-wide theme toggle like every other
        surface: `bg-background/85` + `text-foreground` resolve per theme via
        their CSS variables, so it no longer pins the dark treatment
        unconditionally.
      */}
      <header className="sticky top-0 z-40 border-b border-signal/15 bg-background/85 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3 sm:px-10">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-mono text-base font-semibold tracking-tight text-foreground"
          >
            <span
              aria-hidden
              className="size-2 rounded-full bg-signal shadow-[0_0_6px_var(--color-signal)]"
            />
            pulse
          </Link>
          <TopNav />
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex">
              <LiveIndicator />
            </div>
            <div className="flex items-center gap-1 border-l border-border/60 pl-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
