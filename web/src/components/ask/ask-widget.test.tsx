import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';

vi.mock('@/lib/ask', () => ({ streamAsk: vi.fn(async ({ onChunk }) => { onChunk('Yes, '); onChunk('extensively.'); }) }));

import { streamAsk } from '@/lib/ask';
import { AskWidget } from './ask-widget';

describe('AskWidget', () => {
  it('opens, sends, and streams an answer', async () => {
    await renderWithI18n(<AskWidget />);
    fireEvent.click(screen.getByRole('button', { name: /ask about felipe/i }));
    expect(screen.getByText(/ai assistant/i)).toBeInTheDocument(); // disclaimer
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Kubernetes?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(screen.getByText('Yes, extensively.')).toBeInTheDocument());
  });

  it('aborts the in-flight stream when the sheet is closed', async () => {
    let capturedSignal: AbortSignal | undefined;
    let rejectStream: (err: unknown) => void = () => {};
    vi.mocked(streamAsk).mockImplementationOnce(({ signal }) => {
      capturedSignal = signal;
      return new Promise((_resolve, reject) => {
        rejectStream = reject;
        signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    await renderWithI18n(<AskWidget />);
    fireEvent.click(screen.getByRole('button', { name: /ask about felipe/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Kubernetes?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal!.aborted).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(capturedSignal!.aborted).toBe(true));
    // No failure line should be shown for an intentional abort.
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();

    rejectStream(new Error('unused, already handled via abort listener'));
  });

  it('renders pt-BR trigger, disclaimer, suggestions, placeholder, and send label', async () => {
    await renderWithI18n(<AskWidget />, { locale: 'pt-BR' });

    fireEvent.click(screen.getByRole('button', { name: /pergunte sobre o felipe/i }));

    expect(screen.getByText(/assistente de ia/i)).toBeInTheDocument();
    expect(screen.getByText('O Felipe tem experiência com Kubernetes?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/pergunte sobre a experiência do felipe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('shows the pt-BR error line when the stream fails', async () => {
    vi.mocked(streamAsk).mockRejectedValueOnce(new Error('boom'));

    await renderWithI18n(<AskWidget />, { locale: 'pt-BR' });
    fireEvent.click(screen.getByRole('button', { name: /pergunte sobre o felipe/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Kubernetes?' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => expect(screen.getByText(/algo deu errado/i)).toBeInTheDocument());
  });
});
