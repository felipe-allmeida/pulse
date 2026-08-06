import { create } from 'zustand';

type AskWidgetState = {
  isOpen: boolean;
  open: () => void;
  setOpen: (isOpen: boolean) => void;
};

/**
 * Shared open-state for the Ask widget (`ask-widget.tsx`). Lets any part of
 * the tree — the Hero's "Ask the AI" CTA, in particular — trigger the
 * widget open without reaching into the DOM (no `getElementById` hack, no
 * prop drilling through `__root.tsx`).
 */
export const useAskWidgetStore = create<AskWidgetState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  setOpen: (isOpen) => set({ isOpen }),
}));
