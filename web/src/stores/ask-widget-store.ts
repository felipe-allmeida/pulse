import { create } from 'zustand';

type AskWidgetState = {
  isOpen: boolean;
  /**
   * A question to submit on the widget's behalf as soon as it opens (e.g.
   * from a home-page suggestion chip) — as if the visitor had typed it and
   * hit send. `null` when the widget should just open with an empty
   * composer, which is the only behavior `open()` had before chips existed.
   */
  pendingQuestion: string | null;
  open: (question?: string) => void;
  setOpen: (isOpen: boolean) => void;
  clearPendingQuestion: () => void;
};

/**
 * Shared open-state for the Ask widget (`ask-widget.tsx`). Lets any part of
 * the tree — the Hero's "Ask the AI" CTA, the home's suggestion chips —
 * trigger the widget open (optionally pre-filled with a question) without
 * reaching into the DOM (no `getElementById` hack, no prop drilling through
 * `__root.tsx`).
 */
export const useAskWidgetStore = create<AskWidgetState>()((set) => ({
  isOpen: false,
  pendingQuestion: null,
  open: (question) => set({ isOpen: true, pendingQuestion: question ?? null }),
  setOpen: (isOpen) => set({ isOpen }),
  clearPendingQuestion: () => set({ pendingQuestion: null }),
}));
