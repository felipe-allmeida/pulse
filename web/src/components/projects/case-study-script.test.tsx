import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseStudyScript } from '@/components/projects/case-study-script';
import type { CaseStudyScript as CaseStudyScriptContent } from '@/content/projects';
import { renderWithI18n } from '@/test/render-with-i18n';

const script: CaseStudyScriptContent = {
  caption: { en: 'A test script', 'pt-BR': 'Um roteiro de teste' },
  lines: ['Setup (Language="en-US")', 'Dial +1 (000) 000-0000', 'Hang'],
  note: { en: 'Checked before the call.', 'pt-BR': 'Conferido antes da ligação.' },
};

describe('CaseStudyScript', () => {
  it('renders every line verbatim, in order', async () => {
    const { container } = await renderWithI18n(<CaseStudyScript script={script} />);

    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code!.textContent).toBe(
      'Setup (Language="en-US")\nDial +1 (000) 000-0000\nHang',
    );
  });

  it('renders the note, localized', async () => {
    await renderWithI18n(<CaseStudyScript script={script} />);
    expect(screen.getByText('Checked before the call.')).toBeInTheDocument();
  });

  it('renders the note in pt-BR', async () => {
    await renderWithI18n(<CaseStudyScript script={script} />, { locale: 'pt-BR' });
    expect(screen.getByText('Conferido antes da ligação.')).toBeInTheDocument();
  });

  it('renders nothing when the script has no lines', async () => {
    const { container } = await renderWithI18n(
      <CaseStudyScript script={{ ...script, lines: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('adds no heading of its own — the page section supplies it', async () => {
    await renderWithI18n(<CaseStudyScript script={script} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('keeps line spans inline so the pre supplies the only line breaks', async () => {
    const { container } = await renderWithI18n(<CaseStudyScript script={script} />);

    const lineSpans = container.querySelectorAll('code > span');
    expect(lineSpans).toHaveLength(3);
    for (const span of lineSpans) {
      expect(span.className, 'a block span would double every line break').not.toMatch(/\bblock\b/);
    }
  });
});
