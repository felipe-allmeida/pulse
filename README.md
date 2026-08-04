# Pulse

[![CI](https://github.com/felipe-allmeida/pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/felipe-allmeida/pulse/actions/workflows/ci.yml)
[![Deploy](https://github.com/felipe-allmeida/pulse/actions/workflows/deploy.yml/badge.svg)](https://github.com/felipe-allmeida/pulse/actions/workflows/deploy.yml)

Live, real-time portfolio system: a .NET 10 API + worker backend and a React/Vite
frontend, deployed as containers behind Caddy on a Hetzner VM managed via Portainer.

## CI/CD

- **`.github/workflows/ci.yml`** — runs on every pull request and on pushes to
  `main`. Two independent jobs:
  - `backend` — `dotnet restore` / `build` / `test` for `Pulse.sln` on
    `ubuntu-latest` (Testcontainers-based integration tests need the Docker
    daemon that runner provides), plus a `dotnet list package --vulnerable
    --include-transitive` guard that fails the build if any advisory shows up.
  - `frontend` — `pnpm -C web install --frozen-lockfile`, `pnpm -C web build`,
    and `pnpm -C web exec tsc --noEmit` for the Vite/React app.
- **`.github/workflows/deploy.yml`** — runs on push to `main` (and manually via
  `workflow_dispatch`). Builds `deploy/Dockerfile.{api,worker,web}`, pushes each
  to GHCR as `ghcr.io/<owner>/pulse-{api,worker,web}` tagged with both the
  commit SHA and `latest`, then calls the Portainer stack webhook so the stack
  redeploys with the new images.

### Repo secrets the owner must configure

| Secret | Required for | Notes |
|---|---|---|
| `PORTAINER_WEBHOOK` | `deploy.yml` → redeploy trigger | Portainer stack webhook URL (Stacks → pulse → Webhook). If unset, the redeploy step logs a message and no-ops instead of failing. |

`GITHUB_TOKEN` (pushing images to GHCR) is provided automatically by GitHub
Actions — no manual setup needed, it just needs the `packages: write`
permission that `deploy.yml` already declares.
