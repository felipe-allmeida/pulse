import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from '@/components/about/about-page';
import { profile } from '@/content/profile';
import { renderWithI18n } from '@/test/render-with-i18n';

describe('AboutPage', () => {
  it('renders exactly one h1, and it is the profile name', async () => {
    await renderWithI18n(<AboutPage />);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(profile.name);
  });

  it('renders the status pill availability text and positioning detail', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getByText(/available now/i)).toBeInTheDocument();
    expect(screen.getByText(/open to staff \/ principal/i)).toBeInTheDocument();
  });

  it('renders the initials-avatar placeholder as first + last name initials', async () => {
    await renderWithI18n(<AboutPage />);

    // The avatar is aria-hidden, so it's queried by text rather than by role/name.
    expect(screen.getByText('FA')).toBeInTheDocument();
  });

  it('renders a localized experience org and a skill chip', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getAllByText(/Kota\.io/).length).toBeGreaterThan(0);
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
  });

  it('renders a Download CV control', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getByRole('link', { name: /download cv/i })).toBeInTheDocument();
  });

  it('renders the 4 contact CTAs with correct hrefs when calendly is configured', async () => {
    const originalCalendly = profile.contact.calendly;
    profile.contact.calendly = 'https://calendly.com/felipe/30min';

    try {
      await renderWithI18n(<AboutPage />);

      expect(screen.getAllByRole('link', { name: /book a call/i })).toHaveLength(1);
      expect(screen.getByRole('link', { name: /book a call/i })).toHaveAttribute(
        'href',
        'https://calendly.com/felipe/30min',
      );
      expect(screen.getByRole('link', { name: /^email$/i })).toHaveAttribute(
        'href',
        `mailto:${profile.contact.email}`,
      );
      expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute('href', profile.contact.linkedin);
      expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', profile.contact.whatsapp);
    } finally {
      profile.contact.calendly = originalCalendly;
    }
  });

  it('opens the contact CTAs in a new tab safely', async () => {
    await renderWithI18n(<AboutPage />);

    for (const name of [/^email$/i, /linkedin/i, /whatsapp/i]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('renders pt-BR section headings and a pt-BR string', async () => {
    await renderWithI18n(<AboutPage />, { locale: 'pt-BR' });

    expect(screen.getByText('Experiência')).toBeInTheDocument();
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
    expect(screen.getByText('Atual')).toBeInTheDocument();
  });
});
