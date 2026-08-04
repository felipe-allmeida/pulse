# Pulse — Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a live, deployed real-time "presence" system on the portfolio — visitors see each other online, a live world map, and public system metrics — backed by an event-driven .NET + React architecture running on Hetzner via Portainer.

**Architecture:** Modular monolith + worker on a single box. A .NET SignalR API tracks presence (Redis backplane) and emits visit events through an EF transactional outbox to RabbitMQ; a .NET Worker geo-enriches visits and writes coarse audit + aggregates to Postgres; a React/Vite SPA renders the live surface. OpenTelemetry across all services. Terraform provisions the box; Portainer runs the compose stack; GitHub Actions builds and deploys.

**Tech Stack:** .NET 10, C#, SignalR, MassTransit (EF outbox, `IConsumer` + auto-discovery pattern), EF Core + Postgres (snake_case), Redis, RabbitMQ, MaxMind GeoLite2, OpenTelemetry, React 19 + Vite + TypeScript, Docker, Caddy (reverse proxy + TLS), Terraform (Hetzner), GitHub Actions, Testcontainers, xUnit.

## Global Constraints

- **.NET 10** (latest stable) — `global.json` pins the SDK; do not target .NET 8.
- **React 19** (latest stable), **Vite**, **TypeScript strict**.
- **Central package management** — versions in `Directory.Packages.props`; projects reference without versions.
- **EF Core snake_case** via `UseSnakeCaseNamingConvention()` — no manual `.ToTable()`/`.HasColumnName()`.
- **Migrations only via `dotnet ef migrations add`** — never hand-write migration `.cs`/`.Designer.cs`/snapshot files.
- **Event ordering** — always `publish.Publish(...)` **before** `SaveChangesAsync` so the outbox insert joins the same transaction.
- **No secrets in the repo** — config via env / Portainer secrets; `.env` is gitignored.
- **Privacy** — coarse geo (country/city) only; never persist or expose raw IP or PII. Store only a salted **hash** of IP for dedupe/rate-limiting.
- **Namespaces** rooted at `Pulse`.

---

## File Structure

```
pulse/
  global.json
  Directory.Build.props
  Directory.Packages.props
  Pulse.sln
  src/
    Pulse.Domain/                 # entities, events, value objects (no infra deps)
      Events/VisitStarted.cs
      Audit/VisitAudit.cs
      Geo/GeoResult.cs
    Pulse.Persistence/            # EF Core, DbContext, migrations, outbox config
      PulseDbContext.cs
      Configurations/VisitAuditConfiguration.cs
      Migrations/
    Pulse.Api/                    # SignalR hub + geo + public REST reads + OTel + DI
      Program.cs
      Realtime/PresenceHub.cs
      Realtime/PresenceTracker.cs
      Realtime/Dtos.cs
      Geo/GeoLocator.cs           # geo resolved API-side (IP stays here, never in messages)
      Endpoints/MetricsEndpoints.cs
      Endpoints/MapEndpoints.cs
    Pulse.Worker/                 # MassTransit consumer (writes audit from event's geo)
      Program.cs
      Consumers/VisitStartedConsumer.cs
  tests/
    Pulse.Tests.Unit/
    Pulse.Tests.Integration/      # Testcontainers: Postgres + Redis + RabbitMQ
  web/                            # React 19 + Vite SPA
    package.json
    src/lib/connection.ts
    src/components/PresenceLayer.tsx
    src/components/WorldMap.tsx
    src/components/LiveMetrics.tsx
  deploy/
    Dockerfile.api
    Dockerfile.worker
    Dockerfile.web
    compose.yml                   # Portainer stack
    Caddyfile
  infra/
    main.tf  variables.tf  outputs.tf
  .github/workflows/
    ci.yml
    deploy.yml
```

**Interfaces locked across tasks (authoritative names/types):**
- `Pulse.Domain.Events.VisitStarted(Guid VisitId, string ConnectionId, string Country, string City, double Lat, double Lon, DateTimeOffset OccurredAt)` — record, MassTransit message. **Geo is resolved API-side and carried in the event; the raw IP never enters the message, outbox, or broker** (privacy constraint). No IP or IP hash on the wire.
- `Pulse.Domain.Geo.GeoResult(string Country, string City, double Lat, double Lon)` — record.
- `Pulse.Domain.Audit.VisitAudit { Guid Id; string Country; string City; double Lat; double Lon; DateTimeOffset OccurredAt; }`
- `IGeoLocator.Locate(string ip) : GeoResult` (returns `GeoResult("Unknown","Unknown",0,0)` on miss) — **lives in `Pulse.Api.Geo`**, called only inside the API where the transient IP already exists.
- `IPresenceTracker` (self-healing, TTL-based — amended 2026-08-04) — `Task<int> JoinAsync(string connectionId)`, `Task<int> HeartbeatAsync(string connectionId)`, `Task<int> LeaveAsync(string connectionId)`, `Task<int> CountAsync()`, `Task ClearAsync()`. Backed by a Redis **sorted set** `pulse:presence` (member=connectionId, score=last-seen unix ms); every read prunes members older than the TTL (default 30s), so ungraceful disconnects self-heal. Clients heartbeat periodically; the API clears the set on startup.
- `IReactionRateLimiter` — `Task<bool> AllowAsync(string connectionId)` (Redis INCR+EXPIRE sliding window; default 5 reactions / 5s per connection).
- `PresenceHub` — client events: `PresenceUpdated(int count)`, `ReactionReceived(ReactionDto dto)`; hub methods: `React(string emoji)` (allow-list validated + rate-limited), `Heartbeat()` (refreshes presence).
- REST: `GET /api/metrics → MetricsDto(int ActiveConnections, long TotalVisits)`; `GET /api/map → GeoPointDto[]` where `GeoPointDto(double Lat, double Lon, string City, string Country, DateTimeOffset At)`.

