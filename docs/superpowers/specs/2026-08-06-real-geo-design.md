# Pulse — Real Visitor Geolocation (DB-IP Lite + real client IP) — Design Spec

- **Status:** Approved design, pending implementation plan
- **Date:** 2026-08-06
- **Scope:** Replace the demo geo fallback with REAL visitor locations in production, using a free local IP→city database (DB-IP Lite) and by making the real client IP survive the NPM → Caddy → API proxy chain. Small backend + Caddy config + a web attribution line; the rest is ops (mounting the DB). No change to the geo-resolution logic itself.

---

## 1. Purpose

Today the live map shows fabricated cities (Lisbon, São Paulo, London…) because the API runs with `DemoGeoLocator` — a round-robin fallback used when no geo database is configured; it ignores the visitor's IP entirely. In production we want the map to show **where visitors actually connect from**. Two things are missing: (1) a real geo database, and (2) the real client IP reaching the API (behind two proxies it currently doesn't). This spec delivers both while keeping the "privacy by design" story intact — the IP is resolved **locally** and never leaves the box.

---

## 2. Decisions (locked)

- **Database: DB-IP IP-to-City Lite** (free, no account, monthly, CC-BY 4.0), in **MMDB** format. It's read by the existing `MaxMind.GeoIP2.DatabaseReader` — **the `GeoLocator` code is unchanged** (drop-in). Chosen over MaxMind GeoLite2 to avoid the account/license-key friction; the tradeoff is a required attribution line. Swappable later (same format).
- **Attribution:** a small, unobtrusive **"IP data by DB-IP"** link (→ https://db-ip.com) satisfying CC-BY 4.0, placed near the live map / in the site footer.
- **Real client IP:** fix the `ForwardedHeaders` handling so the API resolves the true visitor IP across the **NPM → Caddy → API** chain (two proxies), and configure **Caddy** to preserve/forward the client's `X-Forwarded-For`. Correctness is proven by an integration test, not by prose.
- **Production disables the demo:** `Geo:DemoFallback=false` + `Geo:DbPath` set → real `GeoLocator`. Local dev / clones with no DB keep the demo fallback (unchanged) so the map still comes alive out of the box.
- **The DB file is never committed** (licensed data) — it's mounted into the `pulse-api` container as a volume, documented in the deploy runbook.
- **Privacy preserved:** the raw IP stays a transient lookup input, resolved locally; the `VisitStarted` event still carries no IP (unchanged). No third-party geo API.

---

## 3. Architecture

```
Visitor → NPM (TLS, adds XFF: <visitor>) → Caddy/pulse-web (trusts NPM, forwards XFF)
        → pulse-api (ForwardedHeaders resolves RemoteIpAddress = <visitor>)
        → PresenceHub: geoLocator.Locate(<visitor>) → DB-IP Lite MMDB → real city
```

### 3.1 Real client IP (backend — `src/Pulse.Api/Program.cs`)
The current `ForwardedHeadersOptions` clears `KnownProxies`/`KnownNetworks` and leaves `ForwardLimit` at its default (1) — with **two** proxies now in front (NPM + Caddy) that does not reliably yield the visitor's IP. Reconfigure so the API trusts the two private-network proxy hops and walks the `X-Forwarded-For` chain back to the real client:
- Trust the container/private network ranges (the docker bridge where NPM + Caddy sit) via `KnownNetworks` (e.g. `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) — or the specific proxy addresses.
- Set `ForwardLimit = 2` (NPM + Caddy).
- Keep `XForwardedFor | XForwardedProto`.

The exact combination is **driven by an integration test** (see §5): a request carrying `X-Forwarded-For: <public-client>, <caddy-hop>` (two entries) must resolve `HttpContext.Connection.RemoteIpAddress` to `<public-client>`. `PresenceHub.OnConnectedAsync` and the rate limiter already read `RemoteIpAddress`, so nothing downstream changes.

### 3.2 Caddy forwards the real client (`deploy/Caddyfile`)
Caddy sits behind NPM. Add a `trusted_proxies` directive (e.g. `trusted_proxies static private_ranges`) so Caddy trusts NPM's `X-Forwarded-For` and forwards the visitor IP onward (rather than replacing it with NPM's address). Applies to the `/api/*`, `/hub/*`, `/health` reverse-proxy handlers. Configurable so local `docker compose up` (single Caddy, no NPM) still works.

### 3.3 Geo resolution (unchanged)
`GeoLocator.Locate(ip)` already reads `reader.City(ip)` → country/city/lat-lon. DB-IP Lite's City MMDB is GeoIP2-City-compatible, so **no code change**. The DI factory in `Program.cs` already selects `GeoLocator` when `Geo:DbPath` points at an existing file (else demo/null) — no change needed there either.

### 3.4 Attribution (web)
A small `"IP data by DB-IP"` link (new tab, `rel="noreferrer"`), localized via the existing i18n (`common`/`dashboard` namespace — en + pt-BR), placed under the live map or in a shared footer. Satisfies CC-BY 4.0.

---

## 4. Ops (Felipe, documented in the deploy runbook / README)

1. Download `dbip-city-lite-YYYY-MM.mmdb` from https://db-ip.com/db/download/ip-to-city-lite (free, no account).
2. Put it on the box (e.g. `/opt/pulse/geo/dbip-city-lite.mmdb`) and mount it into `pulse-api` — add to `deploy/compose.prod.yml` (documented/commented) a volume `- ${GEO_DB_HOST_PATH}:/geo/city.mmdb:ro` and env `Geo__DbPath=/geo/city.mmdb`, `Geo__DemoFallback=false`.
3. Redeploy the stack. The API boots, finds the DB, and resolves real geo. (No DB / bad path → demo or Unknown per config — the app never crashes on a missing DB, matching the current lazy-factory behavior.)
4. Refresh monthly (drop in the new file, redeploy) — optional; stale geo just drifts slightly.

`deploy/compose.prod.yml` gets the commented volume+env block so the mount is copy-paste, and the runbook documents the download + monthly refresh.

---

## 5. Testing

- **Backend integration test (the correctness gate for the IP fix):** using the existing `WebApplicationFactory`, issue a request with a two-hop `X-Forwarded-For` (`<public>, <private-hop>`) to an endpoint whose behavior reflects the resolved client IP (the rate-limiter partition, or a minimal test-only echo of `RemoteIpAddress`), and assert the resolved IP is `<public>`. A single-hop and a spoof case (untrusted → not blindly accepted) round it out.
- **Geo drop-in check:** a unit test that `GeoLocator` over a **tiny committed test MMDB fixture** (a synthetic City MMDB built for the test — NOT the licensed DB-IP file) resolves a known IP to the expected city, proving the reader path. If building a fixture is impractical, cover `GeoLocator`'s error path (bad IP → "Unknown") and rely on the integration test for the IP plumbing, and note the DB-swap is verified manually on the box.
- **Web:** the attribution link renders, points to db-ip.com, opens in a new tab with `rel="noreferrer"`, and is localized (en + pt-BR).
- **Hard gate:** `dotnet build` + `dotnet test` green (check `pgrep -f "dotnet test"` first — shared machine); `pnpm -C web build` + `tsc` + `pnpm -C web test` green.
- **Live smoke (Felipe, after deploy):** load the site from a real connection → the map shows your actual city; `/api/map` returns real locations; a couple of visits from different networks land in different places.

---

## 6. Scope (YAGNI)

**In:** the ForwardedHeaders/`ForwardLimit` fix + Caddy `trusted_proxies`; the CC-BY attribution (localized); the documented compose mount + runbook for the DB; tests. **Out:** committing/auto-downloading the geo DB, an auto-updater for the monthly refresh, switching to a geo API, ASN/ISP data, per-visit IP storage (still never stored), IPv6-specific handling beyond what the DB provides, and any change to the geo-resolution logic or the demo fallback.

---

## 7. Success criteria

- In production the live map shows **real** visitor cities (the demo spread is gone; `Geo:DemoFallback=false` + a real DB).
- The API resolves the true visitor IP through NPM → Caddy (proven by the integration test), so geo + the per-IP rate limit are correct.
- The IP is resolved locally and never leaves the box; `VisitStarted` still has no IP field — privacy story intact.
- The DB-IP CC-BY attribution is present and localized.
- No account/license-key dependency; the DB is a free, no-account, drop-in file, and the app degrades safely if it's absent.
- All hard-gate checks green.
