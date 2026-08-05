import { Download } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CvButton({ className }: { className?: string }) {
  return (
    <a
      href="/cv.pdf"
      download
      aria-label="Download CV"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)}
    >
      <Download />
      CV
    </a>
  );
}