---

## Phase 1 — Deployed MVP

### Task 1: Solution scaffold + central config

**Files:**
- Create: `global.json`, `Directory.Build.props`, `Directory.Packages.props`, `Pulse.sln`
- Create empty projects: `Pulse.Domain`, `Pulse.Persistence`, `Pulse.Api`, `Pulse.Worker`, `tests/Pulse.Tests.Unit`, `tests/Pulse.Tests.Integration`

**Interfaces:**
- Produces: the solution + project graph every later task builds on.

- [ ] **Step 1:** Pin the SDK — `global.json`:

```json
{ "sdk": { "version": "10.0.100", "rollForward": "latestFeature" } }
```

- [ ] **Step 2:** Enable central package management — `Directory.Packages.props`:

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="10.0.0" />
    <PackageVersion Include="MassTransit" Version="8.3.6" />
    <PackageVersion Include="MassTransit.RabbitMQ" Version="8.3.6" />
    <PackageVersion Include="MassTransit.EntityFrameworkCore" Version="8.3.6" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0" />
    <PackageVersion Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
    <PackageVersion Include="EFCore.NamingConventions" Version="10.0.0" />
    <PackageVersion Include="StackExchange.Redis" Version="2.8.16" />
    <PackageVersion Include="MaxMind.GeoIP2" Version="5.2.0" />
    <PackageVersion Include="OpenTelemetry.Extensions.Hosting" Version="1.10.0" />
    <PackageVersion Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.10.0" />
    <PackageVersion Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.10.0" />
    <PackageVersion Include="xunit" Version="2.9.2" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.2" />
    <PackageVersion Include="Testcontainers.PostgreSql" Version="4.1.0" />
    <PackageVersion Include="Testcontainers.Redis" Version="4.1.0" />
    <PackageVersion Include="Testcontainers.RabbitMq" Version="4.1.0" />
    <PackageVersion Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.0.0" />
  </ItemGroup>
</Project>
```

- [ ] **Step 3:** `Directory.Build.props` — shared settings:

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>
  </PropertyGroup>
</Project>
```

- [ ] **Step 4:** Create projects + solution:

```bash
cd /Users/felipe/dev/pulse
dotnet new classlib -o src/Pulse.Domain
dotnet new classlib -o src/Pulse.Persistence
dotnet new web -o src/Pulse.Api
dotnet new worker -o src/Pulse.Worker
dotnet new xunit -o tests/Pulse.Tests.Unit
dotnet new xunit -o tests/Pulse.Tests.Integration
dotnet new sln
dotnet sln add (Get-ChildItem -r *.csproj) 2>/dev/null || dotnet sln add $(find . -name "*.csproj")
dotnet add src/Pulse.Persistence reference src/Pulse.Domain
dotnet add src/Pulse.Api reference src/Pulse.Persistence src/Pulse.Domain
dotnet add src/Pulse.Worker reference src/Pulse.Persistence src/Pulse.Domain
dotnet add tests/Pulse.Tests.Unit reference src/Pulse.Domain src/Pulse.Persistence
dotnet add tests/Pulse.Tests.Integration reference src/Pulse.Api src/Pulse.Worker
```

- [ ] **Step 5:** Verify: `dotnet build` → succeeds. Commit:

```bash
git add -A && git commit -m "chore: scaffold pulse solution with central package management"
```

---

### Task 2: Domain — `VisitStarted` event, `VisitAudit`, `GeoResult`

**Files:**
- Create: `src/Pulse.Domain/Events/VisitStarted.cs`, `src/Pulse.Domain/Audit/VisitAudit.cs`, `src/Pulse.Domain/Geo/GeoResult.cs`
- Test: `tests/Pulse.Tests.Unit/VisitAuditTests.cs`

**Interfaces:**
- Produces: `VisitStarted`, `VisitAudit`, `GeoResult` (signatures in the locked-interfaces block above).

- [ ] **Step 1: Write the failing test** — `VisitAuditTests.cs`:

```csharp
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;

public class VisitAuditTests
{
    [Fact]
    public void FromGeo_MapsCoarseLocationOnly()
    {
        var geo = new GeoResult("Portugal", "Lisbon", 38.72, -9.13);
        var at = DateTimeOffset.Parse("2026-08-04T10:00:00Z");

        var audit = VisitAudit.FromGeo(Guid.Parse("00000000-0000-0000-0000-000000000001"), geo, at);

        Assert.Equal("Portugal", audit.Country);
        Assert.Equal("Lisbon", audit.City);
        Assert.Equal(38.72, audit.Lat);
        Assert.Equal(at, audit.OccurredAt);
    }
}
```

- [ ] **Step 2: Run to verify it fails** — `dotnet test tests/Pulse.Tests.Unit` → FAIL (types not defined).
- [ ] **Step 3: Implement**:

