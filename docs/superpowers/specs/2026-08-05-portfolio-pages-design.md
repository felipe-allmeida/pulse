# Pulse — Portfolio Pages (About, Projects, CV) + Nav — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-05
- **Scope:** Frontend only. Content pages + navigation inside the existing pulse app. No backend changes.

---

## 1. Purpose

Turn the pulse app from a single live dashboard into a real portfolio: keep the live dashboard as the hero at `/`, and add an **About** page, a **Projects** page, a **top nav**, and a **CV download**. This completes the recruiter-facing surface (dashboard = the "wow", About/Projects = the depth, CV = the takeaway). It's the sibling of the AI assistant already shipped — both present the same "who is Felipe" story, kept consistent with the curated `profile.md`.

---

## 2. Decisions (locked)

- **Multi-route with a top nav.** TanStack Router routes: `/` (dashboard, hero, unchanged), `/about`, `/projects`. Top nav in `AppShell`: **Home · About · Projects** + a **Download CV** button. Active-route highlighting; on mobile the nav collapses into a menu (shadcn `Sheet`).
- **Content is data-driven** — a small typed content module (`web/src/content/*`) holds the bio/experience/skills/projects, so pages render from data and stay consistent with `profile.md` (the AI's knowledge). Felipe edits the content module; the AI's `profile.md` stays the separate source for the assistant (they mirror each other but aren't code-coupled).
- **Assets (photo, screenshots, CV) are Felipe's** — build with tasteful placeholders + clear drop-in paths (`web/public/`), draft the text; nothing blocks on assets.
- **English** (international recruiters). shadcn + the dashboard's dark theme. Responsive + accessible.
- **Ulbra projects are proprietary work** — described at a **high level only** (product purpose, Felipe's role, stack, outcomes — CV-style). **No code, no internal URLs, no private-repo links, no sensitive architecture.** The drafted copy is conservative and **Felipe reviews/approves it for confidentiality** at the spec-review gate.

---

## 3. Pages & components

| Component | Responsibility | Path |
|---|---|---|
| `TopNav` (in/near `AppShell`) | Home/About/Projects links (active highlight) + Download CV button; mobile `Sheet` menu | `web/src/components/nav/top-nav.tsx` |
| `routes/about.tsx` | The About page | `/about` |
| `routes/projects.tsx` | The Projects page | `/projects` |
| `AboutHero`, `ExperienceTimeline`, `SkillGroups`, `SocialLinks` | About sections | `web/src/components/about/*` |
| `ProjectCard` | One project (title, one-liner, description, tech tags, role, links, screenshot) | `web/src/components/projects/project-card.tsx` |
| `content/profile.ts` | Typed bio/title/one-liner/social/skills/experience data | `web/src/content/profile.ts` |
| `content/projects.ts` | Typed `Project[]` (pulse + Ulbra Atende + Ulbra One) | `web/src/content/projects.ts` |
| `CvButton` | Download-CV link → `/cv.pdf`, graceful if absent | `web/src/components/nav/cv-button.tsx` |

### About page
A hero (profile photo — placeholder avatar until Felipe drops `web/public/felipe.jpg` — + name, title, one-liner), a short bio, an **experience timeline** (Kota.io → ADP Brazil Labs → Dietbox; founder of Pampa Devs), **skills** grouped into chips (languages / backend / frontend / infra / data), and **social links** (GitHub, LinkedIn). Drafted from public info + `profile.md`; Felipe refines.

### Projects page
A responsive grid of `ProjectCard`s:
- **pulse** (featured) — this live real-time system: presence, world map, event-driven backend, IaC, the AI assistant. Links: **live demo** (when deployed) + **GitHub repo** + screenshot.
- **Ulbra Atende** (internal name Ulbra-SAU) — a support/ticketing platform: .NET 10 modular monolith, event-driven (outbox/RabbitMQ), Identity + Tickets domains, Google SSO, React dashboard. Role + outcomes: **Felipe fills/approves**. Private work → no repo link (a "Private / professional work" label); screenshot placeholder or a neutral mockup.
- **Ulbra One** — an internal ERP replacing legacy systems: .NET 10 modular monolith, PostgreSQL 17, EF Core, React. Role + outcomes: **Felipe fills/approves**. Private work → no repo link; screenshot placeholder.

Each card: title, one-liner, 2–3 sentence description, tech tags (shadcn `Badge`), a role/period line, links (only where public), and a screenshot (placeholder card until provided).

### CV
A **Download CV** button in the nav (and on About) linking to `/cv.pdf` (a static asset Felipe drops in `web/public/`). The button is always shown and points at `/cv.pdf`; Felipe adds `web/public/cv.pdf` before launch (a committed `web/public/cv.pdf` placeholder — a one-page "CV coming soon" PDF — ships so the link never 404s and is trivially replaced). No runtime file-presence detection.

---

## 4. Content handling

- `content/profile.ts` + `content/projects.ts` are the single edit points for page copy — typed objects, no prose buried in JSX.
- Placeholders: an **initials avatar** until a photo exists; **neutral "screenshot coming" cards** until screenshots exist; the CV button degrades if `/cv.pdf` is missing.
- The page content mirrors `src/Pulse.Api/Assistant/profile.md` so the assistant and the pages tell the same story (kept in sync by hand; not code-coupled).

---

## 5. Responsive & a11y

- Top nav: horizontal links on `md+`, a `Sheet` hamburger menu on mobile. Active route via TanStack Router's active props.
- Responsive grids (projects, skills), fluid About hero (photo stacks above text on mobile).
- Semantic headings (one `h1` per page), `alt` text on images, keyboard-navigable nav + menu, focus states.

---

## 6. Testing

- **vitest + testing-library:** `TopNav` renders the three links + CV button and highlights the active route; the mobile menu opens; `ProjectCard` renders title/tags/links from a `Project` object and omits the repo link when a project has none (the private-work case); About renders bio/skills/timeline from `content/profile.ts`; `CvButton` links to `/cv.pdf` (and degrades when flagged absent).
- **Hard gate:** `pnpm -C web build` (not just `tsc`) + `pnpm -C web exec tsc --noEmit` + `pnpm -C web test` all green.

---

## 7. Scope (YAGNI)

**In:** the About + Projects routes, the top nav (+ mobile menu), the CV download, the typed content modules, placeholders, tests. **Out:** a CMS, a blog, i18n, a contact form (social links suffice), animations beyond subtle transitions, and any backend change. The dashboard route is untouched.

---

## 8. Success criteria

- A recruiter lands on the live dashboard, and can navigate to About (bio/experience/skills) and Projects (pulse + the two Ulbra projects) via a clear nav, and download the CV.
- Everything is responsive and accessible; nothing 404s if assets aren't present yet.
- The Ulbra project copy is high-level and confidentiality-safe (no code, no internal links/details), pending Felipe's approval.
- Page content mirrors `profile.md` so the assistant and the pages are consistent.
