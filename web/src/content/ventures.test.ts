import { expect, it } from 'vitest';
import { ventures, ventureBySlug } from './ventures';
import { expectBothLocales } from '@/test/expect-both-locales';

it('every venture string is localized in every locale', () => {
  expect(ventures.length).toBeGreaterThan(0);
  for (const venture of ventures) {
    expect(venture.slug.trim(), 'venture slug').not.toBe('');
    expect(venture.name.trim(), 'venture name').not.toBe('');
    expectBothLocales(venture.role, `${venture.slug} role`);
    expectBothLocales(venture.period, `${venture.slug} period`);
    expectBothLocales(venture.summary, `${venture.slug} summary`);
    if (venture.engagement) expectBothLocales(venture.engagement, `${venture.slug} engagement`);
    if (venture.team) expectBothLocales(venture.team, `${venture.slug} team`);
  }
});

it('venture slugs are unique and resolvable', () => {
  const slugs = ventures.map((v) => v.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const slug of slugs) expect(ventureBySlug(slug)?.slug).toBe(slug);
  expect(ventureBySlug('nope')).toBeUndefined();
});

it('every venture url is absolute https', () => {
  for (const venture of ventures) {
    if (venture.url === undefined) continue;
    expect(venture.url, `${venture.slug}: ${venture.url}`).toMatch(/^https:\/\//);
  }
});

it('no venture practices section is present but empty', () => {
  for (const venture of ventures) {
    if (!venture.practices) continue;
    expect(venture.practices.length, `${venture.slug} practices`).toBeGreaterThan(0);
    for (const section of venture.practices) {
      expectBothLocales(section.heading, `${venture.slug} practices heading`);
      expectBothLocales(section.body, `${venture.slug} practices body`);
    }
  }
});

it('ULBRA is held as a client engagement, and says whose', () => {
  const ulbra = ventureBySlug('ulbra');
  expect(ulbra, 'the ULBRA venture exists').toBeDefined();
  expect(ulbra!.engagement!.en).toMatch(/pampa devs/i);
  expect(ulbra!.engagement!['pt-BR']).toMatch(/pampa devs/i);
});