```csharp
// Events/VisitStarted.cs — geo resolved API-side; no IP on the wire (privacy constraint)
namespace Pulse.Domain.Events;
public sealed record VisitStarted(
    Guid VisitId, string ConnectionId,
    string Country, string City, double Lat, double Lon,
    DateTimeOffset OccurredAt);

// Geo/GeoResult.cs
namespace Pulse.Domain.Geo;
public sealed record GeoResult(string Country, string City, double Lat, double Lon);

// Audit/VisitAudit.cs
using Pulse.Domain.Geo;
namespace Pulse.Domain.Audit;
public sealed class VisitAudit
{
    public Guid Id { get; private set; }
    public string Country { get; private set; } = "Unknown";
    public string City { get; private set; } = "Unknown";
    public double Lat { get; private set; }
    public double Lon { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }

    private VisitAudit() { }
    public static VisitAudit FromGeo(Guid id, GeoResult geo, DateTimeOffset at) => new()
    { Id = id, Country = geo.Country, City = geo.City, Lat = geo.Lat, Lon = geo.Lon, OccurredAt = at };
}
```

- [ ] **Step 4: Run to verify it passes** — `dotnet test tests/Pulse.Tests.Unit` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: domain event, geo result, and visit audit"`

---

### Task 3: Persistence — DbContext, snake_case, `VisitAudit` config, outbox + first migration

**Files:**
- Create: `src/Pulse.Persistence/PulseDbContext.cs`, `Configurations/VisitAuditConfiguration.cs`
- Test: `tests/Pulse.Tests.Integration/PersistenceTests.cs` (Testcontainers Postgres)

**Interfaces:**
- Consumes: `VisitAudit` (Task 2).
- Produces: `PulseDbContext` with `DbSet<VisitAudit> VisitAudits` + MassTransit outbox tables.

- [ ] **Step 1: Write the failing integration test** — spins up Postgres, migrates, round-trips a `VisitAudit`:

```csharp
using Testcontainers.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;
using Pulse.Persistence;

public class PersistenceTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    public Task InitializeAsync() => _pg.StartAsync();
    public Task DisposeAsync() => _pg.DisposeAsync().AsTask();

    [Fact]
    public async Task CanPersistAndReadVisitAudit()
    {
        var opts = new DbContextOptionsBuilder<PulseDbContext>()
            .UseNpgsql(_pg.GetConnectionString()).UseSnakeCaseNamingConvention().Options;
        await using var ctx = new PulseDbContext(opts);
        await ctx.Database.MigrateAsync();

        ctx.VisitAudits.Add(VisitAudit.FromGeo(Guid.NewGuid(),
            new GeoResult("Portugal", "Lisbon", 38.72, -9.13), DateTimeOffset.UtcNow));
        await ctx.SaveChangesAsync();

        Assert.Equal(1, await ctx.VisitAudits.CountAsync());
    }
}
```

- [ ] **Step 2: Run to verify it fails** — `dotnet test tests/Pulse.Tests.Integration` → FAIL (no `PulseDbContext`).
- [ ] **Step 3: Implement the DbContext**:

```csharp
using Microsoft.EntityFrameworkCore;
using Pulse.Domain.Audit;
namespace Pulse.Persistence;
public class PulseDbContext(DbContextOptions<PulseDbContext> options) : DbContext(options)
{
    public DbSet<VisitAudit> VisitAudits => Set<VisitAudit>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<VisitAudit>().HasKey(x => x.Id);
        // MassTransit outbox tables added in Task 6 registration.
        base.OnModelCreating(b);
    }
}
```

- [ ] **Step 4: Generate the migration** (never hand-write it):

```bash
dotnet ef migrations add InitialVisitAudit \
  --project src/Pulse.Persistence --startup-project src/Pulse.Api \
  --context PulseDbContext --output-dir Migrations
```

- [ ] **Step 5: Run to verify it passes** — `dotnet test tests/Pulse.Tests.Integration` → PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: PulseDbContext with snake_case and VisitAudit migration"`

---

### Task 4: Presence tracking over Redis + `PresenceHub`

**Files:**
- Create: `src/Pulse.Api/Realtime/PresenceTracker.cs`, `Realtime/ReactionRateLimiter.cs`, `Realtime/PresenceHub.cs`, `Realtime/Dtos.cs`
- Test: `tests/Pulse.Tests.Integration/PresenceTrackerTests.cs` (Testcontainers Redis)

**Interfaces:**
- Produces: `IPresenceTracker` (self-healing TTL sorted-set; `JoinAsync`/`HeartbeatAsync`/`LeaveAsync`/`CountAsync`/`ClearAsync`), `IReactionRateLimiter` (`AllowAsync`), `PresenceHub` (`React` allow-list+rate-limited, `Heartbeat`), `ReactionDto(string Emoji, DateTimeOffset At)`.
- **Design (amended 2026-08-04):** Redis sorted set `pulse:presence`, member=connectionId, score=last-seen unix ms. Reads prune members older than TTL (default 30s) so ungraceful disconnects self-heal. `React` accepts only an allow-listed emoji and is rate-limited (5/5s/connection via Redis INCR+EXPIRE). Determinism note: tests simulate a "stale" connection by directly `SortedSetAdd`-ing a member with an old score, then asserting `CountAsync` prunes it — **no sleeps** (keeps tests deterministic).

- [ ] **Step 1: Write the failing tests** — join/leave, dedup, self-healing prune, and rate limiting against a real Redis (deterministic, no sleeps):

