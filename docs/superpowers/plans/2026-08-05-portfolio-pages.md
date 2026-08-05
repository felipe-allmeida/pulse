# Portfolio Pages (About / Projects / CV + Nav) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add About + Projects pages, a top nav, and a CV download to the pulse app — turning the live dashboard into a full portfolio — all data-driven and responsive.

**Architecture:** New TanStack Router routes (`/about`, `/projects`) alongside the untouched dashboard `/`. A `TopNav` (in `AppShell`) links them with active highlighting and a mobile `Sheet` menu, plus a Download-CV button. Page copy lives in typed `content/*` modules (not buried in JSX) so it's a single edit point and mirrors the AI's `profile.md`.

**Tech Stack:** React 19 + Vite + TanStack Router (file-based) + shadcn/ui (Button, Card, Badge, Sheet — all already present) + Tailwind v4 tokens + vitest. No new runtime deps.

## Global Constraints

- **pnpm**; React 19 + Vite + **TS strict**; `pnpm -C web build` must pass (not just `tsc`). Semantic Tailwind tokens; **no `dangerouslySetInnerHTML`**. **English** copy.
- **Content is data-driven** — page text lives in `web/src/content/*.ts` (typed), not inline JSX prose.
- **Ulbra projects are proprietary** — described **high level only** (product, role, stack, outcomes); **no code, no internal URLs, no private-repo links**. Their `ProjectCard` has NO repo link (a "Professional work — private" label instead). Copy is conservative; Felipe reviews it.
- **Assets are Felipe's** — build with placeholders (initials avatar, "screenshot coming" cards, a placeholder `cv.pdf`) + clear drop-in paths; nothing blocks on assets.
- Dashboard route `/` is **untouched**; matches the existing dark theme.
- Routes use `createFileRoute('/path')`; the `TanStackRouterVite` plugin regenerates `routeTree.gen.ts` on build/dev.

---

## File Structure

```
web/src/content/
  profile.ts          # typed bio/title/one-liner/social/skills[]/experience[]
  projects.ts         # Project type + projects[] (pulse, Ulbra Atende, Ulbra One)
web/src/routes/
  about.tsx           # /about — composes About sections from content/profile
  projects.tsx        # /projects — grid of ProjectCard from content/projects
web/src/components/nav/
  top-nav.tsx         # Home/About/Projects links (active) + CvButton + mobile Sheet
  cv-button.tsx       # Download CV → /cv.pdf
web/src/components/about/
  about-hero.tsx  experience-timeline.tsx  skill-groups.tsx  social-links.tsx
web/src/components/projects/
  project-card.tsx
web/src/components/app-shell.tsx   # MODIFY: mount <TopNav/> in the header
web/public/cv.pdf                  # placeholder PDF (Felipe replaces)
```

**Interfaces locked across tasks:**
- `content/profile.ts`: `Profile = { name:string; title:string; tagline:string; bio:string; social:{label:string;href:string}[]; skills:{group:string;items:string[]}[]; experience:{role:string;org:string;period:string;summary:string}[] }`; `export const profile: Profile`.
- `content/projects.ts`: `Project = { slug:string; name:string; tagline:string; description:string; tech:string[]; role:string; period?:string; links:{label:string;href:string}[]; visibility:'public'|'private'; screenshot?:string }`; `export const projects: Project[]`.
- `components/nav/top-nav.tsx`: `TopNav` (no props).
- `components/projects/project-card.tsx`: `ProjectCard({ project }: { project: Project })`.

---

### Task 1: Typed content modules (profile + projects)

**Files:**
- Create: `web/src/content/profile.ts`, `web/src/content/projects.ts`
- Test: `web/src/content/content.test.ts`

**Interfaces:**
- Produces: `Profile`/`profile`, `Project`/`projects` (signatures above).

- [ ] **Step 1: Write the failing test** — assert the data shape + the public/private invariant:

```ts
import { profile } from './profile';
import { projects } from './projects';
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
```

- [ ] **Step 2: Run** → FAIL (modules missing).
- [ ] **Step 3: Implement** `profile.ts` (real draft from public info — Felipe edits):

