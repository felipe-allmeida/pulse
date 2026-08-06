import { Link } from '@tanstack/react-router';
import { Menu, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CvButton } from '@/components/nav/cv-button';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', key: 'home' },
  { to: '/about', key: 'about' },
  { to: '/projects', key: 'projects' },
] as const;

const DESKTOP_LINK_CLASS = 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';
const MOBILE_LINK_CLASS = 'text-base font-medium text-muted-foreground transition-colors hover:text-foreground';
const ACTIVE_LINK_PROPS = { className: 'text-signal', 'aria-current': 'page' as const };

/**
 * The nav's "Ask the AI" CTA — opens the shared `AskWidget` (mounted once
 * in `__root.tsx`) via `useAskWidgetStore`, matching the Hero's identical
 * trigger. No local open-state: the store is the single source of truth.
 */
function AskAiButton({ className }: { className?: string }) {
  const { t } = useTranslation('nav');
  const openAskWidget = useAskWidgetStore((s) => s.open);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={openAskWidget}
      className={cn(
        'gap-1.5 border border-signal/30 font-mono text-xs text-signal hover:bg-signal/10 hover:text-signal',
        className,
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {t('nav:askAi')}
    </Button>
  );
}

export function TopNav() {
  const { t } = useTranslation(['nav', 'contact']);

  return (
    <nav aria-label={t('nav:mainNav')} className="flex items-center gap-2">
      <div className="hidden items-center gap-6 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeOptions={{ exact: link.to === '/' }}
            activeProps={ACTIVE_LINK_PROPS}
            className={DESKTOP_LINK_CLASS}
          >
            {t(`nav:${link.key}`)}
          </Link>
        ))}
        <Link to="/about" hash="contact" className={DESKTOP_LINK_CLASS}>
          {t('contact:nav')}
        </Link>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <AskAiButton />
        <CvButton />
      </div>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('nav:openMenu')}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="dark bg-background text-foreground">
            <SheetHeader>
              <SheetTitle>{t('nav:menu')}</SheetTitle>
              <SheetDescription className="sr-only">{t('nav:mobileNavDescription')}</SheetDescription>
            </SheetHeader>
            <nav aria-label={t('nav:mobileNav')} className="flex flex-col gap-4 px-4">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.to}>
                  <Link
                    to={link.to}
                    activeOptions={{ exact: link.to === '/' }}
                    activeProps={ACTIVE_LINK_PROPS}
                    className={MOBILE_LINK_CLASS}
                  >
                    {t(`nav:${link.key}`)}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link to="/about" hash="contact" className={MOBILE_LINK_CLASS}>
                  {t('contact:nav')}
                </Link>
              </SheetClose>
              {/* Not wrapped in `SheetClose asChild`: `AskAiButton` is a custom
                  component (not a forwardRef DOM element), so Radix's prop/ref
                  cloning onto it would silently drop the injected close
                  handler. It still opens the Ask widget correctly either way. */}
              <AskAiButton className="w-full justify-center" />
              <SheetClose asChild>
                <CvButton className="w-full justify-center" />
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