```csharp
using Testcontainers.Redis;
using StackExchange.Redis;
using Pulse.Api.Realtime;

public class PresenceTrackerTests : IAsyncLifetime
{
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private ConnectionMultiplexer _mux = default!;
    public async Task InitializeAsync() { await _redis.StartAsync(); _mux = await ConnectionMultiplexer.ConnectAsync(_redis.GetConnectionString()); }
    public Task DisposeAsync() => _redis.DisposeAsync().AsTask();

    [Fact]
    public async Task JoinDedupAndLeave_TracksLiveCount()
    {
        var t = new PresenceTracker(_mux, TimeSpan.FromSeconds(30));
        Assert.Equal(1, await t.JoinAsync("c1"));
        Assert.Equal(2, await t.JoinAsync("c2"));
        Assert.Equal(2, await t.JoinAsync("c1"));   // dedup: same id doesn't double-count
        Assert.Equal(1, await t.LeaveAsync("c1"));
        Assert.Equal(0, await t.LeaveAsync("c2"));
    }

    [Fact]
    public async Task StaleConnection_IsPrunedOnRead()   // simulates an ungraceful disconnect
    {
        var t = new PresenceTracker(_mux, TimeSpan.FromSeconds(30));
        await t.JoinAsync("fresh");
        // directly insert a member last-seen 60s ago (older than the 30s TTL)
        var stale = DateTimeOffset.UtcNow.AddSeconds(-60).ToUnixTimeMilliseconds();
        await _mux.GetDatabase().SortedSetAddAsync("pulse:presence", "orphan", stale);
        Assert.Equal(1, await t.CountAsync());        // orphan pruned, only "fresh" remains
    }

    [Fact]
    public async Task Heartbeat_KeepsConnectionAlive()
    {
        var t = new PresenceTracker(_mux, TimeSpan.FromSeconds(30));
        await t.JoinAsync("c1");
        Assert.Equal(1, await t.HeartbeatAsync("c1"));  // refresh, still present
    }

    [Fact]
    public async Task RateLimiter_BlocksAfterLimit()
    {
        var rl = new ReactionRateLimiter(_mux);         // default 5 / 5s
        for (var i = 0; i < 5; i++) Assert.True(await rl.AllowAsync("c1"));
        Assert.False(await rl.AllowAsync("c1"));         // 6th blocked
    }
}
```

- [ ] **Step 2: Run to verify it fails** — FAIL (no `PresenceTracker`/`ReactionRateLimiter`).
- [ ] **Step 3: Implement** `Dtos.cs`, `PresenceTracker.cs` (TTL sorted-set, self-healing), `ReactionRateLimiter.cs`, and `PresenceHub.cs`:

```csharp
// Realtime/Dtos.cs
namespace Pulse.Api.Realtime;
public sealed record ReactionDto(string Emoji, DateTimeOffset At);

// Realtime/PresenceTracker.cs
using StackExchange.Redis;
namespace Pulse.Api.Realtime;
public interface IPresenceTracker
{
    Task<int> JoinAsync(string connectionId);
    Task<int> HeartbeatAsync(string connectionId);
    Task<int> LeaveAsync(string connectionId);
    Task<int> CountAsync();
    Task ClearAsync();
}
public sealed class PresenceTracker(IConnectionMultiplexer mux, TimeSpan? ttl = null) : IPresenceTracker
{
    private const string Key = "pulse:presence";
    private readonly TimeSpan _ttl = ttl ?? TimeSpan.FromSeconds(30);
    private IDatabase Db => mux.GetDatabase();

    public Task<int> JoinAsync(string id) => TouchAsync(id);
    public Task<int> HeartbeatAsync(string id) => TouchAsync(id);
    public async Task<int> LeaveAsync(string id) { await Db.SortedSetRemoveAsync(Key, id); return await PruneAndCountAsync(); }
    public Task<int> CountAsync() => PruneAndCountAsync();
    public Task ClearAsync() => Db.KeyDeleteAsync(Key);

    private async Task<int> TouchAsync(string id)
    {
        await Db.SortedSetAddAsync(Key, id, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        return await PruneAndCountAsync();
    }
    private async Task<int> PruneAndCountAsync()
    {
        var cutoff = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - _ttl.TotalMilliseconds;
        await Db.SortedSetRemoveRangeByScoreAsync(Key, double.NegativeInfinity, cutoff);
        return (int)await Db.SortedSetLengthAsync(Key);
    }
}

// Realtime/ReactionRateLimiter.cs
using StackExchange.Redis;
namespace Pulse.Api.Realtime;
public interface IReactionRateLimiter { Task<bool> AllowAsync(string connectionId); }
public sealed class ReactionRateLimiter(IConnectionMultiplexer mux) : IReactionRateLimiter
{
    private const int Limit = 5;
    private static readonly TimeSpan Window = TimeSpan.FromSeconds(5);
    public async Task<bool> AllowAsync(string connectionId)
    {
        var db = mux.GetDatabase();
        var key = (RedisKey)$"pulse:rl:react:{connectionId}";
        var n = await db.StringIncrementAsync(key);
        if (n == 1) await db.KeyExpireAsync(key, Window);
        return n <= Limit;
    }
}

// Realtime/PresenceHub.cs
using Microsoft.AspNetCore.SignalR;
namespace Pulse.Api.Realtime;
public sealed class PresenceHub(IPresenceTracker tracker, IReactionRateLimiter rateLimiter) : Hub
{
    // small curated allow-list — rejects arbitrary strings (anti-abuse / anti-XSS)
    private static readonly HashSet<string> Allowed = new() { "👋", "❤️", "🔥", "👏", "🎉", "🚀", "😮", "💯" };

    public override async Task OnConnectedAsync()
    {
        var count = await tracker.JoinAsync(Context.ConnectionId);
        await Clients.All.SendAsync("PresenceUpdated", count);
        await base.OnConnectedAsync();
    }
    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        var count = await tracker.LeaveAsync(Context.ConnectionId);
        await Clients.All.SendAsync("PresenceUpdated", count);
        await base.OnDisconnectedAsync(ex);
    }
    public Task Heartbeat() => tracker.HeartbeatAsync(Context.ConnectionId);
    public async Task React(string emoji)
    {
        if (!Allowed.Contains(emoji)) return;                            // reject non-allow-listed
        if (!await rateLimiter.AllowAsync(Context.ConnectionId)) return; // rate-limited
        await Clients.All.SendAsync("ReactionReceived", new ReactionDto(emoji, DateTimeOffset.UtcNow));
    }
}
```

