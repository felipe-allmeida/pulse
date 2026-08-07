import { beforeEach, describe, expect, it } from 'vitest';
import { useAskWidgetStore } from './ask-widget-store';

describe('useAskWidgetStore', () => {
  beforeEach(() => {
    useAskWidgetStore.setState({ isOpen: false, pendingQuestion: null });
  });

  it('open() with no argument just opens, leaving pendingQuestion unset (hero CTA / floating trigger path)', () => {
    useAskWidgetStore.getState().open();

    expect(useAskWidgetStore.getState().isOpen).toBe(true);
    expect(useAskWidgetStore.getState().pendingQuestion).toBeNull();
  });

  it('open(question) opens AND records the pending question (chip path)', () => {
    useAskWidgetStore.getState().open('Does Felipe have Kubernetes experience?');

    expect(useAskWidgetStore.getState().isOpen).toBe(true);
    expect(useAskWidgetStore.getState().pendingQuestion).toBe('Does Felipe have Kubernetes experience?');
  });

  it('clearPendingQuestion() resets pendingQuestion without closing the widget', () => {
    useAskWidgetStore.getState().open('a question');
    useAskWidgetStore.getState().clearPendingQuestion();

    expect(useAskWidgetStore.getState().pendingQuestion).toBeNull();
    expect(useAskWidgetStore.getState().isOpen).toBe(true);
  });
});
