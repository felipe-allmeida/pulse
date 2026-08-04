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
