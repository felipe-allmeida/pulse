import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { faq } from '@/content/faq';
import { renderWithI18n } from '@/test/render-with-i18n';
import { FaqSection } from './faq-section';

describe('FaqSection', () => {
  it('shows every question and its answer, unhidden', async () => {
    await renderWithI18n(<FaqSection />);

    for (const entry of faq) {
      // Visible, not behind a disclosure widget: the whole point is that an
      // answer engine can lift these straight off the page.
      expect(screen.getByText(entry.question.en)).toBeVisible();
      expect(screen.getByText(entry.answer.en)).toBeVisible();
    }
  });

  it('renders the answers in Portuguese under the pt-BR locale', async () => {
    await renderWithI18n(<FaqSection />, { locale: 'pt-BR' });

    expect(screen.getByText(faq[0].question['pt-BR'])).toBeInTheDocument();
    expect(screen.getByText(faq[0].answer['pt-BR'])).toBeInTheDocument();
    expect(screen.getByText(/perguntas frequentes/i)).toBeInTheDocument();
  });

  it('gives each entry a stable anchor to deep-link to', async () => {
    const { container } = await renderWithI18n(<FaqSection />);

    for (const entry of faq) {
      expect(container.querySelector(`#${entry.id}`)).not.toBeNull();
    }
  });

  it('keeps the section out of the page heading outline', async () => {
    await renderWithI18n(<FaqSection />);

    // About owns h1 + one h2 per subsection; seven question headings would
    // flatten that outline, so questions are a definition list instead.
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });
});
