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
