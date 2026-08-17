import { useTranslation } from 'react-i18next';
import { CvButton } from '@/components/nav/cv-button';
import { StatusPill } from '@/components/signal/status-pill';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

export function AboutHero() {
  const L = useLocalized();
  const { t } = useTranslation('about');

  return (
    <div className="flex flex-col gap-6">
      <StatusPill detail={t('about:heroStatusDetail')} />

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/*
          Empty alt on purpose: the <h1> beside this carries the same name, and
          a screen reader announcing it twice is worse than not announcing the
          photo at all.

          Explicit width/height, and NOT lazy-loaded: this is above the fold on
          /about, so a deferred load would reflow the heading beside it. At a
          240px source for an 80px slot it is ~12 KB, which is cheaper than the
          shift would be.
        */}
        {/* eslint-disable-next-line jsx-a11y/no-img-element -- hosted asset under public/, not a bundled image. */}
        <img
          src={profile.photo.avatar}
          alt=""
          width={80}
          height={80}
          decoding="async"
          className="size-20 shrink-0 rounded-2xl border-2 border-signal/50 object-cover"
        />

        <div className="flex flex-1 flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{profile.name}</h1>
          {/*
            Role + tagline: sans prose, same muted-foreground treatment as
            the home Hero's identical pair (profile.title / profile.tagline)
            — one visual tier, not two more fonts/colors stacked on top of
            the name. The page's one aqua emphasis lives in the StatusPill
            above, so this block stays quiet.
          */}
          <p className="text-lg font-medium text-muted-foreground sm:text-xl">{L(profile.title)}</p>
          <p className="max-w-[65ch] text-base text-muted-foreground">{L(profile.tagline)}</p>
        </div>
      </div>

      <p className="max-w-[65ch] text-base leading-relaxed text-muted-foreground">{L(profile.bio)}</p>

      <div>
        <CvButton className="h-10 px-6" />
      </div>
    </div>
  );
}
