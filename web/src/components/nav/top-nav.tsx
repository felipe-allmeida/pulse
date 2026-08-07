import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
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

const NAV_LINKS = [
  { to: '/', key: 'home' },
  { to: '/about', key: 'about' },
  { to: '/projects', key: 'projects' },
  { to: '/live', key: 'live' },
] as const;

const DESKTOP_LINK_CLASS = 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';
const MOBILE_LINK_CLASS = 'text-base font-medium text-muted-foreground transition-colors hover:text-foreground';
const ACTIVE_LINK_PROPS = { className: 'text-signal', 'aria-current': 'page' as const };

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
