import { expect, it } from 'vitest';
import { profile } from './profile';
import { projects } from './projects';
import { LOCALES } from './types';
import type { LocalizedString } from './types';

it('profile has bio, skills and experience', () => {
  expect(profile.name).toMatch(/felipe/i);
  expect(profile.skills.length).toBeGreaterThan(0);
  expect(profile.experience.length).toBeGreaterThan(0);
});

it('pulse is public with a repo link; ulbra projects are private with no repo link', () => {
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  expect(bySlug.pulse.visibility).toBe('public');
  expect(bySlug.pulse.links.some((l) => /github/i.test(l.href))).toBe(true);
  for (const slug of ['ulbra-atende', 'ulbra-one']) {
    expect(bySlug[slug].visibility).toBe('private');
    expect(bySlug[slug].links.some((l) => /github\.com|repo/i.test(l.href))).toBe(false);
  }
});

function expectBothLocales(value: LocalizedString, label: string) {
  for (const locale of LOCALES) {
    expect(value[locale], `${label} missing ${locale}`).toBeTruthy();
    expect(value[locale].trim(), `${label} empty in ${locale}`).not.toBe('');
  }
}

it('ulbra-atende has a full case study, localized in every locale', () => {
  const project = projects.find((p) => p.slug === 'ulbra-atende');
  expect(project).toBeDefined();
  const detail = project!.detail;
  expect(detail).toBeDefined();

  expectBothLocales(detail!.problem!, 'problem');
  expectBothLocales(detail!.metricsNote!, 'metricsNote');

  expect(detail!.metrics).toHaveLength(4);
  for (const metric of detail!.metrics!) {
    expectBothLocales(metric.value, 'metric.value');
    expectBothLocales(metric.label, 'metric.label');
    if (metric.note) expectBothLocales(metric.note, 'metric.note');
  }

  expectBothLocales(detail!.architecture!.summary!, 'architecture.summary');
  expect(detail!.architecture!.steps.length).toBeGreaterThanOrEqual(3);
  for (const step of detail!.architecture!.steps) {
    expect(step.label.trim()).not.toBe('');
    expectBothLocales(step.detail, 'architecture.step.detail');
  }

  expect(detail!.decisions!.length).toBeGreaterThanOrEqual(3);
  for (const decision of detail!.decisions!) {
    expectBothLocales(decision.heading, 'decision.heading');
    expectBothLocales(decision.body, 'decision.body');
  }
});

it('no case-study section is present but empty on any project', () => {
  for (const project of projects) {
    const detail = project.detail;
    if (!detail) continue;
    if (detail.metrics) expect(detail.metrics.length, `${project.slug} metrics`).toBeGreaterThan(0);
    if (detail.decisions) expect(detail.decisions.length, `${project.slug} decisions`).toBeGreaterThan(0);
    if (detail.architecture) {
      expect(detail.architecture.steps.length, `${project.slug} architecture steps`).toBeGreaterThan(0);
    }
    if (detail.metricsNote) {
      expect(detail.metrics?.length ?? 0, `${project.slug} metricsNote without metrics`).toBeGreaterThan(0);
    }
    if (detail.states) {
      expect(detail.states.steps.length, `${project.slug} states steps`).toBeGreaterThan(0);
    }
    if (detail.contribution?.areas) {
      expect(detail.contribution.areas.length, `${project.slug} contribution areas`).toBeGreaterThan(0);
    }
  }
});

it('kota-embed has a case study, localized in every locale', () => {
  const project = projects.find((p) => p.slug === 'kota-embed');
  expect(project).toBeDefined();
  expect(project!.visibility).toBe('private');
  expect(project!.links).toHaveLength(1);
  expect(project!.links.some((l) => /github\.com|repo/i.test(l.href))).toBe(false);

  const detail = project!.detail;
  expectBothLocales(detail!.problem!, 'problem');

  expect(detail!.metrics).toHaveLength(3);
  for (const metric of detail!.metrics!) {
    expectBothLocales(metric.value, 'metric.value');
    expectBothLocales(metric.label, 'metric.label');
    if (metric.note) expectBothLocales(metric.note, 'metric.note');
  }

  expectBothLocales(detail!.architecture!.summary!, 'architecture.summary');
  expect(detail!.architecture!.steps).toHaveLength(5);
  for (const step of detail!.architecture!.steps) {
    expect(step.label.trim()).not.toBe('');
    expectBothLocales(step.detail, 'architecture.step.detail');
  }

  expect(detail!.decisions).toHaveLength(4);
  for (const decision of detail!.decisions!) {
    expectBothLocales(decision.heading, 'decision.heading');
    expectBothLocales(decision.body, 'decision.body');
  }
});

it('kota-embed sits between pulse and the ulbra projects', () => {
  const slugs = projects.map((p) => p.slug);
  expect(slugs.indexOf('kota-embed')).toBe(1);
  expect(slugs.indexOf('kota-embed')).toBeLessThan(slugs.indexOf('ulbra-atende'));
});

it('refers to insurers by count', () => {
  // Deliberately NOT a list of the partner names to grep for: this repository
  // is public, so a guard spelling them out would publish exactly what it
  // exists to keep out. The rule is enforced by review and by the Global
  // Constraints; what is testable here is the shape the copy uses instead.
  const kota = projects.find((p) => p.slug === 'kota-embed');
  const serialized = JSON.stringify(kota);
  expect(serialized).toContain('insurer');
  expect(serialized).toMatch(/nine insurers|nove seguradoras/);
});