```ts
export interface Profile { name: string; title: string; tagline: string; bio: string;
  social: { label: string; href: string }[];
  skills: { group: string; items: string[] }[];
  experience: { role: string; org: string; period: string; summary: string }[]; }

export const profile: Profile = {
  name: 'Felipe de Almeida',
  title: 'Senior Product Engineer & Software Architect',
  tagline: 'I build distributed systems, developer platforms, and cloud infrastructure.',
  bio: 'Software engineer and architect focused on distributed systems, event-driven design, and CI/CD. Currently Senior Product Engineer at Kota.io, building health-insurance infrastructure in Europe. Founder of Pampa Devs, a Brazilian developer community.',
  social: [
    { label: 'GitHub', href: 'https://github.com/felipe-allmeida' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/felipe-allmeida' },
  ],
  skills: [
    { group: 'Languages', items: ['C#', 'TypeScript', 'JavaScript', 'SQL'] },
    { group: 'Backend', items: ['.NET / ASP.NET Core', 'Node.js', 'SignalR', 'MassTransit', 'DDD', 'TDD'] },
    { group: 'Frontend', items: ['React', 'Vue', 'Next.js', 'Vite', 'Tailwind'] },
    { group: 'Infra', items: ['Docker', 'Kubernetes', 'Terraform', 'Azure', 'GitHub Actions', 'Caddy'] },
    { group: 'Data & messaging', items: ['PostgreSQL', 'SQL Server', 'Redis', 'RabbitMQ'] },
  ],
  experience: [
    { role: 'Senior Product Engineer', org: 'Kota.io', period: 'Current', summary: 'Health-insurance infrastructure for the European market.' },
    { role: 'Lead Software Engineer', org: 'ADP Brazil Labs', period: 'Past', summary: 'Led engineering on payroll/HR platform work.' },
    { role: 'Head of Technology', org: 'Dietbox', period: 'Past', summary: 'Owned technology and architecture.' },
    { role: 'Founder', org: 'Pampa Devs', period: 'Ongoing', summary: 'Open-source templates, tutorials, and tools for the developer community.' },
  ],
};
```

- [ ] **Step 4: Implement** `projects.ts` (pulse public; Ulbra high-level, private, no repo link — Felipe confirms copy + role):

```ts
export interface Project { slug: string; name: string; tagline: string; description: string;
  tech: string[]; role: string; period?: string;
  links: { label: string; href: string }[]; visibility: 'public' | 'private'; screenshot?: string; }

export const projects: Project[] = [
  { slug: 'pulse', name: 'Pulse', tagline: 'A live, real-time system embedded in a portfolio.',
    description: 'Visitors see who else is online, a live world map, and public metrics — a thin client over an event-driven .NET backend (SignalR presence, RabbitMQ outbox, Postgres, OpenTelemetry), an ops dashboard, and an AI assistant. Deployed with Docker/Caddy + IaC.',
    tech: ['.NET 10', 'SignalR', 'RabbitMQ', 'Redis', 'Postgres', 'React 19', 'Docker', 'Terraform'],
    role: 'Design & implementation', visibility: 'public',
    links: [{ label: 'GitHub', href: 'https://github.com/felipe-allmeida/pulse' }] },
  { slug: 'ulbra-atende', name: 'Ulbra Atende', tagline: 'Support & ticketing platform.',
    description: 'An internal support/ticketing platform: a .NET 10 modular monolith with event-driven messaging (transactional outbox), granular roles and teams, ticket templates with stages and tasks, and a React dashboard.',
    tech: ['.NET 10', 'PostgreSQL', 'RabbitMQ', 'React', 'SignalR'],
    role: 'Software engineer', period: 'Professional work', visibility: 'private', links: [] },
  { slug: 'ulbra-one', name: 'Ulbra One', tagline: 'Internal ERP replacing legacy systems.',
    description: 'A modular, integrated internal ERP built to replace legacy systems — a .NET 10 modular monolith on PostgreSQL with a React front end, following the same architecture patterns as the ticketing platform.',
    tech: ['.NET 10', 'PostgreSQL', 'EF Core', 'React', 'Tailwind'],
    role: 'Software engineer', period: 'Professional work', visibility: 'private', links: [] },
];
```

- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(web): typed profile + projects content modules"`

---

### Task 2: TopNav + CV button + route stubs + wire into shell

**Files:**
- Create: `web/src/components/nav/top-nav.tsx`, `web/src/components/nav/cv-button.tsx`, `web/src/routes/about.tsx` (stub), `web/src/routes/projects.tsx` (stub), `web/public/cv.pdf`
- Modify: `web/src/components/app-shell.tsx`
- Test: `web/src/components/nav/top-nav.test.tsx`

**Interfaces:**
- Consumes: shadcn `Button`/`Sheet`, TanStack Router `Link`.
- Produces: `TopNav`, `CvButton`.

- [ ] **Step 1: Placeholder CV** — generate a valid minimal placeholder PDF so `/cv.pdf` never 404s (Felipe replaces it):

```bash
python3 - <<'PY'
import struct, pathlib
objs = [
 b"<< /Type /Catalog /Pages 2 0 R >>",
 b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
 b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 120] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
 b"<< /Length 52 >>\nstream\nBT /F1 18 Tf 24 60 Td (CV coming soon) Tj ET\nendstream",
 b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
]
out=bytearray(b"%PDF-1.4\n"); offs=[]
for i,o in enumerate(objs,1):
    offs.append(len(out)); out+=f"{i} 0 obj\n".encode()+o+b"\nendobj\n"
xref=len(out); out+=f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n".encode()
for off in offs: out+=f"{off:010d} 00000 n \n".encode()
out+=f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
pathlib.Path("web/public/cv.pdf").write_bytes(out)
print("wrote web/public/cv.pdf", len(out), "bytes")
PY
```

- [ ] **Step 2: Route stubs** — `routes/about.tsx` and `routes/projects.tsx` each: `export const Route = createFileRoute('/about')({ component: () => <h1 className="text-2xl font-semibold">About</h1> });` (and `/projects`). These let the router compile + nav links resolve; real content lands in Tasks 3–4.
- [ ] **Step 3: Write the failing test** — `top-nav.test.tsx`: render `<TopNav/>` inside a test router (or with the `Link` mocked), assert it shows links named Home / About / Projects and a "Download CV" control, and the mobile menu trigger exists.
- [ ] **Step 4: Run** → FAIL.
- [ ] **Step 5: Implement** `cv-button.tsx` (an `<a href="/cv.pdf" download>` styled as a `Button` via `buttonVariants`, `Download` lucide icon, `aria-label="Download CV"`) and `top-nav.tsx`: TanStack Router `Link`s to `/`, `/about`, `/projects` with `activeProps={{ 'data-active': 'true' }}` (or the `activeProps className`) for active highlighting; horizontal on `md+`; on mobile a `Sheet` (hamburger `Menu` icon) listing the same links + CV. Use semantic tokens.
- [ ] **Step 6: Wire** `app-shell.tsx` — render `<TopNav/>` in the header (after the "Pulse" wordmark; keep `ConnectionStatus`/`PresenceBadge`/`ThemeToggle`). Make "Pulse" a `Link` to `/`.
- [ ] **Step 7: Run** → PASS; `pnpm -C web build` clean (routeTree regenerates with the two new routes).
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat(web): top nav + CV download + route stubs"`

---

### Task 3: About page

**Files:**
- Create: `web/src/components/about/{about-hero,experience-timeline,skill-groups,social-links}.tsx`
- Modify: `web/src/routes/about.tsx` (compose the real page)
- Test: `web/src/routes/about.test.tsx`

**Interfaces:**
- Consumes: `profile` (Task 1), shadcn `Badge`/`Card`.
- Produces: the About sections.

