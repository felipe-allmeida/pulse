using Microsoft.EntityFrameworkCore;
using Pulse.Api.Geo;
using Pulse.Api.Realtime; using Pulse.Persistence;
namespace Pulse.Api.Endpoints;
public sealed record MetricsDto(int ActiveConnections, long TotalVisits);
public sealed record GeoPointDto(double Lat, double Lon, string City, string Country, DateTimeOffset At);

/// <summary>The caller's own coarse geo — the whole of what the API resolved about them.</summary>
public sealed record VisitorGeoDto(string City, string Country, double Lat, double Lon);

/// <summary>The visit immediately before the caller's, from a *different* city — see <see cref="VisitorContextDto"/>.</summary>
public sealed record PreviousVisitDto(string City, string Country, DateTimeOffset At);

/// <summary>
/// Everything the home page needs to greet a visitor with something true about
/// them: their own coarse geo, plus the historical counts the client's rarity
/// cascade picks from (first ever from this city? first in N days? nth overall?).
///
/// All counts describe the state *before* this visit is recorded — the visit
/// itself is published by <c>PresenceHub.OnConnectedAsync</c> and only lands in
/// Postgres after the outbox -> RabbitMQ -> Worker round trip, so it is not (and
/// must not be) counted here. The client adds the caller in when it phrases the
/// fact, which also makes the numbers immune to that round trip's timing.
/// </summary>
/// <param name="Geo">Null when geo could not be resolved (no .mmdb, or an IP the database doesn't know).</param>
/// <param name="TotalVisits">Every visit recorded so far, including ones with unresolved geo.</param>
/// <param name="CityVisits">Visits ever recorded from the caller's city. 0 means they're the first.</param>
/// <param name="LastCityVisitAt">When the most recent of those happened, if any.</param>
/// <param name="VisitsLast24h">A rolling 24h window, deliberately not a calendar "today" — the server has no idea what day it is where the caller is.</param>
/// <param name="Previous">The most recent visit from a different city, or null if there isn't one.</param>
public sealed record VisitorContextDto(
    VisitorGeoDto? Geo,
    long TotalVisits,
    long CityVisits,
    DateTimeOffset? LastCityVisitAt,
    long VisitsLast24h,
    PreviousVisitDto? Previous);

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
        app.MapGet("/api/visitor", GetVisitorAsync).RequireRateLimiting("public");
    }

    /// <summary>
    /// Read-only: this endpoint deliberately does *not* publish a
    /// <c>VisitStarted</c>. The hub already does that on connect, and publishing
    /// here too would double-count every page load.
    /// </summary>
    private static async Task<VisitorContextDto> GetVisitorAsync(
        HttpContext http, IGeoLocator geoLocator, PulseDbContext db)
    {
        // Same privacy constraint as PresenceHub: the IP lives as a local for the
        // duration of the lookup and is never persisted, returned, or forwarded.
        // What goes back to the caller is only the coarse geo below.
        var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var geo = geoLocator.Locate(ip);
        var resolved = geo.Country != "Unknown";

        var known = db.VisitAudits.Where(v => v.Country != "Unknown");

        // Cutoff computed here rather than inline, so the window is a plain
        // parameter instead of relying on how the provider translates now().
        var cutoff = DateTimeOffset.UtcNow.AddHours(-24);

        var totalVisits = await db.VisitAudits.LongCountAsync();
        var visitsLast24h = await db.VisitAudits.Where(v => v.OccurredAt >= cutoff).LongCountAsync();

        var cityVisits = resolved
            ? await known.Where(v => v.City == geo.City && v.Country == geo.Country).LongCountAsync()
            : 0;
        var lastCityVisitAt = resolved && cityVisits > 0
            ? await known.Where(v => v.City == geo.City && v.Country == geo.Country)
                .MaxAsync(v => (DateTimeOffset?)v.OccurredAt)
            : null;

        // Excluding the caller's own city is what makes this "someone else" without
        // needing to identify anyone: a reload can't surface the caller's own earlier
        // visit as the mystery previous visitor.
        var previous = await known
            .Where(v => !resolved || v.City != geo.City || v.Country != geo.Country)
            .OrderByDescending(v => v.OccurredAt)
            .Select(v => new PreviousVisitDto(v.City, v.Country, v.OccurredAt))
            .FirstOrDefaultAsync();

        return new VisitorContextDto(
            resolved ? new VisitorGeoDto(geo.City, geo.Country, geo.Lat, geo.Lon) : null,
            totalVisits, cityVisits, lastCityVisitAt, visitsLast24h, previous);
    }
}
