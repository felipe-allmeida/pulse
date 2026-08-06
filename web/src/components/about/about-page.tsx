import { useTranslation } from 'react-i18next';
import { AboutHero } from '@/components/about/about-hero';
import { ExperienceTimeline } from '@/components/about/experience-timeline';
import { SkillGroups } from '@/components/about/skill-groups';
import { SocialLinks } from '@/components/about/social-links';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { profile } from '@/content/profile';
import { useLocalized } from '@/i18n/use-localized';

export function AboutPage() {
  const { t } = useTranslation('about');
  const L = useLocalized();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-24">
      <AboutHero />

      <SocialLinks />

      <Card>
        <CardHeader>
          <CardTitle>{t('about:bioHeading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{L(profile.bio)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('about:skillsHeading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillGroups />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('about:experienceHeading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExperienceTimeline />
        </CardContent>
      </Card>
    </div>
  );
}
