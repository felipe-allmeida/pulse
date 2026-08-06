import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from '@/components/about/about-page';
import { profile } from '@/content/profile';
import { renderWithI18n } from '@/test/render-with-i18n';

describe('AboutPage', () => {
  it('renders the profile name, tagline, a skill, and an experience org', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
    expect(screen.getByText(profile.tagline.en)).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('.NET / ASP.NET Core')).toBeInTheDocument();
    expect(screen.getAllByText(/Kota\.io/).length).toBeGreaterThan(0);
  });

  it('renders the initials-avatar placeholder as first + last name initials', async () => {
    await renderWithI18n(<AboutPage />);

    // The avatar is aria-hidden, so it's queried by text rather than by role/name.
    expect(screen.getByText('FA')).toBeInTheDocument();
  });

  it('renders exactly one h1', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders social links that open in a new tab safely', async () => {
    await renderWithI18n(<AboutPage />);

    for (const social of profile.social) {
      const link = screen.getByRole('link', { name: new RegExp(social.label, 'i') });
      expect(link).toHaveAttribute('href', social.href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    }
  });

  it('renders a Download CV control', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getByRole('link', { name: /download cv/i })).toBeInTheDocument();
  });

  it('renders pt-BR section headings and localized content', async () => {
    await renderWithI18n(<AboutPage />, { locale: 'pt-BR' });

    expect(screen.getByText('Biografia')).toBeInTheDocument();
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
    expect(screen.getByText('Experiência')).toBeInTheDocument();
    expect(screen.getByText(profile.tagline['pt-BR'])).toBeInTheDocument();
  });
});