- [ ] **Step 4: Run to verify it passes** — `dotnet test tests/Pulse.Tests.Integration` → PASS (4 presence tests + prior Postgres/Redis tests).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: self-healing TTL presence tracker, reaction rate limiter, validated hub"`

---

### Task 5: Wire API `Program.cs` — SignalR + Redis backplane + Postgres + OTel + endpoints host

**Files:**
- Modify: `src/Pulse.Api/Program.cs`
- Create: `src/Pulse.Api/appsettings.json`

**Interfaces:**
- Consumes: `PresenceHub`, `IPresenceTracker`, `PulseDbContext`.
- Produces: running host mapping `/hub/presence`, applying migrations on startup, OTel exporting via OTLP.

- [ ] **Step 1: Implement `Program.cs`**:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using OpenTelemetry.Trace; using OpenTelemetry.Metrics; using OpenTelemetry.Resources;
using Pulse.Api.Realtime; using Pulse.Persistence;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

builder.Services.AddDbContext<PulseDbContext>(o =>
    o.UseNpgsql(cfg.GetConnectionString("Postgres")).UseSnakeCaseNamingConvention());

var redis = ConnectionMultiplexer.Connect(cfg.GetConnectionString("Redis")!);
builder.Services.AddSingleton<IConnectionMultiplexer>(redis);
builder.Services.AddSingleton<IPresenceTracker>(sp => new PresenceTracker(
    sp.GetRequiredService<IConnectionMultiplexer>(),
    TimeSpan.FromSeconds(cfg.GetValue("Presence:TtlSeconds", 30))));
builder.Services.AddSingleton<IReactionRateLimiter, ReactionRateLimiter>();
builder.Services.AddSignalR().AddStackExchangeRedis(cfg.GetConnectionString("Redis")!);

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(cfg["Cors:Origins"]!.Split(',')).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("pulse-api"))
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddOtlpExporter());

var app = builder.Build();
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<PulseDbContext>().Database.MigrateAsync();
// presence self-heals via TTL, but clear the set on startup so a fresh deploy starts at 0
await app.Services.GetRequiredService<IPresenceTracker>().ClearAsync();

app.UseCors();
app.MapHub<PresenceHub>("/hub/presence");
app.MapGet("/health", () => Results.Ok("ok"));
app.Run();

public partial class Program { } // for WebApplicationFactory
```

- [ ] **Step 2:** `appsettings.json` with connection-string keys (`Postgres`, `Redis`), `Cors:Origins`, `OTEL_EXPORTER_OTLP_ENDPOINT` read from env.
- [ ] **Step 3: Verify** with an integration smoke test — `WebApplicationFactory<Program>` boots against Testcontainers Postgres+Redis and `GET /health` returns 200. Add `tests/Pulse.Tests.Integration/ApiSmokeTests.cs`.
- [ ] **Step 4: Run** — `dotnet test tests/Pulse.Tests.Integration` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: wire API host with SignalR, Redis backplane, EF, and OTel"`

---

### Task 6: Resolve geo in API, publish `VisitStarted` via outbox, Worker writes audit

**Privacy design (locked 2026-08-04):** the API resolves coarse geo from the transient request IP and puts **only** `Country/City/Lat/Lon` on the `VisitStarted` event. The raw IP never enters the message, the outbox table, or the broker. The Worker consumes an already-anonymized event.

**Files:**
- Create: `src/Pulse.Api/Geo/GeoLocator.cs`, `src/Pulse.Worker/Consumers/VisitStartedConsumer.cs`
- Modify: `src/Pulse.Api/Realtime/PresenceHub.cs` (resolve geo + publish on connect), `src/Pulse.Api/Program.cs` (MassTransit + EF outbox, register `IGeoLocator` + GeoLite2 `DatabaseReader`), `src/Pulse.Worker/Program.cs` (MassTransit consumers)
- Test: `tests/Pulse.Tests.Integration/VisitFlowTests.cs` (Postgres + RabbitMQ)

**Interfaces:**
- Consumes: `VisitStarted` (geo-carrying), `VisitAudit`, `GeoResult`, `IGeoLocator` (API-side).
- Produces: end-to-end flow connect → API resolves geo → `VisitStarted` → outbox → RabbitMQ → consumer → `VisitAudit` row. No IP anywhere downstream.

