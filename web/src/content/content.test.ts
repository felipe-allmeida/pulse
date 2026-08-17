import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { projects } from './projects';
import { ventures } from './ventures';
import { expectBothLocales } from '@/test/expect-both-locales';

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
 * simultaneously — no more, no fewer, so the count is asserted rather than
 * just its presence, which would silently tolerate a third role losing its
 * end date by accident. What is still worth asserting beyond that is that
 * every *closed* role carries a real date range rather than a word like
 * "Recent".
 */
it('open-ended periods end in Current; every closed role carries real dates', () => {
  const isOpenEnded = (period: string) => /(^|– )Current$/.test(period);

  const open = profile.experience.filter((e) => isOpenEnded(e.period.en));
  expect(open, 'exactly ULBRA and Pampa Devs are current').toHaveLength(2);
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
  Replaces the per-slug list that used to live in `pulse is public with a repo
  link; ulbra projects are private with no repo link`, which named
  `ulbra-atende` and `ulbra-one` by hand. A rule keyed on `venture` covers
  every project in the venture automatically, including ones added after this
  test was written — a hand-maintained list of slugs would silently stop
  covering a new project the moment someone forgot to add it here.
*/
it('every venture project is private with no repository link', () => {
  const inVentures = projects.filter((p) => p.venture !== undefined);
  expect(inVentures, 'all six ULBRA projects').toHaveLength(6);
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
  expect(ulbra, 'all six ULBRA projects').toHaveLength(6);
  for (const project of ulbra) {
    expect(project.role.en, `${project.slug} role`).toMatch(/head of technology/i);
    expect(project.period, `${project.slug} has no period`).toBeDefined();
    expect(project.period!.en, `${project.slug} period is a non-answer`).not.toMatch(/professional work/i);
  }
});

it('ulbra-atende has a full case study, localized in every locale', () => {
  const project = projects.find((p) => p.slug === 'ulbra-atende');
  expect(project).toBeDefined();
  const detail = project!.detail;
  expect(detail).toBeDefined();

  expectBothLocales(detail!.problem!, 'problem');
  expectBothLocales(detail!.metricsNote!, 'metricsNote');

  expect(detail!.metrics).toHaveLength(5);
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

/**
 * Strips the specific placeholder forms a project narrative is allowed to
 * contain, so the guard below can run over *every* field of every project —
 * including `script.lines` — rather than exempting a whole field from
 * inspection. Four forms are sanctioned, and only these:
 *
 * - RFC 2606 reserved domains (`example.com`, `.net`, `.org`) and this
 *   repo's `example.internal` convention for sample hostnames. These are
 *   reserved by specification precisely so they can never resolve to a real
 *   host, so a match here cannot be a leak. The negative lookbehind requires
 *   that nothing already part of a domain label (a letter, digit or hyphen)
 *   sits immediately before the match — without it, `evil-example.com`
 *   reads as a subdomain of `example.com` and gets wrongly neutralised,
 *   because a hyphen still satisfies a plain `\b` word boundary.
 * - A dot-less hostname inside a URL, e.g. `http://otel-collector:4317`.
 *   DNS requires a dot for a name to be publicly resolvable, so a bare,
 *   dot-less name is a container/service alias by construction — it cannot
 *   be a real internet-facing address no matter which config it appears in.
 *   The host run must be followed by a port, a path, a closing quote (the
 *   input is `JSON.stringify`'d, so a URL at the end of a string is
 *   followed by `"`) or the end of input. Asserting that terminator directly
 *   — rather than forbidding a trailing dot with `(?!\.)` — matters: `(?!\.)`
 *   only rejects backtracking to the exact boundary of a dotted label, so on
 *   an ordinary host like `google.com` the greedy match backtracks one
 *   character short of the dot and matches anyway, leaving a masked
 *   `PLACEHOLDER_URLe.com` behind with no word boundary in front of the TLD.
 * - A dotted config-label key immediately followed by `=`, e.g.
 *   `traefik.enable=true` or `traefik.http.routers.myapp.rule=Host(...)` in
 *   `ulbra-infra`'s script sample. Docker/Traefik labels are dotted key
 *   paths, not hostnames — but the `=` terminator alone isn't a safe
 *   sanction: host-keyed config lines (a properties file, a hosts-style
 *   mapping) are ordinary in exactly this field, so an unanchored dotted-run-
 *   before-`=` pattern launders any hostname written before an `=`. Anchoring
 *   to the known `traefik.` label prefix keeps the sanction to the one label
 *   family that actually appears in the sample, without opening a door for
 *   an arbitrary host to walk through.
 * - The literal name `Pagar.me`, a real, named public payment vendor in the
 *   Dietbox case study — not an internal host. Restoring case-insensitivity
 *   on the hostname pattern (see below) makes this the one false positive in
 *   the whole corpus: it is domain-shaped, but it is a company name in an
 *   unrelated case study, so it gets sanctioned by its literal name rather
 *   than by loosening the pattern that catches real leaks.
 *
 * Anything else — a real TLD, a dotted internal hostname, a credential — is
 * left untouched and still fails the checks that follow.
 */
function withoutSanctionedPlaceholders(text: string): string {
  return (
    text
      // registry.example.internal, my-app.example.internal, example.com, ...
      .replace(/(?<![a-z0-9-])(?:[a-z0-9-]+\.)*example\.(?:com|net|org|internal)\b/gi, 'PLACEHOLDER_HOST')
      // http://otel-collector:4317 — host has no dot, so no scheme+host survives.
      .replace(/\bhttps?:\/\/[a-z0-9-]+(?=[:/"']|$)/gi, 'PLACEHOLDER_URL')
      // traefik.enable=true, traefik.http.routers.myapp.rule=Host(...) — a label
      // key, not a hostname. Anchored to the known `traefik.` prefix on
      // purpose: an unanchored version would launder any hostname written
      // immediately before an `=`, which is an ordinary shape for a
      // host-keyed config line (a properties file, a hosts-style mapping).
      .replace(/\btraefik(?:\.[a-z0-9-]+)+(?==)/gi, 'PLACEHOLDER_LABEL_KEY')
      // Pagar.me — a named public payment vendor in the Dietbox case study,
      // not an internal host. Sanctioned by literal name, not by pattern.
      .replace(/\bPagar\.me\b/gi, 'PLACEHOLDER_VENDOR')
  );
}

/**
 * `withoutSanctionedPlaceholders` is logic, not content, and a silent
 * regression in it disables the guard below without any test going red —
 * which is exactly what happened once already (a field-wide exclusion) and
 * a second time after that (a backtracking URL regex that quietly masked
 * real hosts, including the exact one the plan's Global Constraints name).
 * So it gets its own case-by-case test: every sanctioned placeholder must
 * be neutralised, and every real host or URL — including ones deliberately
 * shaped to look like a sanctioned placeholder — must survive untouched.
 */
describe('withoutSanctionedPlaceholders', () => {
  // Mirrors the real guard's own patterns (below), not an independent
  // approximation of them — a narrower TLD list here once let a case
  // masked by a bug in the neutraliser slip past this tripwire undetected.
  const hasUrlOrHostname = (text: string) =>
    /https?:\/\//.test(text) || /\b[a-z0-9-]+\.[a-z]{2,}\b/i.test(text);

  const sanctioned: Array<[name: string, input: string]> = [
    ['example.internal', 'image: registry.example.internal/my-app:latest'],
    ['a sub-domained example.com', 'see docs.example.com for details'],
    ['dot-less URL alias with a port', 'http://otel-collector:4317'],
    ['dot-less URL alias at the end of a JSON string', '{"a":"http://myservice"}'],
    ['a docker-compose label key immediately before =', 'traefik.enable=true'],
    [
      'a multi-segment label key immediately before =',
      'traefik.http.routers.myapp.rule=Host(`my-app.example.internal`)',
    ],
    ['Pagar.me — a named public payment vendor', 'migrated billing from Iugu to Pagar.me'],
  ];

  for (const [name, input] of sanctioned) {
    it(`neutralises: ${name}`, () => {
      const output = withoutSanctionedPlaceholders(input);
      expect(output, `${name}: was not changed at all`).not.toBe(input);
      expect(hasUrlOrHostname(output), `${name}: still reads as a URL/hostname after neutralising`).toBe(
        false,
      );
    });
  }

  const real: Array<[name: string, input: string]> = [
    ['notexample.com is not a subdomain of example.com', 'http://notexample.com'],
    ['evil-example.com.attacker.net — a label-prefix trick', 'http://evil-example.com.attacker.net'],
    ['a plain real URL', 'http://google.com'],
    ['a real bare hostname', 'api.stripe.com'],
    ['the exact host the plan names to keep out', 'https://signoz.ulbra.ai/x'],
    ['an uppercase host — prose is not always lowercase', 'SIGNOZ.ULBRA.AI'],
    ['a Title-Cased two-label host at a sentence start', 'Ulbra.br is the domain.'],
    ['a real host written before = — not a traefik label', 'sau.ulbra.br=1'],
  ];

  for (const [name, input] of real) {
    it(`leaves intact: ${name}`, () => {
      const output = withoutSanctionedPlaceholders(input);
      expect(hasUrlOrHostname(output), `${name}: was masked by the neutraliser`).toBe(true);
    });
  }
});

it('publishes no hostname, URL or credential in any project narrative', () => {
  // Deliberately pattern-based rather than a list of the specific internal
  // hosts to keep out: this repository is public, so a guard naming them would
  // publish exactly what it exists to protect — the same trap a name-list guard
  // fell into on an earlier project. `links` is excluded because a public repo
  // link is the one URL that belongs in content. Everything else — including
  // `script.lines`, which is verbatim sample code rather than prose — is
  // scanned, with only the sanctioned placeholder forms neutralised first;
  // see `withoutSanctionedPlaceholders`.
  for (const project of projects) {
    if (!project.detail) continue;
    const narrative = withoutSanctionedPlaceholders(JSON.stringify(project.detail));
    expect(narrative, `${project.slug} detail contains a URL`).not.toMatch(/https?:\/\//);
    // Case-insensitive on purpose: this scans prose, not config, and prose
    // capitalises freely — including at the start of a sentence. A
    // case-sensitive host matcher is blind to exactly the accident this
    // guard exists to catch (e.g. `SIGNOZ.ULBRA.AI`, `Ulbra.br`).
    expect(narrative, `${project.slug} detail contains a hostname`).not.toMatch(
      /\b[a-z0-9-]+\.[a-z]{2,}\b/i,
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

it('ulbra-crm names the work as the team\'s, not the author\'s', () => {
  const crm = projects.find((p) => p.slug === 'ulbra-crm');
  expect(crm, 'the CRM is published').toBeDefined();
  const boundary = crm!.detail!.contribution!.boundary!;
  expect(boundary.en, 'the boundary must say the team implemented it').toMatch(/team|engineers/i);
  expect(crm!.detail!.contribution!.summary.en).toMatch(/direct|led|set/i);
});

it('ulbra-crm carries the coverage figure, the one real number it has', () => {
  const metrics = projects.find((p) => p.slug === 'ulbra-crm')!.detail!.metrics!;
  expect(metrics.length).toBeGreaterThan(0);
  expect(metrics.some((m) => /100%/.test(m.value.en))).toBe(true);
});

it('ulbra-admin explains why it is architecturally the opposite of the service desk', () => {
  const admin = projects.find((p) => p.slug === 'ulbra-admin');
  expect(admin, 'the admin platform is published').toBeDefined();
  const decisions = admin!.detail!.decisions!;
  expect(decisions.length).toBeGreaterThan(0);
  const bodies = decisions.map((d) => d.body.en).join(' ');
  expect(bodies, 'the simplicity decision states its reason').toMatch(/no modules|no ddd|simple/i);
});

it('the student dashboard says where it is actually installed', () => {
  const dashboard = projects.find((p) => p.slug === 'ulbra-student-dashboard');
  expect(dashboard, 'the student dashboard is published').toBeDefined();
  expect(dashboard!.detail!.overview!.en).toMatch(/medic/i);
});

it('ulbra-infra describes the delivery loop and leaks no address', () => {
  const infra = projects.find((p) => p.slug === 'ulbra-infra');
  expect(infra, 'the infrastructure work is published').toBeDefined();

  const decisions = infra!.detail!.decisions!.map((d) => d.body.en).join(' ');
  expect(decisions, 'the alert-to-PR loop is explained').toMatch(/alert/i);

  // The narrative test at the top of this file covers prose; the script block
  // is verbatim lines and needs its own check.
  for (const line of infra!.detail!.script!.lines) {
    expect(line, `script leaks a real host: ${line}`).not.toMatch(/ulbra\.(ai|br)/i);
  }
});
