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
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Portugal", "Lisbon", 38.72, -9.13), Oldest),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Brazil", "Sao Paulo", -23.55, -46.63), DateTimeOffset.UtcNow),
            // A second Sao Paulo visit, so the city ranking has something to rank.
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Brazil", "Sao Paulo", -23.55, -46.63), DateTimeOffset.UtcNow),
            // Same city name, different country — the pair, not the name, is what
            // makes a distinct city.
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Chile", "Santiago", -33.45, -70.67), DateTimeOffset.UtcNow),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Cuba", "Santiago", 20.02, -75.82), DateTimeOffset.UtcNow),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Unknown", "Unknown", 0, 0), DateTimeOffset.UtcNow));
        await db.SaveChangesAsync();
    }

    /// <summary>Seeded as the oldest resolved visit, so <c>FirstVisitAt</c> has an exact expected value.</summary>
    private static readonly DateTimeOffset Oldest = new(2026, 1, 2, 3, 4, 5, TimeSpan.Zero);

    [Fact]
    public async Task Map_ExcludesUnresolvedPoints_ReturnsOnlyKnownGeoPoints()
    {
        var client = Fixture.CreateClient();
        var response = await client.GetAsync("/api/map");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var points = await response.Content.ReadFromJsonAsync<GeoPointDto[]>();
        Assert.NotNull(points);
        // 6 rows were seeded, one of them Unknown/(0,0) — that one must be
        // filtered out so it doesn't render as a fake dot at map-center (0,0).
        Assert.Equal(5, points!.Length);
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
        Assert.Equal(6, metrics!.TotalVisits);
    }

    [Fact]
    public async Task Stats_CountsDistinctReach_PairingCityWithCountry()
    {
        var client = Fixture.CreateClient();
        var response = await client.GetAsync("/api/stats");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stats = await response.Content.ReadFromJsonAsync<StatsDto>();
        Assert.NotNull(stats);

        // Portugal, Brazil, Chile, Cuba — the Unknown row is excluded.
        Assert.Equal(4, stats!.Countries);
        // Lisbon, Sao Paulo (twice, one city), Santiago/Chile, Santiago/Cuba.
        // Counting by name alone would collapse the two Santiagos into one and
        // report 3.
        Assert.Equal(4, stats.Cities);
        Assert.Equal(Oldest, stats.FirstVisitAt);
    }

    [Fact]
    public async Task Stats_RanksBusiestPlacesFirst()
    {
        var client = Fixture.CreateClient();
        var stats = await client.GetFromJsonAsync<StatsDto>("/api/stats");
        Assert.NotNull(stats);

        // Brazil has the two Sao Paulo visits; everyone else has one.
        var topCountry = Assert.IsType<PlaceCountDto>(stats!.TopCountries[0]);
        Assert.Equal("Brazil", topCountry.Country);
        Assert.Equal(2, topCountry.Count);
        Assert.All(stats.TopCountries, p => Assert.Equal(string.Empty, p.City));

        var topCity = stats.TopCities[0];
        Assert.Equal("Sao Paulo", topCity.City);
        Assert.Equal("Brazil", topCity.Country);
        Assert.Equal(2, topCity.Count);

        // Ties break by name, so a reader watching the ranking doesn't see the
        // one-visit rows reshuffle between polls.
        var tied = stats.TopCountries.Where(p => p.Count == 1).Select(p => p.Country).ToArray();
        Assert.Equal(tied.OrderBy(c => c, StringComparer.Ordinal), tied);
    }

    [Fact]
    public async Task Stats_ExcludesUnresolvedGeoFromEveryFigure()
    {
        var client = Fixture.CreateClient();
        var stats = await client.GetFromJsonAsync<StatsDto>("/api/stats");
        Assert.NotNull(stats);

        Assert.DoesNotContain(stats!.TopCountries, p => p.Country == "Unknown");
        Assert.DoesNotContain(stats.TopCities, p => p.City == "Unknown");
    }
}
