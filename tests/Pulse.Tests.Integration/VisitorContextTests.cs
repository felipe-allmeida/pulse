using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Pulse.Api.Endpoints;
using Pulse.Api.Geo;
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;
using Pulse.Tests.Integration.Infrastructure;

/// <summary>Pins the caller's resolved geo so the tests don't depend on DemoGeoLocator's round-robin.</summary>
public sealed class StubGeoLocator(GeoResult result) : IGeoLocator
{
    public GeoResult Locate(string ip) => result;
}

/// <summary>
/// /api/visitor feeds the home page's "something true about you" line, so what
/// matters here is that each historical count means exactly what the copy claims:
/// "first from your city" must be about *your* city, and "the last person before
/// you" must never be able to be you.
/// </summary>
[Collection("Integration")]
public class VisitorContextTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    private static readonly GeoResult PortoAlegre = new("Brazil", "Porto Alegre", -30.03, -51.23);
    private static readonly GeoResult Curitiba = new("Brazil", "Curitiba", -25.43, -49.27);
    private static readonly GeoResult Unresolved = new("Unknown", "Unknown", 0, 0);

    /// <summary>The seeded Porto Alegre visit the "last from your city" assertions expect.</summary>
    private DateTimeOffset _recentPortoAlegreAt;

    /// <summary>
    /// A host whose caller always resolves to <paramref name="geo"/>.
    ///
    /// <para>These are three fixed configurations, so they memoise to three hosts for the whole
    /// class instead of three per <c>[Fact]</c>. Each GeoResult is a static readonly field paired
    /// one-to-one with its key, which is what keeps the key contract in
    /// <see cref="PulseTestFixture.GetOrCreateHost"/> honest: the key alone says what the callback
    /// will register.</para>
    /// </summary>
    private WebApplicationFactory<Program> HostSeeingCallerFrom(string key, GeoResult geo) =>
        Fixture.GetOrCreateHost($"visitor:geo:{key}", b =>
            // Runs after Program's own registration, so this instance is what resolves.
            b.ConfigureTestServices(s => s.AddSingleton<IGeoLocator>(new StubGeoLocator(geo))));

    private WebApplicationFactory<Program> FromPortoAlegre => HostSeeingCallerFrom("porto-alegre", PortoAlegre);
    private WebApplicationFactory<Program> FromCuritiba => HostSeeingCallerFrom("curitiba", Curitiba);
    private WebApplicationFactory<Program> FromNowhere => HostSeeingCallerFrom("unresolved", Unresolved);

    public override async Task InitializeAsync()
    {
        // Reset first, then seed — every count below is exact.
        await base.InitializeAsync();

        var now = DateTimeOffset.UtcNow;
        _recentPortoAlegreAt = now.AddMinutes(-30);

        await using var db = Fixture.NewDbContext();
        db.VisitAudits.AddRange(
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Portugal", "Lisbon", 38.72, -9.13), now.AddHours(-3)),
            VisitAudit.FromGeo(Guid.NewGuid(), PortoAlegre, now.AddDays(-10)),
            VisitAudit.FromGeo(Guid.NewGuid(), PortoAlegre, _recentPortoAlegreAt),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Brazil", "Sao Paulo", -23.55, -46.63), now.AddDays(-2)),
            VisitAudit.FromGeo(Guid.NewGuid(), Unresolved, now.AddHours(-1)));
        await db.SaveChangesAsync();
    }

    private static async Task<VisitorContextDto> GetVisitorAsync(WebApplicationFactory<Program> factory)
    {
        var response = await factory.CreateClient().GetAsync("/api/visitor");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<VisitorContextDto>();
        Assert.NotNull(dto);
        return dto!;
    }

    [Fact]
    public async Task Visitor_ReturnsCallersOwnCoarseGeo()
    {
        var visitor = await GetVisitorAsync(FromPortoAlegre);

        Assert.NotNull(visitor.Geo);
        Assert.Equal("Porto Alegre", visitor.Geo!.City);
        Assert.Equal("Brazil", visitor.Geo.Country);
    }

    [Fact]
    public async Task Visitor_CountsPriorVisitsFromTheCallersCity()
    {
        var visitor = await GetVisitorAsync(FromPortoAlegre);

        // Two Porto Alegre rows seeded (10 days ago, 30 minutes ago) — the other
        // three cities must not leak into this count.
        Assert.Equal(2, visitor.CityVisits);
        Assert.NotNull(visitor.LastCityVisitAt);
        Assert.True((visitor.LastCityVisitAt!.Value - _recentPortoAlegreAt).Duration() < TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task Visitor_NeverSeenCity_ReportsCallerAsTheFirst()
    {
        var visitor = await GetVisitorAsync(FromCuritiba);

        // This is what makes the rarest tier of the copy ("the first person from
        // Curitiba to open this page") safe to render.
        Assert.Equal(0, visitor.CityVisits);
        Assert.Null(visitor.LastCityVisitAt);
    }

    [Fact]
    public async Task Visitor_PreviousVisit_SkipsTheCallersOwnCity()
    {
        var visitor = await GetVisitorAsync(FromPortoAlegre);

        // The newest known-geo row overall is Porto Alegre (30 min ago) — the
        // caller's own city. "The last person before you" would then be the
        // caller themselves on a reload, so it must skip to Lisbon (3h ago).
        Assert.NotNull(visitor.Previous);
        Assert.Equal("Lisbon", visitor.Previous!.City);
    }

    [Fact]
    public async Task Visitor_PreviousVisit_ExcludesUnresolvedGeo()
    {
        // Caller's city is unknown, so nothing is skipped for being "their own" —
        // the newest row overall is the Unknown one (1h ago), which must still be
        // filtered out in favour of the newest *locatable* visit.
        var visitor = await GetVisitorAsync(FromNowhere);

        Assert.NotNull(visitor.Previous);
        Assert.Equal("Porto Alegre", visitor.Previous!.City);
    }

    [Fact]
    public async Task Visitor_UnresolvedGeo_OmitsGeoButKeepsHistory()
    {
        var visitor = await GetVisitorAsync(FromNowhere);

        // Degrades to the city-less copy rather than inventing a location.
        Assert.Null(visitor.Geo);
        Assert.Equal(0, visitor.CityVisits);
        Assert.Null(visitor.LastCityVisitAt);
        Assert.Equal(5, visitor.TotalVisits);
    }

    [Fact]
    public async Task Visitor_Totals_CountEveryVisitButWindowOnlyTheLast24h()
    {
        var visitor = await GetVisitorAsync(FromPortoAlegre);

        // All five seeded rows, unresolved geo included — same as /api/metrics.
        Assert.Equal(5, visitor.TotalVisits);
        // Lisbon (3h), Porto Alegre (30min), Unknown (1h). The 10-day and 2-day
        // rows fall outside the rolling window.
        Assert.Equal(3, visitor.VisitsLast24h);
    }

    [Fact]
    public async Task Visitor_DoesNotRecordAVisitOfItsOwn()
    {
        var before = await GetVisitorAsync(FromPortoAlegre);
        await GetVisitorAsync(FromPortoAlegre);
        var after = await GetVisitorAsync(FromPortoAlegre);

        // Visits are published by the hub on connect. If this read endpoint also
        // published one, every page load would count twice and the "nth person"
        // copy would drift.
        Assert.Equal(before.TotalVisits, after.TotalVisits);
    }
}
