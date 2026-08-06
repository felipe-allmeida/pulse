import { useTranslation } from 'react-i18next';
import { AboutHero } from '@/components/about/about-hero';
import { AboutContact } from '@/components/about/social-links';
import { ExperienceTimeline } from '@/components/about/experience-timeline';
import { SkillGroups } from '@/components/about/skill-groups';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';

/** The signal-language About page: hero, experience timeline, skills, contact. Exactly one `<h1>` (in `AboutHero`). */
export function AboutPage() {
  const { t } = useTranslation('about');

  return (
    <div className="dark bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-16 sm:px-10">
        <section className="flex flex-col gap-8">
          <SectionEyebrow>/about</SectionEyebrow>
          <AboutHero />
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {t('about:experienceHeading')}
          </h2>
          <ExperienceTimeline />
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {t('about:skillsHeading')}
          </h2>
          <SkillGroups />
        </section>

        <section>
          <AboutContact />
        </section>
      </div>
    </div>
  );
}
