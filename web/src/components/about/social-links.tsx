// lucide-react's brand icon set (Github, Linkedin, etc.) was removed upstream; a
// generic external-link glyph is used for every entry instead.
import { ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { profile } from '@/content/profile';
import { cn } from '@/lib/utils';

export function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {profile.social.map((social) => (
        <a
          key={social.href}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <ExternalLink />
          {social.label}
        </a>
      ))}
    </div>
  );
}
