import { screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '@/test/render-with-i18n';
import { useAskWidgetStore } from '@/stores/ask-widget-store';

vi.mock('@/lib/ask', () => ({
  streamAsk: vi.fn(async ({ onChunk }: { onChunk: (t: string) => void }) => {
    onChunk('Yes, ');
    onChunk('extensively.');
  }),
}));

/*
 * `AskWidget` (web/src/components/ask/ask-widget.tsx) fetches its panel body
 * (`./ask-panel`) lazily via `React.lazy`, only once the widget is first
 * opened (Task 7, fix round 1). In practice, in this test environment, the
 * real dynamic import resolves inside the same `act()` flush that
 * `fireEvent.click` triggers — too fast to ever observe the gap a slow
 * connection would actually produce with a plain synchronous assertion.
 *
 * This mock holds the *real* module (via `vi.importActual`, not a stand-in)
 * behind a gate this test releases on its own schedule, so "a chip sets
 * pendingQuestion on the shared store before the panel chunk has arrived"
 * can be asserted on deterministically, against the real component's real
 * effect. A stand-in mock would risk the opposite of what this test is for:
 * it could keep passing even if the real `pendingQuestion` hand-off broke.
 */
const { holdPanelModule, releasePanelModule } = vi.hoisted(() => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { holdPanelModule: gate, releasePanelModule: release };
});

vi.mock('./ask-panel', async () => {
  await holdPanelModule;
  return vi.importActual('./ask-panel');
});

import { streamAsk } from '@/lib/ask';
import { AskChips } from './ask-chips';
import { AskWidget } from './ask-widget';

describe('AskWidget lazy panel — pendingQuestion race', () => {
  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false, pendingQuestion: null });
    vi.mocked(streamAsk).mockClear();
  });

  it('opens via a chip before the panel chunk has resolved, then submits the pending question once it has', async () => {
    await renderWithI18n(
      <>
        <AskChips />
        <AskWidget />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Does Felipe have Kubernetes experience?' }));

    // The chip already set isOpen + pendingQuestion on the shared store —
    // synchronously, from the eager shell — even though the panel's chunk is
    // deliberately being held back by the mock above. This is the state a
    // slow connection would produce for real; asserting it here is what
    // keeps the rest of this test from being vacuous — without it, a broken
    // hand-off could still pass by the time the `waitFor`s below first poll.
    expect(useAskWidgetStore.getState().isOpen).toBe(true);
    expect(useAskWidgetStore.getState().pendingQuestion).toBe('Does Felipe have Kubernetes experience?');
    expect(screen.queryByText(/ai assistant/i)).not.toBeInTheDocument();
    expect(streamAsk).not.toHaveBeenCalled();

    // The chunk "arrives".
    releasePanelModule();

    // The panel mounts, reads the store's already-set state on its first
    // render, and submits the question that was pending before the panel
    // existed.
    await waitFor(() => expect(screen.getByText(/ai assistant/i)).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getAllByText('Does Felipe have Kubernetes experience?').length).toBeGreaterThan(0),
    );
    expect(streamAsk).toHaveBeenCalledTimes(1);
    expect(vi.mocked(streamAsk).mock.calls[0][0]).toMatchObject({
      question: 'Does Felipe have Kubernetes experience?',
    });
    await waitFor(() => expect(useAskWidgetStore.getState().pendingQuestion).toBeNull());
  });
});
