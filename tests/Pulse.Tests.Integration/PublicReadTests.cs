using System.Net;
using System.Net.Http.Json;
using Pulse.Api.Endpoints;
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;
using Pulse.Tests.Integration.Infrastructure;

[Collection("Integration")]
public class PublicReadTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    public override async Task InitializeAsync()
    {
        // Reset first, then seed — the counts below are exact, not lower bounds.
        await base.InitializeAsync();

        await using var db = Fixture.NewDbContext();
        db.VisitAudits.AddRange(
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Portugal", "Lisbon", 38.72, -9.13), DateTimeOffset.UtcNow),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Brazil", "Sao Paulo", -23.55, -46.63), DateTimeOffset.UtcNow),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Unknown", "Unknown", 0, 0), DateTimeOffset.UtcNow));
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Map_ExcludesUnresolvedPoints_ReturnsOnlyKnownGeoPoints()
    {
        var client = Fixture.CreateClient();
        var response = await client.GetAsync("/api/map");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var points = await response.Content.ReadFromJsonAsync<GeoPointDto[]>();
        Assert.NotNull(points);
        // 3 rows were seeded (Portugal, Brazil, Unknown/(0,0)) — the Unknown
        // one must be filtered out so it doesn't render as a fake dot at
        // map-center (0,0).
        Assert.Equal(2, points!.Length);
        Assert.All(points, p => Assert.NotEqual("Unknown", p.Country));
        Assert.Contains(points, p => p.Country == "Portugal");
        Assert.Contains(points, p => p.Country == "Brazil");
    }

    [Fact]
    public async Task Metrics_ReportsTotalVisits()
    {
        var client = Fixture.CreateClient();
        var response = await client.GetAsync("/api/metrics");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var metrics = await response.Content.ReadFromJsonAsync<MetricsDto>();
        Assert.NotNull(metrics);
        // TotalVisits counts every audit row (including unresolved geo ones) —
        // only /api/map filters Unknown points, metrics stay a raw count.
        Assert.Equal(3, metrics!.TotalVisits);
    }
}
