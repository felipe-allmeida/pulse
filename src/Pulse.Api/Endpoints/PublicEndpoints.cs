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
            await db.VisitAudits.Where(v => v.Country != "Unknown")
                .OrderByDescending(v => v.OccurredAt).Take(100)
                .Select(v => new GeoPointDto(v.Lat, v.Lon, v.City, v.Country, v.OccurredAt)).ToListAsync())
           .RequireRateLimiting("public");
    }
}
