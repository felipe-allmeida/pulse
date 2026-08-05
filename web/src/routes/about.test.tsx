import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from '@/components/about/about-page';
import { profile } from '@/content/profile';

describe('AboutPage', () => {
  it('renders the profile name, tagline, a skill, and an experience org', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeInTheDocument();
    expect(screen.getByText(profile.tagline)).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('.NET / ASP.NET Core')).toBeInTheDocument();
    expect(screen.getAllByText(/Kota\.io/).length).toBeGreaterThan(0);
  });

  it('renders exactly one h1', () => {
    render(<AboutPage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders social links that open in a new tab safely', () => {
    render(<AboutPage />);

    for (const social of profile.social) {
      const link = screen.getByRole('link', { name: new RegExp(social.label, 'i') });
      expect(link).toHaveAttribute('href', social.href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    }
  });

  it('renders a Download CV control', () => {
    render(<AboutPage />);

    expect(screen.getByRole('link', { name: /download cv/i })).toBeInTheDocument();
  });
});
