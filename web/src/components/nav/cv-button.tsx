import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CvButton({ className }: { className?: string }) {
  const { t } = useTranslation('nav');

  return (
    <a
      href="/cv.pdf"
      download
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
