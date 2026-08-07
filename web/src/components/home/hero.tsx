import { ArrowRight, Sparkles } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { CvButton } from '@/components/nav/cv-button';
import { HeroMap } from '@/components/home/hero-map';
import { Chip } from '@/components/signal/chip';
import { Pill } from '@/components/signal/pill';
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
    <section className="relative isolate flex flex-col justify-center overflow-hidden bg-background px-6 py-20 text-foreground sm:px-10 md:min-h-[85vh] md:py-28">
      <HeroMap className="z-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Pill dot>{t('home:live.online', { count: onlineCount })}</Pill>

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {profile.name}
          </h1>
          <p className="text-lg font-medium text-muted-foreground sm:text-xl">{localize(profile.title)}</p>
          <p className="max-w-2xl text-base text-muted-foreground">{localize(profile.tagline)}</p>
        </div>

        {/*
          The main sales sentence — prose meant to be read, not data. Sans,
          a readable ~65ch measure, normal leading. The live count is the
          single aqua emphasis inside it; everything else is plain
          muted-foreground so the accent doesn't compete with itself.
        */}
        <p className="max-w-[65ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          <Trans
            t={t}
            i18nKey="home:hero.hook"
            values={{ count: onlineCount }}
            components={{ strong: <span className="font-semibold text-signal-strong" /> }}
          />
        </p>

        <div className="flex flex-col gap-4">
          {/*
            The two prominent actions: full-width and stacked on mobile so
            they never wrap raggedly (each row is a deliberate choice, not
            an overflow), sized naturally side by side from sm upward.
          */}
          <div data-testid="hero-cta-primary" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/projects"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-11 w-full justify-center border-transparent bg-signal text-signal-foreground hover:bg-signal/90 sm:w-auto',
              )}
            >
              {t('home:cta.projects')}
              <ArrowRight />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => openAskWidget()}
              className="h-11 w-full justify-center border border-signal/30 text-signal-strong hover:bg-signal/10 hover:text-signal-strong sm:w-auto"
            >
              <Sparkles />
              {t('home:cta.ask')}
            </Button>
          </div>

          {/* Demoted secondary actions: quiet text link + outline CV button,
              still a full 44px tap target apiece. */}
          <div data-testid="hero-cta-secondary" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('home:cta.about')}
            </Link>
            <CvButton className="h-11" />
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-2 border-t border-border/60 pt-6">
          {HOME_STACK.map((tech) => (
            <li key={tech}>
              <Chip>{tech}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