- [ ] **Step 1: Write the failing test** — publish a geo-carrying `VisitStarted`, assert a `VisitAudit` row appears:

```csharp
[Fact]
public async Task PublishingVisitStarted_WritesAuditRow()
{
    // harness: MassTransit test harness + Testcontainers Postgres/RabbitMQ (see fixture)
    await Harness.Bus.Publish(new VisitStarted(
        Guid.NewGuid(), "conn-1", "Portugal", "Lisbon", 38.72, -9.13, DateTimeOffset.UtcNow));
    Assert.True(await Harness.Consumed.Any<VisitStarted>());
    await using var ctx = Fixture.NewContext();
    Assert.Equal(1, await ctx.VisitAudits.CountAsync());
    var row = await ctx.VisitAudits.SingleAsync();
    Assert.Equal("Lisbon", row.City);
}
```

- [ ] **Step 2: Run to verify it fails** — FAIL (no consumer).
- [ ] **Step 3: Implement `GeoLocator`** in the API (MaxMind GeoLite2, offline `.mmdb`, privacy-safe fallback):

```csharp
using MaxMind.GeoIP2;
using Pulse.Domain.Geo;
namespace Pulse.Api.Geo;
public interface IGeoLocator { GeoResult Locate(string ip); }

public sealed class GeoLocator(DatabaseReader reader) : IGeoLocator
{
    public GeoResult Locate(string ip)
    {
        try
        {
            var c = reader.City(ip);
            return new GeoResult(c.Country.Name ?? "Unknown", c.City.Name ?? "Unknown",
                c.Location.Latitude ?? 0, c.Location.Longitude ?? 0);
        }
        catch { return new GeoResult("Unknown", "Unknown", 0, 0); }
    }
}

// Null-object: used when no GeoLite2 .mmdb is configured (dev/CI without a MaxMind
// license). Keeps the API bootable everywhere; geo degrades to "Unknown" (privacy-safe).
public sealed class NullGeoLocator : IGeoLocator
{
    public GeoResult Locate(string ip) => new("Unknown", "Unknown", 0, 0);
}
```

> **GeoLite2 .mmdb note:** the real `GeoLite2-City.mmdb` requires a free MaxMind license and is **never committed** (license + size). Production mounts it into the API container (Task 9) and sets `Geo:DbPath`. Without it, the factory below falls back to `NullGeoLocator`, so local dev, the smoke test, and CI all boot without the file. This task's `VisitFlowTests` publishes a geo-carrying event directly to the bus, so it needs no `.mmdb` either.

- [ ] **Step 4: Implement the consumer** (`IConsumer`, auto-discovered) — no geo lookup, just persists the event's coarse geo:

```csharp
using MassTransit;
using Pulse.Domain.Audit; using Pulse.Domain.Events; using Pulse.Domain.Geo; using Pulse.Persistence;
namespace Pulse.Worker.Consumers;
public sealed class VisitStartedConsumer(PulseDbContext db) : IConsumer<VisitStarted>
{
    public async Task Consume(ConsumeContext<VisitStarted> ctx)
    {
        var m = ctx.Message;
        var geo = new GeoResult(m.Country, m.City, m.Lat, m.Lon);
        db.VisitAudits.Add(VisitAudit.FromGeo(m.VisitId, geo, m.OccurredAt));
        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 5:** Register MassTransit + EF outbox in **API** `Program.cs` (publish side) plus the GeoLite2 reader + `IGeoLocator`, and consumers in **Worker** `Program.cs`:

```csharp
// API: geo locator — real GeoLite2 if the .mmdb exists, else a safe null-object (Unknown).
// Lazy factory (not `new DatabaseReader(...)` at registration) so the API boots with no .mmdb.
builder.Services.AddSingleton<Pulse.Api.Geo.IGeoLocator>(_ =>
{
    var path = builder.Configuration["Geo:DbPath"];
    return !string.IsNullOrWhiteSpace(path) && File.Exists(path)
        ? new Pulse.Api.Geo.GeoLocator(new MaxMind.GeoIP2.DatabaseReader(path))
        : new Pulse.Api.Geo.NullGeoLocator();
});
// Forwarded headers so Context.GetHttpContext() sees the real client IP behind Caddy.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);
// API: outbox in same tx as business writes
builder.Services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<PulseDbContext>(o => { o.UsePostgres(); o.UseBusOutbox(); });
    x.UsingRabbitMq((c, cfg2) => { cfg2.Host(builder.Configuration.GetConnectionString("RabbitMq")); cfg2.ConfigureEndpoints(c); });
});
// ...and `app.UseForwardedHeaders();` early in the pipeline.
// Worker Program.cs: register consumers via assembly scan
x.AddConsumers(typeof(VisitStartedConsumer).Assembly);
```

**⚠️ Cross-task breakage this task must fix:** adding MassTransit makes the bus connect to RabbitMQ at startup, which breaks the Task 5 `ApiSmokeTests` (it only starts Postgres + Redis). Update `ApiSmokeTests` to also start a `RabbitMqContainer` (`Testcontainers.RabbitMq`, image `rabbitmq:3-management`) and inject `ConnectionStrings:RabbitMq`. Keep it 6/6+ green.

- [ ] **Step 6:** In `PresenceHub.OnConnectedAsync`, inject `IGeoLocator` + `IPublishEndpoint`, read the client IP from `Context.GetHttpContext()` (honoring `X-Forwarded-For` set by Caddy — configure `ForwardedHeaders` in `Program.cs`), resolve `GeoResult`, then **publish the geo-carrying `VisitStarted` before any `SaveChangesAsync`** so the outbox insert joins the same transaction. The IP is used only for the in-process lookup and is never stored or forwarded. Regenerate the outbox migration:

```bash
dotnet ef migrations add MassTransitOutbox --project src/Pulse.Persistence --startup-project src/Pulse.Api --context PulseDbContext --output-dir Migrations
```

- [ ] **Step 7: Run to verify it passes** — `dotnet test tests/Pulse.Tests.Integration` → PASS.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: API-side geo resolution, visit event via outbox, worker audit writer"`

