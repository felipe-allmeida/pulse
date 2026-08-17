import { expect, it } from 'vitest';
import { profile } from './profile';
import { projects } from './projects';
import { ventures } from './ventures';
import { LOCALES } from './types';
import type { LocalizedString } from './types';

it('profile has bio, skills and experience', () => {
  expect(profile.name).toMatch(/felipe/i);
  expect(profile.skills.length).toBeGreaterThan(0);
  expect(profile.experience.length).toBeGreaterThan(0);
});

it('every experience, education and skill string is localized in every locale', () => {
  expectBothLocales(profile.bio, 'bio');
  expectBothLocales(profile.languages, 'languages');

  for (const group of profile.skills) {
    expectBothLocales(group.group, 'skills.group');
    expect(group.items.length, `${group.group.en} has no items`).toBeGreaterThan(0);
    expect(new Set(group.items).size, `${group.group.en} repeats an item`).toBe(group.items.length);
  }

  for (const entry of profile.experience) {
    expectBothLocales(entry.role, `${entry.org} role`);
    expectBothLocales(entry.period, `${entry.org} period`);
    expectBothLocales(entry.summary, `${entry.org} summary`);
    expect(entry.org.trim(), 'experience org').not.toBe('');
  }

  for (const entry of profile.education) {
    expectBothLocales(entry.credential, `${entry.org} credential`);
    expectBothLocales(entry.period, `${entry.org} period`);
    expect(entry.org.trim(), 'education org').not.toBe('');
  }
});

