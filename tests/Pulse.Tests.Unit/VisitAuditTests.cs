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
