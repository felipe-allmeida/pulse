import { describe, expect, it } from 'vitest';
import { resources } from '@/i18n';

const CARD_KEYS = ['repetitive', 'spreadsheet', 'ai', 'idea'] as const;

type HelpBlock = {
  eyebrow: string;
  heading: string;
  lede: string;
  examplesLabel: string;
  techLabel: string;
  cards: Record<
    (typeof CARD_KEYS)[number],
    {
      headline: string;
      body: string;
      examples: string[];
      tech: string;
      diagram: { from: string; via: string; to: string };
    }
  >;
  cta: { ask: string; book: string };
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
          for (const node of ['from', 'via', 'to'] as const) {
            expect(card.diagram[node].length, `${locale}.${key}.diagram.${node}`).toBeGreaterThan(0);
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
      }
      expect(help.lede, `${locale}.lede is jargon-free`).not.toMatch(JARGON);
    }
  });
});
