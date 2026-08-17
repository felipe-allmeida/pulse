import { describe, expect, it } from 'vitest';
import { resources } from '@/i18n';
import { HELP_CARD_KEYS as CARD_KEYS } from '@/components/home/help/help-cards';

type HelpBlock = {
  eyebrow: string;
  heading: string;
  lede: string;
  examplesLabel: string;
  techLabel: string;
  transformLabels: { before: string; after: string };
  cards: Record<
    (typeof CARD_KEYS)[number],
    {
      headline: string;
      body: string;
      examples: string[];
      tech: string;
      transform: { before: string; after: string };
    }
  >;
  cta: { ask: string; book: string; askAria: string; whatsappMessage: string };
};

const locales = {
  en: (resources.en.home as unknown as { help: HelpBlock }).help,
  'pt-BR': (resources['pt-BR'].home as unknown as { help: HelpBlock }).help,
};

describe('home:help copy', () => {
  for (const [locale, help] of Object.entries(locales)) {
    describe(locale, () => {
      it('has every section-level string, non-empty', () => {
        for (const key of ['eyebrow', 'heading', 'lede', 'examplesLabel', 'techLabel'] as const) {
          expect(help[key], `${locale}.help.${key}`).toBeTypeOf('string');
          expect(help[key].length, `${locale}.help.${key}`).toBeGreaterThan(0);
        }
        expect(help.cta.ask.length).toBeGreaterThan(0);
        expect(help.cta.book.length).toBeGreaterThan(0);
        for (const side of ['before', 'after'] as const) {
          expect(help.transformLabels[side].length, `${locale}.help.transformLabels.${side}`).toBeGreaterThan(0);
        }
        expect(help.cta.askAria.length, `${locale}.help.cta.askAria`).toBeGreaterThan(0);
        expect(help.cta.whatsappMessage.length, `${locale}.help.cta.whatsappMessage`).toBeGreaterThan(0);

        // The message is handed to the founder mid-sentence so they finish it
        // rather than facing an empty composer.
        expect(
          help.cta.whatsappMessage.endsWith(' '),
          `${locale}.help.cta.whatsappMessage is an unfinished sentence`,
        ).toBe(true);

        // WCAG 2.5.3: the accessible name must start with the visible label.
        expect(help.cta.askAria.startsWith(help.cta.ask), `${locale}.help.cta.askAria contains the visible label`).toBe(
          true,
        );
      });

      it('has all four cards, in order, each complete', () => {
        expect(Object.keys(help.cards)).toEqual([...CARD_KEYS]);

        for (const key of CARD_KEYS) {
          const card = help.cards[key];
          expect(card.headline.length, `${locale}.${key}.headline`).toBeGreaterThan(0);
          expect(card.body.length, `${locale}.${key}.body`).toBeGreaterThan(0);
          expect(card.tech.length, `${locale}.${key}.tech`).toBeGreaterThan(0);
          expect(card.examples, `${locale}.${key}.examples`).toHaveLength(3);
          for (const example of card.examples) expect(example.length).toBeGreaterThan(0);
          for (const side of ['before', 'after'] as const) {
            expect(card.transform[side].length, `${locale}.${key}.transform.${side}`).toBeGreaterThan(0);
          }
        }
      });
    });
  }

  // The whole point of the section: a founder reads the surface, and the
  // engineering vocabulary is quarantined in the collapsed `tech` line.
  it('keeps technical vocabulary out of every headline and body, in both locales', () => {
    const JARGON = /\b(API|webhook|MCP|SignalR|RabbitMQ|Postgres|outbox|deploy|pull request|Kubernetes|Docker|\.NET)\b/i;

    for (const [locale, help] of Object.entries(locales)) {
      for (const key of CARD_KEYS) {
        const card = help.cards[key];
        expect(card.headline, `${locale}.${key}.headline is jargon-free`).not.toMatch(JARGON);
        expect(card.body, `${locale}.${key}.body is jargon-free`).not.toMatch(JARGON);
        // The transform pair sits on the card surface, so it is held to the
        // same founder-readable standard as the headline and body.
        expect(card.transform.before, `${locale}.${key}.transform.before is jargon-free`).not.toMatch(JARGON);
        expect(card.transform.after, `${locale}.${key}.transform.after is jargon-free`).not.toMatch(JARGON);
      }
      expect(help.lede, `${locale}.lede is jargon-free`).not.toMatch(JARGON);
    }
  });
});
