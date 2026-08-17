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

    // Scoped to the pill's own span: the FAQ below also says he is available
    // now, in prose, so an unscoped text query matches twice.
    expect(screen.getByText(/available now/i, { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/open to staff \/ principal/i, { selector: 'span' })).toBeInTheDocument();
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

  it('renders the full CV timeline — every experience entry, with real periods', async () => {
    await renderWithI18n(<AboutPage />);

    for (const entry of profile.experience) {
      expect(screen.getAllByText(new RegExp(entry.org.replace('.', '\\.'))).length).toBeGreaterThan(0);
    }
    // Dietbox appears twice — the senior-engineer years and the Head of
    // Technology years are separate rows, not one merged block.
    expect(profile.experience.filter((e) => e.org === 'Dietbox')).toHaveLength(2);
    expect(screen.getByText('Oct 2025 – Jul 2026')).toBeInTheDocument();
  });

  it('links each employer that has a site, and leaves the rest as plain text', async () => {
    await renderWithI18n(<AboutPage />);

    const linked = profile.experience.filter((e) => e.url);
    expect(linked.length, 'at least one employer has a verified site').toBeGreaterThan(0);

    for (const entry of linked) {
      const link = screen.getAllByRole('link', { name: entry.org })[0];
      expect(link).toHaveAttribute('href', entry.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }

    for (const entry of profile.experience.filter((e) => !e.url)) {
      expect(screen.queryByRole('link', { name: entry.org })).toBeNull();
    }
  });

  it('renders education and the spoken-language line', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getByRole('heading', { level: 2, name: /education/i })).toBeInTheDocument();
    expect(screen.getByText(/MBA, Business Management/)).toBeInTheDocument();
    expect(screen.getAllByText('Universidade do Vale do Rio dos Sinos')).toHaveLength(2);
    expect(screen.getByText(profile.languages.en)).toBeInTheDocument();
  });

  it('renders a Download CV control', async () => {
    await renderWithI18n(<AboutPage />);

    expect(screen.getByRole('link', { name: /download cv/i })).toBeInTheDocument();
  });

  it('renders all 4 contact CTAs with the real configured hrefs', async () => {
    // No longer stubs `calendly`: the booking link is configured for real, so
    // the assertion that matters is that the shipped value renders. The
    // blank-calendly branch is covered in `contact-buttons.test.tsx`.
    expect(profile.contact.calendly, 'the booking link is configured').toMatch(/^https:\/\//);

    await renderWithI18n(<AboutPage />);

    expect(screen.getAllByRole('link', { name: /book a call/i })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /book a call/i })).toHaveAttribute('href', profile.contact.calendly);
    expect(screen.getByRole('link', { name: /^email$/i })).toHaveAttribute('href', `mailto:${profile.contact.email}`);
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute('href', profile.contact.linkedin);
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', profile.contact.whatsapp);
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
    expect(screen.getByText('Formação')).toBeInTheDocument();
    expect(screen.getByText('Atual')).toBeInTheDocument();
    expect(screen.getByText('Out 2025 – Jul 2026')).toBeInTheDocument();
    expect(screen.getByText(profile.languages['pt-BR'])).toBeInTheDocument();
  });
});
