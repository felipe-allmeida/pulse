# "Send a pulse" + Ask chips (replacing emoji reactions) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Apply the **frontend-design** skill for visual work.

**Goal:** Replace the 8-emoji reactions widget (a toy with an invisible payoff, bad on mobile, dead in an empty room) with two things that actually serve a portfolio: **(1) "Send a pulse"** — one button that pushes a real event through the real pipeline and shows it traversing the architecture diagram with the measured round-trip time; and **(2) Ask chips** — suggested recruiter questions on the home that open the AI chat pre-filled.

**Why:** the site's job is portfolio + social proof. A pulse turns the live system into a *demonstration of engineering* (a recruiter sees the distributed round-trip work, with a real number). Ask chips turn idle attention into the conversation that sells Felipe.

**Key finding (grounding):** `PresenceHub.React(emoji)` broadcasts via `Clients.All` — **the sender receives its own echo**, and the SignalR `invoke()` promise resolves when the server has handled the call. So the pulse needs **zero backend change**: send an allow-listed payload, measure the round-trip client-side.

## Global Constraints

- **pnpm; TS strict, no `any`.** Reuse `components/signal/*`; signal tokens; en/pt-BR parity for all new copy.
- **NO fabricated numbers.** The displayed latency must be a genuinely measured round-trip (client → server ack → client), labelled truthfully. If a measurement is unavailable, show nothing rather than a fake value.
- **No backend change**: `PresenceHub`, the wire DTO (`ReactionDto{emoji,at}`), and the emoji allow-list stay as they are. The client repurposes one allow-listed payload as "the pulse" and renders all such events as pulses.
- **a11y:** one `<h1>` per page unchanged; the pulse button is a real `<button>` with an accessible name and a live-region announcement of the result; ≥44px tap target; `prefers-reduced-motion` → no traveling animation (show the result statically).
- **Mobile-first for both features** (this is why reactions were replaced): single-row, thumb-sized controls, no card stack.
- **Hard gate every task:** `pnpm -C web build` + `pnpm -C web exec tsc --noEmit` + `pnpm -C web test` all green. TDD where practical.

---

### Task 1: "Send a pulse" replaces reactions

**Files:**
- Create: `web/src/components/home/send-pulse.tsx`
- Modify: `web/src/components/home/engineering-showcase.tsx` (host the button next to the diagram), `web/src/components/home/architecture-diagram.tsx` (accept a "traversal" trigger), `web/src/routes/index.tsx` (drop the docked Reactions), `web/src/components/event-feed.tsx` + `web/src/i18n/locales/{en,pt-BR}/dashboard.json` (event label: reaction → pulse), `web/src/realtime/use-pulse-hub.tsx` if the send/measure needs a hook surface
- Delete: `web/src/components/reactions.tsx` + `reactions.test.tsx` (via normal file deletion — never `rm -rf` a directory)
- Test: `web/src/components/home/send-pulse.test.tsx`

**Interfaces:**
- Produces: `SendPulse`; `ArchitectureDiagram` gains an optional prop to trigger/animate one traversal.

- [ ] **Step 1: failing test** — `send-pulse.test.tsx`: renders one button with an accessible name; clicking calls the hub send; when the send resolves, a measured duration is rendered (mock `performance.now`/the hub so the number is deterministic) and announced in a live region; under `prefers-reduced-motion` no traversal animation is scheduled (assert the static path); the button is disabled/busy while in flight and re-enabled after.
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement `send-pulse.tsx`** — a single primary (signal) button "Send a pulse" (pt-BR "Enviar um pulso"), ≥44px:
  - On click: `t0 = performance.now()`; invoke the hub's send (reuse the existing `react(...)` surface from `usePulseHub`, passing ONE fixed allow-listed payload — pick one, e.g. `⚡`-equivalent from the server allow-list, and centralize it as a `PULSE_PAYLOAD` const); when the invoke promise resolves, `rtt = Math.round(performance.now() - t0)`.
  - Render the result truthfully: e.g. "38 ms · client → API → back" (localized), plus, if known, how many are online right now ("seen by N people here") — using the EXISTING presence count, not an invented number.
  - Trigger ONE traversal animation on the architecture diagram (see Step 4). Under reduced motion, skip the animation and just show the result.
  - Handle failure (offline/rate-limited): show a neutral, honest state ("couldn't reach the server") — never a fake time. Keep the button usable afterwards.
  - Rate-limit friendliness: disable while in flight; ignore rapid re-clicks.
