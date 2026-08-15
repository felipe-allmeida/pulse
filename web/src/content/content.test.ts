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

  expectBothLocales(detail!.architecture!.summary, 'architecture.summary');
  expect(detail!.architecture!.nodes.length).toBeGreaterThanOrEqual(3);
  for (const node of detail!.architecture!.nodes) {
    expect(node.label.trim()).not.toBe('');
    expectBothLocales(node.detail, 'architecture.node.detail');
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
      expect(detail.architecture.nodes.length, `${project.slug} architecture nodes`).toBeGreaterThan(0);
    }
    if (detail.metricsNote) {
      expect(detail.metrics?.length ?? 0, `${project.slug} metricsNote without metrics`).toBeGreaterThan(0);
    }
  }
});
