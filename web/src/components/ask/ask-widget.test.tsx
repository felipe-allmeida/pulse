import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ask', () => ({ streamAsk: vi.fn(async ({ onChunk }) => { onChunk('Yes, '); onChunk('extensively.'); }) }));

import { streamAsk } from '@/lib/ask';
import { AskWidget } from './ask-widget';

describe('AskWidget', () => {
  it('opens, sends, and streams an answer', async () => {
    render(<AskWidget />);
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

    render(<AskWidget />);
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
});
