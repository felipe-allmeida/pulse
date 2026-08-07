import { screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { useAskWidgetStore } from '@/stores/ask-widget-store';

vi.mock('@/lib/ask', () => ({
  streamAsk: vi.fn(async ({ onChunk }) => {
    onChunk('Yes, ');
    onChunk('extensively.');
  }),
}));

import { streamAsk } from '@/lib/ask';
import { AskChips } from './ask-chips';
import { AskWidget } from './ask-widget';

function renderChipsWithWidget(locale?: 'en' | 'pt-BR') {
  return renderWithI18n(
    <>
      <AskChips />
      <AskWidget />
    </>,
    locale ? { locale } : undefined,
  );
}

describe('AskChips', () => {
  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false, pendingQuestion: null });
    vi.mocked(streamAsk).mockClear();
  });

  it('renders the same 3 suggested questions as the widget, as real buttons with a 44px+ tap target', async () => {
    await renderChipsWithWidget();

    const kubernetes = screen.getByRole('button', { name: 'Does Felipe have Kubernetes experience?' });
    const stack = screen.getByRole('button', { name: "What's Felipe's strongest tech stack?" });
    const remote = screen.getByRole('button', { name: 'Is Felipe open to remote roles?' });

    for (const chip of [kubernetes, stack, remote]) {
      expect(chip.tagName).toBe('BUTTON');
      expect(chip.className).toMatch(/min-h-11|min-h-\[44px\]/);
    }
  });

  it('opens the Ask widget and submits the chosen question when a chip is clicked', async () => {
    await renderChipsWithWidget();

    fireEvent.click(screen.getByRole('button', { name: 'Does Felipe have Kubernetes experience?' }));

    // Widget is open.
    await waitFor(() => expect(screen.getByText(/ai assistant/i)).toBeInTheDocument());
    expect(useAskWidgetStore.getState().isOpen).toBe(true);

    // The question was submitted as-if typed and sent: it shows as the user bubble
    // and the send path was invoked with it exactly once.
    await waitFor(() =>
      expect(screen.getAllByText('Does Felipe have Kubernetes experience?').length).toBeGreaterThan(0),
    );
    expect(streamAsk).toHaveBeenCalledTimes(1);
    expect(vi.mocked(streamAsk).mock.calls[0][0]).toMatchObject({
      question: 'Does Felipe have Kubernetes experience?',
    });

    // The streamed answer arrives, and the pending question is cleared (no re-submit).
    await waitFor(() => expect(screen.getByText('Yes, extensively.')).toBeInTheDocument());
    expect(useAskWidgetStore.getState().pendingQuestion).toBeNull();
    expect(streamAsk).toHaveBeenCalledTimes(1);
  });

  it('renders pt-BR chip labels and still submits correctly', async () => {
    await renderChipsWithWidget('pt-BR');

    fireEvent.click(screen.getByRole('button', { name: 'O Felipe está aberto a vagas remotas?' }));

    await waitFor(() => expect(screen.getByText(/assistente de ia/i)).toBeInTheDocument());
    expect(streamAsk).toHaveBeenCalledTimes(1);
    expect(vi.mocked(streamAsk).mock.calls[0][0]).toMatchObject({
      question: 'O Felipe está aberto a vagas remotas?',
    });
  });
});
