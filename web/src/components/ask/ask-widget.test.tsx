import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ask', () => ({ streamAsk: vi.fn(async ({ onChunk }) => { onChunk('Yes, '); onChunk('extensively.'); }) }));

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
});