---

### Task 7: Public read endpoints — `/api/metrics`, `/api/map` (+ rate limiting)

**Files:**
- Create: `src/Pulse.Api/Endpoints/MetricsEndpoints.cs`, `Endpoints/MapEndpoints.cs`
- Modify: `Program.cs` (map endpoints, add rate limiter)
- Test: `tests/Pulse.Tests.Integration/PublicReadTests.cs`

**Interfaces:**
- Produces: `GET /api/metrics → MetricsDto(int ActiveConnections, long TotalVisits)`; `GET /api/map → GeoPointDto[]` (`GeoPointDto(double Lat, double Lon, string City, string Country, DateTimeOffset At)`), last 100 by `OccurredAt` desc.

- [ ] **Step 1: Write the failing test** — seed 2 audits, assert `/api/map` returns 2 points and `/api/metrics` reports `TotalVisits == 2`.
- [ ] **Step 2: Run to verify it fails** — FAIL (404).
- [ ] **Step 3: Implement endpoints**:

```csharp
using Microsoft.EntityFrameworkCore;
using Pulse.Api.Realtime; using Pulse.Persistence;
namespace Pulse.Api.Endpoints;
public sealed record MetricsDto(int ActiveConnections, long TotalVisits);
public sealed record GeoPointDto(double Lat, double Lon, string City, string Country, DateTimeOffset At);

public static class PublicEndpoints
{
    public static void MapPublic(this WebApplication app)
    {
        app.MapGet("/api/metrics", async (IPresenceTracker t, PulseDbContext db) =>
            new MetricsDto(await t.CountAsync(), await db.VisitAudits.LongCountAsync()))
           .RequireRateLimiting("public");
        app.MapGet("/api/map", async (PulseDbContext db) =>
            await db.VisitAudits.OrderByDescending(v => v.OccurredAt).Take(100)
                .Select(v => new GeoPointDto(v.Lat, v.Lon, v.City, v.Country, v.OccurredAt)).ToListAsync())
           .RequireRateLimiting("public");
    }
}
```

- [ ] **Step 4:** In `Program.cs` add a fixed-window rate limiter named `"public"` (e.g., 60 req/min/IP) and call `app.MapPublic()`.
- [ ] **Step 5: Run to verify it passes** — PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: public metrics and map endpoints with rate limiting"`

---

### Task 8: React SPA — connection client, presence layer, world map, live metrics

**Files:**
- Create: `web/` (Vite React-TS), `web/src/lib/connection.ts`, `web/src/components/PresenceLayer.tsx`, `WorldMap.tsx`, `LiveMetrics.tsx`, `web/src/App.tsx`

**Interfaces:**
- Consumes: `/hub/presence` (events `PresenceUpdated`, `ReactionReceived`), `GET /api/metrics`, `GET /api/map`.

- [ ] **Step 1:** Scaffold with pnpm:

```bash
cd /Users/felipe/dev/pulse
pnpm create vite@latest web -- --template react-ts
cd web && pnpm install && pnpm add @microsoft/signalr
```

- [ ] **Step 2:** `src/lib/connection.ts` — typed SignalR client:

```ts
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
export function createConnection(baseUrl: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hub/presence`)
    .withAutomaticReconnect()
    .build();
}
```

- [ ] **Step 3:** `PresenceLayer.tsx` — subscribes to `PresenceUpdated`, renders the live count + floats `ReactionReceived` emoji; reaction buttons are limited to the server's allow-list (`👋 ❤️ 🔥 👏 🎉 🚀 😮 💯`) and call `connection.invoke("React", emoji)`. **Heartbeat:** after the connection starts, `setInterval(() => connection.invoke("Heartbeat"), 15000)` (half the 30s presence TTL) so the visitor stays counted; clear the interval on unmount/disconnect. Render emoji as text content only (never `dangerouslySetInnerHTML`) — defense in depth alongside the server allow-list.
- [ ] **Step 4:** `LiveMetrics.tsx` — polls `GET /api/metrics` every 3s, shows active connections + total visits.
- [ ] **Step 5:** `WorldMap.tsx` — fetches `GET /api/map`, plots points on a lightweight SVG world map (no external tile service — privacy + no API key). Provide the SVG map inline.
- [ ] **Step 6: Verify** — `pnpm build` succeeds (build, not just typecheck — typecheck misses test files) and `pnpm dev` renders against a locally-running API; presence count increments across two browser tabs.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: React SPA with live presence, world map, and metrics"`

---

### Task 9: Containerization — Dockerfiles, Caddy, compose stack

