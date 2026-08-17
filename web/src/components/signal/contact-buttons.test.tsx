import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { ContactButtons } from './contact-buttons';

const fullContact = {
  calendly: 'https://calendly.com/felipe/30min',
  email: 'contato@pampadevs.com',
  linkedin: 'https://www.linkedin.com/in/felipe-allmeida',
  whatsapp: 'https://wa.me/5551991635191',
};

describe('ContactButtons', () => {
  it('renders 4 links with the correct hrefs when calendly is set', async () => {
    await renderWithI18n(<ContactButtons contact={fullContact} />);

    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('link', { name: /book a call/i })).toHaveAttribute('href', fullContact.calendly);
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', `mailto:${fullContact.email}`);
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute('href', fullContact.linkedin);
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', fullContact.whatsapp);
  });

  it('opens every link in a new tab with rel=noreferrer', async () => {
    await renderWithI18n(<ContactButtons contact={fullContact} />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('hides the Book a call button and renders only 3 links when calendly is blank', async () => {
    await renderWithI18n(<ContactButtons contact={{ ...fullContact, calendly: '' }} />);

    expect(screen.queryByRole('link', { name: /book a call/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('renders pt-BR labels', async () => {
    await renderWithI18n(<ContactButtons contact={fullContact} />, { locale: 'pt-BR' });

    expect(screen.getByRole('link', { name: /agendar/i })).toBeInTheDocument();
  });

  it('defaults to the profile contact config when no override is passed', async () => {
    await renderWithI18n(<ContactButtons />);

    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/5551991635191',
    );
  });
});
