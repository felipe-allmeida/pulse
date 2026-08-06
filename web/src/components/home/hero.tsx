import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { CvButton } from '@/components/nav/cv-button';
import { HeroMap } from '@/components/home/hero-map';
import { Button, buttonVariants } from '@/components/ui/button';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';
import { useMetrics } from '@/lib/api';
import { useAskWidgetStore } from '@/stores/ask-widget-store';
import { cn } from '@/lib/utils';

// Proper nouns / stack names — intentionally not translated.
const HOME_STACK = [
  '.NET 10',
  'SignalR',
  'RabbitMQ',
  'Redis',
  'PostgreSQL',
  'OpenTelemetry',
  'React 19',
  'Docker',
  'Terraform',
] as const;

export function Hero() {
  const { t } = useTranslation('home');
  const localize = useLocalized();
  const { data } = useMetrics();
  const onlineCount = data?.activeConnections ?? 0;
  const openAskWidget = useAskWidgetStore((s) => s.open);

  return (
    <section className="dark relative isolate flex flex-col justify-center overflow-hidden bg-background px-6 py-20 text-foreground sm:px-10 md:min-h-[85vh] md:py-28">
      <HeroMap className="z-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-signal/30 bg-signal-muted/40 px-3 py-1 font-mono text-xs text-signal">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full rounded-full bg-signal opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
          </span>
          {t('home:live.online', { count: onlineCount })}
        </span>

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {profile.name}
          </h1>
          <p className="text-lg font-medium text-muted-foreground sm:text-xl">{localize(profile.title)}</p>
          <p className="max-w-2xl text-base text-muted-foreground">{localize(profile.tagline)}</p>
        </div>

        <p className="max-w-2xl font-mono text-sm leading-relaxed text-signal/80 sm:text-base">
          {t('home:hero.hook', { count: onlineCount })}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/projects"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'border-transparent bg-signal text-zinc-950 hover:bg-signal/90',
            )}
          >
            {t('home:cta.projects')}
            <ArrowRight />
          </Link>
          <Link to="/about" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            {t('home:cta.about')}
          </Link>
          <CvButton className="h-10 px-6" />
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={openAskWidget}
            className="border border-signal/30 text-signal hover:bg-signal/10 hover:text-signal"
          >
            <Sparkles />
            {t('home:cta.ask')}
          </Button>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-6 font-mono text-xs text-muted-foreground">
          {HOME_STACK.map((tech) => (
            <li key={tech} className="rounded-full border border-signal/20 px-2.5 py-1">
              {tech}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
