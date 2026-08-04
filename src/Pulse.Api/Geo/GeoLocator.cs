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

// Null-object: used when no GeoLite2 .mmdb is configured (dev/CI without a MaxMind
// license). Keeps the API bootable everywhere; geo degrades to "Unknown" (privacy-safe).
public sealed class NullGeoLocator : IGeoLocator
{
    public GeoResult Locate(string ip) => new("Unknown", "Unknown", 0, 0);
}
