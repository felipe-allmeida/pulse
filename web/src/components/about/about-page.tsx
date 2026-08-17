import { useTranslation } from 'react-i18next';
import { AboutHero } from '@/components/about/about-hero';
import { AboutContact } from '@/components/about/social-links';
import { FaqSection } from '@/components/about/faq-section';
import { ExperienceTimeline } from '@/components/about/experience-timeline';
import { EducationList } from '@/components/about/education-list';
import { SkillGroups } from '@/components/about/skill-groups';
import { SectionEyebrow } from '@/components/signal/section-eyebrow';
import { SubsectionHeading } from '@/components/signal/subsection-heading';

/** The signal-language About page: hero, experience timeline, skills, contact. Exactly one `<h1>` (in `AboutHero`). */
export function AboutPage() {
  const { t } = useTranslation('about');

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-6 py-16 sm:px-10">
        <section className="flex flex-col gap-8">
          <SectionEyebrow>/about</SectionEyebrow>
          <AboutHero />
        </section>

        <section className="flex flex-col gap-6">
          <SubsectionHeading>{t('about:experienceHeading')}</SubsectionHeading>
          <ExperienceTimeline />
        </section>

        <section className="flex flex-col gap-6">
          <SubsectionHeading>{t('about:skillsHeading')}</SubsectionHeading>
          <SkillGroups />
        </section>

        <section className="flex flex-col gap-6">
          <SubsectionHeading>{t('about:educationHeading')}</SubsectionHeading>
          <EducationList />
        </section>

        <FaqSection />

        <section id="contact" className="scroll-mt-24">
          <AboutContact />
        </section>
      </div>
    </div>
  );
}