**Files:**
- Create: `deploy/Dockerfile.api`, `Dockerfile.worker`, `Dockerfile.web`, `deploy/Caddyfile`, `deploy/compose.yml`

**Interfaces:**
- Produces: a `compose.yml` Portainer can deploy: `api`, `worker`, `web`, `postgres`, `redis`, `rabbitmq`, `caddy`.

- [ ] **Step 1:** `Dockerfile.api` / `Dockerfile.worker` — multi-stage `mcr.microsoft.com/dotnet/sdk:10.0` build → `aspnet:10.0` / `runtime:10.0` runtime. `Dockerfile.web` — build with `node:22`, serve static via Caddy or nginx.
- [ ] **Step 2:** `Caddyfile` — reverse proxy: `pulse.<domain>` → web + `/api/*` and `/hub/*` → api, automatic HTTPS via Let's Encrypt.
- [ ] **Step 3:** `compose.yml` — all services, healthchecks, named volumes for postgres/redis/caddy-data, env from `.env` (gitignored), GeoLite2 `.mmdb` mounted into the **api** (geo is resolved API-side; `Geo:DbPath` points at the mount). No secrets committed.
- [ ] **Step 4: Verify locally** — `docker compose -f deploy/compose.yml up --build` → open `http://localhost` → presence works end to end across two tabs; `/api/metrics` responds.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "chore: dockerize services with caddy reverse proxy and compose stack"`

---

### Task 10: Terraform — Hetzner box + firewall + DNS

**Files:**
- Create: `infra/main.tf`, `variables.tf`, `outputs.tf`

**Interfaces:**
- Produces: a provisioned Hetzner server with Docker + Portainer, firewall (22/80/443), and a DNS A record for `pulse.<domain>`.

- [ ] **Step 1:** `main.tf` — `hetznercloud/hcloud` provider: a `cx22` server, `hcloud_firewall` (allow 22/80/443), cloud-init installing Docker + Portainer. DNS via the domain's provider (or Hetzner DNS) A record → server IP.
- [ ] **Step 2:** `variables.tf` — `hcloud_token` (sensitive, from env `TF_VAR_hcloud_token`), `domain`, `ssh_key`. **No token in the repo.**
- [ ] **Step 3:** `outputs.tf` — server IPv4, Portainer URL.
- [ ] **Step 4: Verify** — `terraform init && terraform plan` produces a clean plan (apply is run manually with the operator's Hetzner token — credentials are supplied out of band).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "chore: terraform for hetzner server, firewall, and dns"`

> **Handoff note:** `terraform apply` and providing the Hetzner/Portainer credentials + pointing DNS are **manual** steps performed by the operator — the plan never handles credentials.

---

### Task 11: CI/CD — GitHub Actions (test → build → push → deploy)

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: CI running `dotnet test` + `pnpm build` on PRs; CD building images → GHCR → triggering the Portainer stack webhook on `main`.

- [ ] **Step 1:** `ci.yml` — on PR/push: setup .NET 10 + pnpm; `dotnet test` (Testcontainers needs Docker — use `ubuntu-latest` which has it); `pnpm -C web build`. Green-badge this in the README.
- [ ] **Step 2:** `deploy.yml` — on `main`: build & push `api`/`worker`/`web` images to GHCR (tagged with SHA), then `curl -X POST` the Portainer **stack webhook** (URL stored as a GitHub secret `PORTAINER_WEBHOOK`) to pull new images.
- [ ] **Step 3: Verify** — open a test PR → CI runs green; merge → images appear in GHCR and Portainer redeploys. **Check the running container after deploy** (deploy "success" can mask a rollback).
- [ ] **Step 4: Commit** — `git add -A && git commit -m "ci: test/build pipeline and portainer deploy on main"`

---

### Task 12: MVP README with badges + minimal architecture diagram

**Files:**
- Create: `README.md`

- [ ] **Step 1:** Write a README: what it is, the live URL, a mermaid architecture diagram (the data-flow from the spec), the stack, CI badges, and a "run locally" section (`docker compose up`).
- [ ] **Step 2:** Verify the mermaid renders on GitHub.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "docs: MVP readme with architecture diagram and badges"`

---

## Self-Review

**Spec coverage:** presence ✓(T4,T8) · reactions ✓(T4,T8) · world map ✓(T6,T7,T8) · public metrics ✓(T7,T8) · geo audit ✓(T6) · Redis backplane ✓(T4,T5) · event-driven+outbox ✓(T6) · Postgres ✓(T3) · Worker ✓(T6) · OTel ✓(T5) · IaC/Hetzner/Portainer ✓(T9,T10) · CI/CD ✓(T11) · Testcontainers tests ✓(T3,T4,T6,T7) · privacy/coarse-geo/no-PII ✓(T2,T6, rate-limit T7) · docs/diagram ✓(T12).
*Deferred to later plans (per spec phasing):* persistent canvas/reactions wall + public audit *feed UI* (Phase 2); full `/architecture` page + ADRs (Phase 3).

**Placeholder scan:** One intentional forward-reference — the live `pulse.<domain>` URL is filled in once DNS exists (Task 10/11). No vague "add error handling" steps.

**Type consistency:** `GeoResult`, `VisitAudit`, `VisitStarted`, `IPresenceTracker`, `MetricsDto`, `GeoPointDto`, `ReactionDto`, hub events `PresenceUpdated`/`ReactionReceived`, hub method `React` — consistent across T2/T4/T6/T7/T8.