it('every employer link is absolute https, and side ventures are labelled as such', () => {
  for (const entry of profile.experience) {
    if (entry.url === undefined) continue;
    expect(entry.url, `${entry.org}: ${entry.url}`).toMatch(/^https:\/\//);
  }

  // ROLÊ ran alongside the day job. The label is what keeps the timeline from
  // reading as nine consecutive employers, so it is asserted rather than left
  // to survive the next copy edit by luck.
  const role = profile.experience.find((e) => e.org.startsWith('ROLÊ'));
  expect(role, 'the ROLÊ side venture is on the timeline').toBeDefined();
  expect(role!.role.en).toMatch(/side venture/i);
  expect(role!.role['pt-BR']).toMatch(/paralelo/i);
});

it('the experience timeline is keyed uniquely — Dietbox appears twice, under two roles', () => {
  // `ExperienceTimeline` keys rows on `org` + English role, so two rows sharing
  // both would silently collapse into one in React's reconciliation.
  const keys = profile.experience.map((e) => `${e.org}-${e.role.en}`);
  expect(new Set(keys).size).toBe(keys.length);
  expect(profile.experience.filter((e) => e.org === 'Dietbox')).toHaveLength(2);
});

/**
 * Two roles are open-ended at once and both are true: ULBRA is a client of
 * Pampa Devs, so the studio engagement and the Head of Technology mandate run
 * simultaneously. What is still worth asserting is that every *closed* role
 * carries a real date range rather than a word like "Recent".
 */
it('open-ended periods end in Current; every closed role carries real dates', () => {
  const isOpenEnded = (period: string) => /(^|– )Current$/.test(period);

  const open = profile.experience.filter((e) => isOpenEnded(e.period.en));
  expect(open.length, 'at least one role is current').toBeGreaterThan(0);
  expect(profile.experience[0], 'a current role leads the timeline').toBe(open[0]);

  for (const entry of profile.experience.filter((e) => !isOpenEnded(e.period.en))) {
    expect(entry.period.en, `${entry.org} has no dated period`).toMatch(
      /^[A-Z][a-z]{2} \d{4} – [A-Z][a-z]{2} \d{4}$/,
    );
  }
});

it('ULBRA is on the timeline, named as an engagement rather than a ninth employer', () => {
  const ulbra = profile.experience.find((e) => e.org === 'ULBRA');
  expect(ulbra, 'the ULBRA mandate is on the timeline').toBeDefined();
  expect(ulbra!.role.en, 'the role must name whose engagement this is').toMatch(/pampa devs/i);
  expect(ulbra!.role['pt-BR']).toMatch(/pampa devs/i);
  expect(ulbra!.url).toBe('https://www.ulbra.br');
});

it('the bio names the current mandate', () => {
  expect(profile.bio.en).toMatch(/ulbra/i);
  expect(profile.bio['pt-BR']).toMatch(/ulbra/i);
});

it('pulse is public with a repo link; ulbra projects are private with no repo link', () => {
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  expect(bySlug.pulse.visibility).toBe('public');
  expect(bySlug.pulse.links.some((l) => /github/i.test(l.href))).toBe(true);
});

it('every project venture resolves to a real venture', () => {
  const slugs = new Set(ventures.map((v) => v.slug));
  for (const project of projects) {
    if (project.venture === undefined) continue;
    expect(slugs.has(project.venture), `${project.slug} points at unknown venture ${project.venture}`).toBe(true);
  }
});

it('projects sharing a venture are contiguous in the array', () => {
  // The index groups by walking the array in order, so a split run would
  // silently render two headers for one venture.
  const seen = new Set<string>();
  let previous: string | undefined;
  for (const project of projects) {
    if (project.venture !== previous) {
      if (project.venture !== undefined) {
        expect(seen.has(project.venture), `${project.venture} is split into two runs`).toBe(false);
        seen.add(project.venture);
      }
      previous = project.venture;
    }
  }
});

/*
  Replaces the per-slug list in `pulse is public with a repo link; ulbra
  projects are private with no repo link`, which named `ulbra-atende` and
  `ulbra-one` by hand and so would silently skip every project added after it.
  Delete the `for (const slug of ['ulbra-atende', 'ulbra-one'])` loop from that
  test and leave its `pulse` assertions in place.
*/
it('every venture project is private with no repository link', () => {
  const inVentures = projects.filter((p) => p.venture !== undefined);
  expect(inVentures.length).toBeGreaterThan(0);
  for (const project of inVentures) {
    expect(project.visibility, `${project.slug} visibility`).toBe('private');
    expect(
      project.links.some((l) => /github\.com|gitlab|repo/i.test(l.href)),
      `${project.slug} links to a repository`,
    ).toBe(false);
  }
});

it('every ulbra project is led as Head of Technology, not as a nameless engineer', () => {
  const ulbra = projects.filter((p) => p.venture === 'ulbra');
  expect(ulbra.length).toBeGreaterThan(0);
  for (const project of ulbra) {
    expect(project.role.en, `${project.slug} role`).toMatch(/head of technology/i);
    expect(project.period, `${project.slug} has no period`).toBeDefined();
    expect(project.period!.en, `${project.slug} period is a non-answer`).not.toMatch(/professional work/i);
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

it('every project states what the author did', () => {
  for (const project of projects) {
    const contribution = project.detail?.contribution;
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

it('ulbra-one is described as pre-launch, not as delivered', () => {
  const one = projects.find((p) => p.slug === 'ulbra-one')!;
  expect(one.detail!.overview!.en).toMatch(/testing|pre-launch|not yet/i);
  expect(one.detail!.metrics, 'no production metrics before production').toBeUndefined();
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

it('dietbox has a case study, localized in every locale', () => {
  const project = projects.find((p) => p.slug === 'dietbox');
  expect(project).toBeDefined();

  expectBothLocales(project!.tagline, 'tagline');
  expectBothLocales(project!.description, 'description');
  expectBothLocales(project!.role, 'role');

  const detail = project!.detail;
  expect(detail).toBeDefined();

  expectBothLocales(detail!.overview!, 'overview');
  expectBothLocales(detail!.problem!, 'problem');
  expectBothLocales(detail!.metricsNote!, 'metricsNote');

  expect(detail!.metrics).toHaveLength(4);
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

  expect(detail!.highlights).toHaveLength(4);
  for (const highlight of detail!.highlights!) {
    expectBothLocales(highlight, 'highlight');
  }

  expect(detail!.decisions).toHaveLength(4);
  for (const decision of detail!.decisions!) {
    expectBothLocales(decision.heading, 'decision.heading');
    expectBothLocales(decision.body, 'decision.body');
  }
});

it('dietbox names the shared work — its largest codebase was a team effort', () => {
  const boundary = projects.find((p) => p.slug === 'dietbox')!.detail!.contribution!.boundary;
  expect(boundary, 'the boundary must exist').toBeDefined();
  expectBothLocales(boundary!, 'dietbox contribution.boundary');
});

it('dietbox sits between kota-embed and the ulbra projects', () => {
  const slugs = projects.map((p) => p.slug);
  expect(slugs.indexOf('dietbox')).toBeGreaterThan(slugs.indexOf('kota-embed'));
  expect(slugs.indexOf('dietbox')).toBeLessThan(slugs.indexOf('ulbra-atende'));
});

it('dietbox links to its product, not its source', () => {
  const dietbox = projects.find((p) => p.slug === 'dietbox')!;
  expect(dietbox.visibility).toBe('private');
  expect(dietbox.links).toEqual([{ label: 'Website', href: 'https://dietbox.me' }]);
});

it('dietbox is the only project with a leadership section, localized and non-empty', () => {
  const withLeadership = projects.filter((p) => p.detail?.leadership);
  expect(withLeadership.map((p) => p.slug)).toEqual(['dietbox']);

  const leadership = withLeadership[0]!.detail!.leadership!;
  expect(leadership).toHaveLength(4);
  for (const section of leadership) {
    expectBothLocales(section.heading, 'dietbox leadership heading');
    expectBothLocales(section.body, 'dietbox leadership body');
  }
});
