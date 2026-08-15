# Dietbox — case study with a leadership section — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-15
- **Scope:** Add Dietbox as a sixth project, and give the case-study pages a `leadership` section so a project can describe what changed under someone's direction, not only what they built.

---

## 1. Purpose

Every project on the site so far is described by what was built. Dietbox is the
first where that would tell less than half the story: the author joined as a
senior engineer, migrated the legacy platform, and then ran the whole technology
organisation — thirteen people across engineering, QA, UX and support — for two
years.

It is also the project with the most of his work in it by a wide margin: roughly
fifteen hundred commits across six repositories, and, in his own account,
principal architect for the platform and the Azure estate, setting the patterns
the rest of the team followed even in the services he did not write.

That last part is exactly what commit counts cannot show. He has 18% of the
commits in the largest repository and defined the standards behind the other
82%. The contribution section exists for that gap; this project is the clearest
case for it.

---

## 2. Decisions (locked)

- **Dietbox may be named.** The company, the product and the architecture are
  publishable. Not publishable: any internal infrastructure detail, any
  colleague's name, or anything drawn from the parts of the source held out of
  scope below.
- **Parts of the source are out of scope for reasons communicated to the
  author privately.** Nothing from them reaches this work, and the
  implementation plan carries a sweep. The reason is deliberately not recorded
  here: this document is published, and a public note about a named third
  party's security posture is itself a disclosure, whatever care it takes with
  the details.
- **The page covers both halves, in separate sections.** The platform he built
  is one story; what changed when he took over the organisation is another.
  Mixing "why event sourcing" with "how deploys went from nightly to hourly"
  muddies both.
- **Leadership reuses the decisions renderer.** A `leadership?: CaseStudySection[]`
  field renders through the existing `CaseStudyDecisions` component under its own
  heading. Same shape — a titled claim with its reasoning — so no new component.
- **Operational numbers come from the author's CV and are stated plainly.**
  Thirteen people, lead time a month to a week and a half, deploys once nightly
  to several a day, cloud spend down 21%, a payment migration moving thousands
  of active subscribers without revenue disruption. They carry no hedge: he
  states them in a document he sends to employers, so qualifying them here as
  unverifiable would make his portfolio weaker than his own CV about his own
  work. The distinction the page still keeps is between these and the
  repository-checkable figures, which is a matter of where they came from, not
  of confidence.
- **Structural numbers come from the repositories** and are separately
  checkable: six services, two audiences with their own identity flows.
- **Existing invariants hold.** `visibility: 'private'`, `links: []`, all copy
  localized `en` / `pt-BR`, exactly one `<h1>`, no personal data.

---

## 3. Schema

One new optional field on `ProjectDetailContent`:

```ts
  /** What changed under the author's direction — reuses the decisions shape. */
  leadership?: CaseStudySection[];
```

No new type and no new component: `CaseStudySection` already models a titled
claim with its reasoning, and `CaseStudyDecisions` already renders a list of
them. The section takes a new i18n key, because "What changed under my
direction" is a label the site would reuse on any project with a leadership
story, not a caption specific to one figure.

---

## 4. Rendering

`project-detail.tsx` gains one section, rendered after **Engineering decisions**:

**… What it does → Engineering decisions → What changed under my direction.**

It goes last deliberately. A reader arrives wanting to know what the system is
and how it was built; the organisational story is what they read once they care
about the person rather than the product. Putting it above the technical
sections would also make the page read as a management CV, which it is not.

---

## 5. Content

**Slug.** `dietbox`. **Position.** After `kota-embed`, before the Ulbra
projects — it is the largest body of the author's work and predates them.

**Tagline.** Nutrition software for practitioners and their patients.

**Overview.** A Brazilian SaaS used by nutritionists to plan diets and by their
patients to follow them — two audiences with almost nothing in common sharing
one product, one identity system and one platform.

**Problem.** The nutritionist lives in the tool all day; the patient opens it to
read a meal plan. Same product, same identity backbone, opposite expectations —
and, in 2020, a .NET Framework monolith carrying both on Windows App Service,
deployed once a day, at night, because that was the only safe window.

**Metrics** (four tiles):

