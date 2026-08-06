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
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)}
    >
      <Download />
      {t('nav:cvShort')}
    </a>
  );
}