- [ ] **Step 1: Write the failing test** — render the About route component with `profile` and assert the name, the tagline, at least one skill (e.g. `Kubernetes` or `.NET`), and an experience org (`Kota.io`) appear.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the sections from `profile`:
  - `about-hero.tsx` — an **initials-avatar placeholder** (a rounded `div` with `FA` initials on `bg-muted`, `aria-hidden`; a comment noting `web/public/felipe.jpg` drops in later) + `profile.name`, `profile.title`, `profile.tagline`, and the `CvButton`.
  - `experience-timeline.tsx` — a vertical list of `profile.experience` (role @ org · period, summary), left border accent.
  - `skill-groups.tsx` — each `profile.skills` group as a labelled row of `Badge`s.
  - `social-links.tsx` — `profile.social` as `Button`-styled links (lucide icons), `rel="noreferrer"` / new tab.
  - `routes/about.tsx` composes them in a single-column, readable `max-w-3xl` layout; a single `h1`.
- [ ] **Step 4: Run** → PASS; `pnpm -C web build` clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(web): about page"`

---

### Task 4: Projects page

**Files:**
- Create: `web/src/components/projects/project-card.tsx`
- Modify: `web/src/routes/projects.tsx`
- Test: `web/src/components/projects/project-card.test.tsx`

**Interfaces:**
- Consumes: `Project`/`projects` (Task 1), shadcn `Card`/`Badge`/`Button`.
- Produces: `ProjectCard`.

- [ ] **Step 1: Write the failing test** — render `<ProjectCard project={...} />` for a public project (with a GitHub link) → asserts the name, a tech badge, and the GitHub link render; render for a private project (empty `links`) → asserts NO repo link and a "Private" / "Professional work" label appears instead.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `project-card.tsx` — a shadcn `Card`: a **screenshot area** (if `project.screenshot` render `<img alt>`; else a neutral placeholder box "Screenshot coming"), title + tagline, description, `tech` as `Badge`s, a role/period line, and links: for `visibility:'public'` render each `project.links` as a `Button`-styled anchor (new tab, `rel="noreferrer"`); for `'private'` render a muted "Professional work — private" label and NO external link. `routes/projects.tsx` — an `h1` + a responsive grid (`grid gap-6 md:grid-cols-2`) of `ProjectCard`s over `projects`.
- [ ] **Step 4: Run** → PASS; `pnpm -C web build` clean.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(web): projects page"`

---

### Task 5: Responsive/a11y polish + full verification

**Files:**
- Modify: any of the above for polish (spacing, mobile).

- [ ] **Step 1:** Verify the mobile nav: the `Sheet` menu opens on small screens and lists Home/About/Projects + CV; the desktop horizontal nav shows on `md+`. Ensure the About hero stacks (avatar above text) on mobile and the projects grid is single-column on mobile.
- [ ] **Step 2:** a11y sweep: exactly one `h1` per page, `alt`/`aria-hidden` on images/avatar, keyboard-focusable nav + menu with visible focus, external links `rel="noreferrer"` + open in a new tab.
- [ ] **Step 3: Full gate:** `pnpm -C web build` (0 errors), `pnpm -C web exec tsc --noEmit`, `pnpm -C web test` (all green incl. the new content/nav/about/projects tests).
- [ ] **Step 4: Live check** (optional): `pnpm -C web dev` (proxy to a running API or standalone), navigate `/ → /about → /projects`, download the CV, resize to mobile → menu works. Capture a screenshot for the report.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "chore(web): portfolio responsive + a11y polish"`

---

## Self-Review

**Spec coverage:** multi-route + nav ✓(T2) · active highlight + mobile menu ✓(T2,T5) · About (bio/timeline/skills/social/photo placeholder) ✓(T3) · Projects (pulse public + 2 Ulbra private, no repo links, screenshot placeholders) ✓(T1,T4) · CV download + placeholder pdf ✓(T2) · data-driven content mirroring profile.md ✓(T1) · Ulbra high-level/no private links ✓(T1,T4) · responsive/a11y ✓(T5) · dashboard untouched ✓ · pnpm build gate ✓(every task + T5).

**Placeholder scan:** the content copy (T1) is a real draft Felipe edits (bio/role) — a flagged content dependency, not a code placeholder. The CV `.pdf` is a generated valid placeholder (T2), not a stub. No vague "add error handling" steps.

**Type consistency:** `Profile`/`profile`, `Project`/`projects` (`slug`, `visibility:'public'|'private'`, `links`, `tech`, `screenshot?`), `TopNav`, `CvButton`, `ProjectCard({project})` — consistent across T1–T4.
