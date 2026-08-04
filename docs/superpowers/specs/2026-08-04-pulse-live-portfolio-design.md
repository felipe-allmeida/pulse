# Pulse — Live Portfolio Flagship — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-04
- **Author:** Felipe de Almeida (pair-designed with Claude)
- **Codename:** `pulse` (working name — the live pulse of visitors; renamable)
- **Repo:** `/Users/felipe/dev/pulse` (new public repo, independent of work code)

---

## 1. Purpose & positioning

`pulse` is a **reference project**: a real-time distributed system demonstrating production-grade engineering — event-driven design, observability, infrastructure-as-code, and a real live deployment. It is designed to live on a portfolio page, where its *surface* is the real-time experience a visitor gets the moment they open the page, and its *interior* is a legitimate architecture worth walking through in detail: distributed systems, event-driven design, observability, IaC, and a real live deployment.

The key insight: **the flagship is not a link to a separate demo — the real-time experience happens on the portfolio page itself.** Custom, memorable, and every visible feature is backed by legitimate architecture that carries an engineering story.

This spec covers the flagship system itself — the live real-time reference system, deployed on Hetzner. Any surrounding presentation (e.g., the portfolio site that hosts it) is out of scope here.

---

## 2. What the visitor sees (the surface)

On opening the portfolio page, in real time:
- **Live presence** — cursors/avatars of anyone else currently viewing, plus a live visitor counter.
- **Ephemeral reactions** — visitors drop emoji/reactions that everyone currently on the page sees float in real time.
- **Persistent canvas / reactions wall** — a shared board where visitors can leave a mark/note that persists for later visitors (moderated, rate-limited, sanitized).
- **Live world map** — coarse geo pings showing where current/recent visitors are connecting from.
- **Public live metrics** — a shared, public widget showing the system's own telemetry (active connections, messages/sec, visits) — the "cool" thing is *also* a live observability demo.
- **Public geo audit feed** — an anonymized feed: *"someone from Lisbon, PT just visited"* — shareable/public.

---

## 3. Architecture

Single deployable footprint on **one Hetzner box** via **Portainer** (modular monolith + worker — deliberately *not* a microservice zoo). Horizontally scalable where it counts (Redis backplane) so the scaling story is real without operational sprawl.

### Components (each with one clear responsibility)

| Component | Responsibility | Depends on | Stack |
|---|---|---|---|
| **Web** | Portfolio page hosting the live surface (presence, reactions, canvas, world map, public metrics). Static-first, progressively enhanced by the realtime connection. | Realtime API (WS), public metrics endpoint | React + Vite + TypeScript |
| **Realtime API** | WebSocket connections, presence tracking, broadcast of reactions/canvas ops; emits domain events. Stateless (presence state externalized to Redis). | Redis, Broker, Postgres | .NET + SignalR |
| **Redis** | Presence/backplane: pub/sub for horizontal scale + ephemeral presence & connection registry. | — | Redis |
| **Postgres** | Durable store: persistent canvas, visit audit log (coarse geo), aggregate metrics. | — | Postgres |
| **Worker** | Consumes events → enriches geo (IP → country/city) → writes audit + updates aggregates → prunes ephemeral data. | Broker, Postgres, geo lookup | .NET BackgroundService |
| **Broker** | Event backbone with **EF transactional outbox** (established pattern). | Postgres (outbox) | RabbitMQ |
| **Observability** | OpenTelemetry traces/metrics/logs across all services; public metrics endpoint reads aggregates. | — | OpenTelemetry |
| **Infra / IaC** | Terraform provisions Hetzner server + firewall + DNS; Portainer stack (compose) deploys containers; TLS via reverse proxy (Traefik or Caddy) + Let's Encrypt. | Hetzner, Portainer | Terraform |
| **CI/CD** | GitHub Actions: run tests → build images → push to GHCR → deploy to Portainer (stack webhook/API). | GHCR, Portainer | GitHub Actions |
| **Docs** | `README` + `/architecture` page with C4 + mermaid diagrams + ADRs explaining the "why". | — | Markdown |