| Value | Label | Note |
|---|---|---|
| 13 | people in the org | engineering, QA, UX and support |
| ~1.5k | commits across six services | the author's own, of ~4.7k total |
| 1 month → 1.5 weeks | lead time | after Scrum and trunk-based development |
| −21% | monthly cloud spend | after an Azure cost pass |

**Architecture flow** (five steps): `Legacy platform` (the .NET monolith the
product grew on) → `Identity` (Azure AD B2C with custom policies, a separate
flow per audience) → `Portal service` (the newer generation: layered domain,
shared building blocks, event sourcing) → `Realtime` (Socket.io behind a Redis
adapter, so a horizontally scaled service can still push) → `Azure` (the estate
the author configured).

**Engineering decisions** (four):

1. **Custom identity policies instead of a hosted login.** Two audiences that
   share a product but not a journey — a practitioner signing up for a
   subscription and a patient invited by theirs. Custom B2C policies let each
   have its own sign-up, sign-in and password flow, branded per audience, over
   one identity backbone rather than two user stores.
2. **Shared building blocks before shared services.** The newer services start
   from a common domain, infrastructure and identity layer rather than each
   inventing its own. It is what let a small team add services without the
   fourth one being written in a fourth style.
3. **Event sourcing in the portal, not everywhere.** The portal's questions are
   historical — what changed, when, by whom — so its state is derived from
   events. The rest of the platform is not, because the rest of the platform is
   not asking that.
4. **Realtime as its own service.** Long-lived connections scale on a different
   axis from request traffic, and behind a Redis adapter any instance can push to
   a client connected to any other. Keeping it in the monolith would have tied
   both to the same deploy.

**What changed under my direction** (four, the leadership section):

1. **From one nightly deploy to several a day.** The team shipped once a day,
   at night, because that was the only window that felt safe. Scrum and
   trunk-based development took lead time from about a month to a week and a
   half, and made daylight deploys ordinary rather than an event.
2. **A payment migration nobody noticed.** Moving thousands of active
   subscribers from Iugu to Pagar.me, planned and executed without interrupting
   revenue — the kind of change whose success is that nothing happened.
3. **Cloud spend as an engineering problem.** A cost pass over the Azure estate
   cut monthly spend by 21%, without a feature freeze to pay for it.
4. **Reporting engineering in the executive's language.** DORA metrics and a
   roadmap presented to the executive team, so technology investment was argued
   with evidence rather than conviction.

**Contribution.**

- *Summary:* Two roles over four years — senior engineer first, then Head of
  Technology. Principal architect throughout: the platform's patterns and the
  Azure estate were his, including in the services other people wrote.
- *Areas:* the legacy platform's migration from .NET Framework on Windows to
  .NET 6 on Linux; identity, end to end, including the custom B2C policies for
  both audiences; the portal service and its shared building blocks; the
  realtime service; CI/CD in Azure DevOps; production availability and incident
  response.
- *Boundary:* the product's largest codebase was a team effort — he holds
  roughly a fifth of its commits and set the patterns behind the rest.

**Tech chips.** `.NET`, `Azure`, `Azure AD B2C`, `PostgreSQL`, `Redis`,
`Socket.io`, `Azure DevOps`.

**Role.** Senior Software Engineer, then Head of Technology.
**Period.** 2020–2024.

**Link.** `https://dietbox.me` — the product's public site, checked and
reachable. It renders beside the private-source lock, as Kota's does: the
source is closed, the product is not.

**No screenshot.** The product is a commercial SaaS behind its customers'
logins. The card falls back to the generated cover, as the other private
projects do.

---

## 6. Testing

- **Content test:** Dietbox joins the both-locale sweep; `leadership` is
  localized throughout and non-empty; the contribution's boundary is present,
  because this project's largest repository was shared work.
- **Page test:** `/projects/dietbox` renders its `<h2>`s in the locked order,
  with the leadership section last, one `<h1>` and no external link.
- **Regression:** the five existing projects render exactly the sections they
  render today; none has a `leadership` field.
- **Secret sweep:** the implementation plan carries a check that no value from
  the repositories' settings or pipeline files appears anywhere in the diff.

---

## 7. Out of scope

- Ulbra One's case study, still pending.
- Any figure beyond the architecture flow — Dietbox gets no script, table or
  comparison figure in this pass. The lead-time change is a candidate for the
  comparison figure later; it is left out now to keep this page's first version
  readable rather than exhaustive.