- [ ] **Step 4: diagram traversal** — give `ArchitectureDiagram` an optional way to play one traversal (e.g. a `traversalKey`/`playing` prop or an imperative handle); on a pulse, the signal visibly travels `Web → API → …` once. Keep the existing ambient behavior otherwise; respect reduced motion.
- [ ] **Step 5: host it** — put `SendPulse` in `engineering-showcase.tsx` **next to the diagram** (the diagram explains the pipeline; the button proves it). Remove the docked `Reactions` from `routes/index.tsx`; the live-proof block keeps map + stats + feed.
- [ ] **Step 6: event labels** — pulses arrive as reaction events; render them as "pulse" in the event feed (update `dashboard:eventFeed.reaction` copy/key to pulse wording, en + pt-BR, keeping key parity). Delete `reactions.tsx`/its test and any now-orphaned i18n keys (`dashboard:reactions.*`).
- [ ] **Step 7:** gate → PASS. **Commit** — `feat(web): "send a pulse" replaces emoji reactions`

---

### Task 2: Ask chips on the home

**Files:**
- Modify: `web/src/stores/ask-widget-store.ts` (open with a pending question), `web/src/components/ask/ask-widget.tsx` (consume the pending question), `web/src/routes/index.tsx` or the live-proof/showcase area (render the chips), `web/src/i18n/locales/{en,pt-BR}/ask.json` (reuse the existing `ask:suggestions.*` keys)
- Test: `web/src/components/ask/ask-chips.test.tsx` (or extend the existing integration test)

- [ ] **Step 1: failing test** — clicking a chip on the home opens the Ask widget AND the chosen question is submitted (assert the widget shows the question as the user message / the send path was called with it); the store's `open()` without a question still works (no regression to the hero CTA / floating trigger).
- [ ] **Step 2: run** → FAIL.
- [ ] **Step 3: implement** — extend the store: `open(question?: string)` setting `pendingQuestion`; `ask-widget.tsx` picks up `pendingQuestion` on open, submits it once, and clears it (guard against double-submit and against submitting while a stream is in flight). Render 3 chips (reuse `ask:suggestions.kubernetes/stack/remote` — the same questions the widget already offers) as `Chip`-styled buttons in a single row on the home, under the live-proof block or the showcase; mobile: one row, wraps, ≥44px targets.
- [ ] **Step 4:** gate → PASS. **Commit** — `feat(web): ask chips on the home open the AI chat pre-filled`

---

### Task 3: Polish + verification

- [ ] **Step 1:** verify the home reads coherently after the swap: showcase (diagram + pulse) → live proof (map + stats + feed) → ask chips; nothing orphaned (no leftover reaction imports, keys, or CSS).
- [ ] **Step 2: mobile** (375px): the pulse button and the chips are single-row, ≥44px, no overlap with the floating Ask trigger; the result text wraps cleanly.
- [ ] **Step 3: a11y** — accessible names, live-region announcement of the pulse result, keyboard operation of chips + button, reduced-motion honored, one `<h1>`.
- [ ] **Step 4: full gate** — build + tsc + test; paste output tails in the report.
- [ ] **Step 5: Commit** — `chore(web): polish pulse + ask chips`

---

## Self-Review

**Coverage:** replaces reactions with a demonstration that reuses the real pipeline ✓(T1) · honest measured latency, no fabricated numbers ✓(T1, constraint) · zero backend change ✓(grounded in `Clients.All` + invoke ack) · mobile-first single controls ✓(T1/T2/T3) · recruiter conversion path ✓(T2) · cleanup of the removed feature ✓(T1 step 6, T3 step 1).

**Placeholder scan:** the payload const, the store signature, the label wording, and every test target are concrete; visual execution follows the established signal language.

**Type consistency:** `PULSE_PAYLOAD` is one const consumed by `SendPulse`; `useAskWidgetStore.open(question?)` is the single extension consumed by the chips and the existing CTAs (optional arg keeps them source-compatible).