### Data flow
```
Visitor opens page
  → WS connect to Realtime API
  → presence registered in Redis, broadcast to other viewers
  → visit event published (outbox, same tx)
  → RabbitMQ
  → Worker: geo-enrich (IP → country/city), write audit + update aggregates in Postgres
  → world-map & public-metrics widgets read aggregates (API)
  → public surface updates in real time
```

### Isolation & interfaces
Each component is understandable and testable in isolation:
- **Realtime API** exposes a WS contract (hub methods + events) and a small REST surface (public metrics/audit reads). No direct DB coupling for presence — Redis is the boundary.
- **Worker** consumes a versioned event contract from the broker; it never talks to WS clients directly.
- **Web** depends only on the WS contract + public read endpoints — swappable backend internals.

---

## 4. Privacy & security (first-class, GDPR-friendly by design)

Privacy is a **selling feature** here, not an afterthought — privacy-by-design signals engineering maturity.

- **Coarse geo only**: country/city derived from IP. **Never** display raw IP or any PII on the public surface. Public feed is anonymized (*"someone from Lisbon, PT"*).
- **Canvas & reactions**: rate-limited per connection/IP, input sanitized (anti-XSS), size caps, and a moderation/clear capability.
- **No secrets in the repo**: config via Portainer secrets/env; `.env` gitignored.
- **TLS everywhere** via the reverse proxy + Let's Encrypt.
- **Data retention**: ephemeral presence expires; audit rows are coarse and prunable; document retention in an ADR.
- **Abuse resistance**: connection caps, backpressure, and graceful rejection under load.

---

## 5. Resilience & error handling

- **Graceful WS reconnect** with backoff; presence self-heals from Redis on reconnect.
- **Degradation**: if Redis or the broker is down, the page still loads statically and the realtime layer reconnects when healthy — no hard failure of the portfolio.
- **Idempotent event handlers** in the Worker (safe redelivery).
- **Health checks** on every container; the reverse proxy routes only to healthy instances.

---

## 6. Testing strategy

- **Unit** (xUnit) — presence logic, event handling, geo enrichment, sanitization.
- **Integration** (Testcontainers) — Postgres + Redis + RabbitMQ spun up per run; end-to-end event flow (connect → visit event → audit written → aggregate updated).
- **CI-gated** — tests must pass before images build; green badges visible in the README.

---

## 7. Phasing (YAGNI — ship something *live* early)

- **Phase 1 — Flagship MVP, deployed.** Presence + live world map + public metrics, live on Hetzner with IaC + CI/CD + OTel + tests. Impressive on its own.
- **Phase 2 — Social depth.** Persistent canvas / reactions wall + public geo audit feed.
- **Phase 3 — Story polish.** `/architecture` page + ADRs + visual polish.

Each phase is independently shippable; a polished deployed Phase 1 beats a sprawling half-done everything.

---

## 8. Open decisions (resolve during planning)
- **Reverse proxy:** Traefik vs Caddy (both fine; Caddy = simpler TLS, Traefik = more "production" signal).
- **Web framework:** Vite SPA vs Next — leaning Vite SPA (static-first, cheap to host); revisit if SSR/SEO for the portfolio matters.
- **Geo lookup:** offline DB (MaxMind GeoLite2) vs API — leaning offline DB (no per-request external dependency, better privacy).
- **Final name:** `pulse` is a working codename.
- **OTel backend:** self-hosted lightweight viewer vs reuse existing observability stack vs public metrics straight from Postgres aggregates.

---

## 9. Success criteria
- A visitor opening the portfolio immediately sees a live, custom, real-time experience.
- The repo tells a coherent, production-grade engineering story: distributed real-time, event-driven, observability, IaC, live deploy, tests, ADRs.
- Everything runs live on a Hetzner box via Portainer, reproducible from Terraform + CI/CD.
- Privacy-by-design is visible and defensible.