it('dell-automated-caller has a case study with all three figures, localized', () => {
  const project = projects.find((p) => p.slug === 'dell-automated-caller');
  expect(project).toBeDefined();
  expect(project!.visibility).toBe('private');
  expect(project!.links).toHaveLength(0);

  const detail = project!.detail!;
  expectBothLocales(detail.problem!, 'problem');
  expect(detail.metrics).toHaveLength(3);

  const script = detail.script!;
  expectBothLocales(script.caption, 'script.caption');
  expect(script.lines.length).toBeGreaterThan(0);
  for (const line of script.lines) expect(line.trim()).not.toBe('');

  const comparison = detail.comparison!;
  expectBothLocales(comparison.caption, 'comparison.caption');
  for (const side of [comparison.before, comparison.after]) {
    expectBothLocales(side.label, 'comparison.side.label');
    expectBothLocales(side.value, 'comparison.side.value');
    expect(side.weight).toBeGreaterThan(0);
  }
  expectBothLocales(comparison.source!, 'comparison.source');

  const table = detail.table!;
  expectBothLocales(table.caption, 'table.caption');
  expect(table.columns.length).toBeGreaterThan(0);
  for (const column of table.columns) expectBothLocales(column, 'table.column');
  for (const row of table.rows) {
    expect(row, 'every row has one cell per column').toHaveLength(table.columns.length);
  }
  expectBothLocales(table.note!, 'table.note');
});

it('dell-automated-caller is last — it is the oldest work', () => {
  expect(projects[projects.length - 1].slug).toBe('dell-automated-caller');
});

it('publishes no hostname, URL or credential in any project narrative', () => {
  // Deliberately pattern-based rather than a list of the specific internal
  // hosts to keep out: this repository is public, so a guard naming them would
  // publish exactly what it exists to protect — the same trap a name-list guard
  // fell into on an earlier project. `links` is excluded because a public repo
  // link is the one URL that belongs in content.
  for (const project of projects) {
    if (!project.detail) continue;
    const narrative = JSON.stringify(project.detail);
    expect(narrative, `${project.slug} detail contains a URL`).not.toMatch(/https?:\/\//);
    expect(narrative, `${project.slug} detail contains a hostname`).not.toMatch(
      /\b[a-z0-9-]+\.(com|io|net|dev|internal)\b/i,
    );
    expect(narrative, `${project.slug} detail contains a token-like string`).not.toMatch(
      /\b[a-f0-9]{32,}\b/i,
    );
  }
});

it('every project except ulbra-one states what the author did', () => {
  for (const project of projects) {
    const contribution = project.detail?.contribution;
    if (project.slug === 'ulbra-one') {
      expect(contribution, 'ulbra-one is out of scope for now').toBeUndefined();
      continue;
    }
    expect(contribution, `${project.slug} has no contribution`).toBeDefined();
    expectBothLocales(contribution!.summary, `${project.slug} contribution.summary`);
    for (const area of contribution!.areas ?? []) {
      expectBothLocales(area, `${project.slug} contribution.area`);
    }
    if (contribution!.boundary) {
      expectBothLocales(contribution!.boundary, `${project.slug} contribution.boundary`);
    }
  }
});

it('kota-embed names the front end as someone else’s work', () => {
  const boundary = projects.find((p) => p.slug === 'kota-embed')!.detail!.contribution!.boundary!;
  expect(boundary.en, 'the boundary must name what was not the author’s').toMatch(/front end/i);
  expect(boundary.en).toMatch(/others|someone else/i);
  expect(boundary['pt-BR']).toMatch(/front-end/i);
  expect(boundary['pt-BR']).toMatch(/outros|outra pessoa/i);
});

it('the state-machine figures are localized and non-empty', () => {
  for (const slug of ['kota-embed', 'ulbra-atende']) {
    const states = projects.find((p) => p.slug === slug)!.detail!.states!;
    expectBothLocales(states.caption!, `${slug} states.caption`);
    expectBothLocales(states.summary!, `${slug} states.summary`);
    expect(states.steps.length).toBeGreaterThanOrEqual(4);
    for (const step of states.steps) {
      expect(step.label.trim()).not.toBe('');
      expectBothLocales(step.detail, `${slug} states.step.detail`);
    }
  }
});

it('every project link is absolute and https', () => {
  for (const project of projects) {
    for (const link of project.links) {
      expect(link.href, `${project.slug}: ${link.href}`).toMatch(/^https:\/\//);
      expect(link.label.trim(), `${project.slug} has an unlabelled link`).not.toBe('');
    }
  }
});

it('no private project links to a repository', () => {
  // `visibility` describes the source, not the product: a private project may
  // point at its public product site, but never at the code.
  for (const project of projects.filter((p) => p.visibility === 'private')) {
    for (const link of project.links) {
      expect(link.href, `${project.slug} links to a repository`).not.toMatch(
        /github\.com|gitlab\.|bitbucket\.|codeberg\.|sr\.ht|dev\.azure\.com|\/_git\/|\bgit\.[a-z0-9-]+\.[a-z]{2,}|\/repo/i,
      );
    }
  }
});

it('pulse points at both its source and the running site', () => {
  const pulse = projects.find((p) => p.slug === 'pulse')!;
  expect(pulse.links.some((l) => /github\.com/.test(l.href))).toBe(true);
  expect(pulse.links.some((l) => l.href === 'https://pulse.felipealmeida.tech')).toBe(true);
});
