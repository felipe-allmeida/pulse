using MaxMind.GeoIP2;
using Pulse.Domain.Geo;
namespace Pulse.Api.Geo;

public interface IGeoLocator
{
    GeoResult Locate(string ip);
}

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

// Null-object: geo degrades to "Unknown" when no GeoLite2 .mmdb is configured and the
// demo fallback is disabled. Privacy-safe, but leaves the map/chart empty.
public sealed class NullGeoLocator : IGeoLocator
{
    public GeoResult Locate(string ip) => new("Unknown", "Unknown", 0, 0);
}

// Demo fallback: used when no GeoLite2 .mmdb is configured (local `docker compose up`,
// anyone cloning the repo, or a deploy without a MaxMind license). Instead of "Unknown"
// (which the /api/map endpoint filters out, leaving the map + chart empty), it spreads
// visits round-robin across a curated set of real cities so the live surface actually
// comes alive out of the box. NOT real geolocation — purely a demo affordance; a real
// `Geo:DbPath` takes precedence and yields real geo. Round-robin (not IP-hash) because
// local visits all share one source IP (loopback/docker gateway) and would otherwise
// collapse to a single city.
public sealed class DemoGeoLocator : IGeoLocator
{
    private static readonly GeoResult[] Cities =
    [
        new("Portugal", "Lisbon", 38.72, -9.13),
        new("Brazil", "São Paulo", -23.55, -46.63),
        new("United States", "New York", 40.71, -74.01),
        new("United Kingdom", "London", 51.51, -0.13),
        new("Germany", "Berlin", 52.52, 13.40),
        new("France", "Paris", 48.86, 2.35),
        new("Spain", "Madrid", 40.42, -3.70),
        new("Netherlands", "Amsterdam", 52.37, 4.90),
        new("Japan", "Tokyo", 35.68, 139.69),
        new("Singapore", "Singapore", 1.35, 103.82),
        new("India", "Mumbai", 19.08, 72.88),
        new("Australia", "Sydney", -33.87, 151.21),
        new("Canada", "Toronto", 43.65, -79.38),
        new("Mexico", "Mexico City", 19.43, -99.13),
        new("Argentina", "Buenos Aires", -34.60, -58.38),
        new("South Africa", "Cape Town", -33.92, 18.42),
    ];

    private int _next = -1;

    public GeoResult Locate(string ip)
    {
        var idx = (int)((uint)System.Threading.Interlocked.Increment(ref _next) % (uint)Cities.Length);
        return Cities[idx];
    }
}
