using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using MassTransit;
using OpenTelemetry.Trace; using OpenTelemetry.Metrics; using OpenTelemetry.Resources;
using Pulse.Api.Endpoints; using Pulse.Api.Realtime; using Pulse.Persistence;

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

// Public read endpoints (/api/metrics, /api/map) — 60 req/min per client IP.
// RemoteIpAddress reflects the real client thanks to ForwardedHeaders (see below).
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("public", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("pulse-api"))
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddOtlpExporter());

// Geo locator — real GeoLite2 if the .mmdb exists, else a safe null-object (Unknown).
// Lazy factory (not `new DatabaseReader(...)` at registration) so the API boots with no .mmdb.
builder.Services.AddSingleton<Pulse.Api.Geo.IGeoLocator>(_ =>
{
    var path = builder.Configuration["Geo:DbPath"];
    return !string.IsNullOrWhiteSpace(path) && File.Exists(path)
        ? new Pulse.Api.Geo.GeoLocator(new MaxMind.GeoIP2.DatabaseReader(path))
        : new Pulse.Api.Geo.NullGeoLocator();
});

// Forwarded headers so Context.GetHttpContext() sees the real client IP behind Caddy.
// KnownNetworks/KnownProxies default to loopback only, but Caddy runs as a separate
// container (not loopback) in this deploy topology, so the header would otherwise be
// silently ignored. Clearing the allow-lists is safe here specifically because the
// firewall (Task 9/10) exposes only 80/443 -> Caddy, and the API container is never
// directly internet-reachable — Caddy is the only peer that can ever call this API.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

// Outbox in the same tx as business writes.
builder.Services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<PulseDbContext>(o =>
    {
        o.UsePostgres();
        o.UseBusOutbox();
    });
    x.UsingRabbitMq((c, cfg2) =>
    {
        cfg2.Host(cfg.GetConnectionString("RabbitMq"));
        cfg2.ConfigureEndpoints(c);
    });
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<PulseDbContext>().Database.MigrateAsync();
// presence self-heals via TTL, but clear the set on startup so a fresh deploy starts at 0
await app.Services.GetRequiredService<IPresenceTracker>().ClearAsync();

app.UseForwardedHeaders();
app.UseCors();
app.UseRateLimiter();
app.MapHub<PresenceHub>("/hub/presence");
app.MapGet("/health", () => Results.Ok("ok"));
app.MapPublic();
app.Run();

public partial class Program { } // for WebApplicationFactory
