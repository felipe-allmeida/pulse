import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The CV exists in both languages, so the button has to follow the active
 * locale — a pt-BR visitor clicking a pt-BR label should not get the English
 * file. `download` carries the filename the browser saves it under.
 */
const CV_BY_LOCALE = {
  en: { href: '/cv.pdf', filename: 'Felipe_de_Almeida_Resume.pdf' },
  'pt-BR': { href: '/cv-pt.pdf', filename: 'Felipe_de_Almeida_Curriculo.pdf' },
} as const;

export function CvButton({ className }: { className?: string }) {
  const { t, i18n } = useTranslation('nav');
  const cv = CV_BY_LOCALE[i18n.language as keyof typeof CV_BY_LOCALE] ?? CV_BY_LOCALE.en;

  return (
    <a
      href={cv.href}
      download={cv.filename}
      aria-label={t('nav:downloadCv')}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'border-signal/40 font-mono text-signal-strong hover:border-signal/60 hover:bg-signal/10 hover:text-signal-strong',
        className,
      )}
    >
      <Download aria-hidden className="size-3.5" />
      {t('nav:cvShort')}
    </a>
  );
}
