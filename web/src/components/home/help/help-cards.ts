/**
 * The card vocabulary the section and the card component share. A module with
 * no JSX so importing the key list never drags a component into the graph —
 * these used to live in `help-diagram.tsx`, which meant every consumer of the
 * key list imported twelve icons to read four strings.
 */

/** Ordered as rendered on the page. The first key is the featured card. */
export const HELP_CARD_KEYS = ['repetitive', 'spreadsheet', 'ai', 'idea'] as const;

export type HelpCardKey = (typeof HELP_CARD_KEYS)[number];
