using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;
using Testcontainers.Redis;
using Pulse.Api.Endpoints;
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;
using Pulse.Persistence;

public class PublicReadTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private readonly RabbitMqContainer _rabbitMq = new RabbitMqBuilder().WithImage("rabbitmq:3-management").Build();
    private PulseApiFactory _factory = default!;

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_pg.StartAsync(), _redis.StartAsync(), _rabbitMq.StartAsync());
        _factory = new PulseApiFactory(_pg.GetConnectionString(), _redis.GetConnectionString(), _rabbitMq.GetConnectionString());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PulseDbContext>();
        db.VisitAudits.AddRange(
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Portugal", "Lisbon", 38.72, -9.13), DateTimeOffset.UtcNow),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Brazil", "Sao Paulo", -23.55, -46.63), DateTimeOffset.UtcNow),
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Unknown", "Unknown", 0, 0), DateTimeOffset.UtcNow));
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        _factory.Dispose();
        await _pg.DisposeAsync();
        await _redis.DisposeAsync();
        await _rabbitMq.DisposeAsync();
    }

    [Fact]
    public async Task Map_ExcludesUnresolvedPoints_ReturnsOnlyKnownGeoPoints()
    {
        var client = _factory.CreateClient();
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
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/metrics");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var metrics = await response.Content.ReadFromJsonAsync<MetricsDto>();
        Assert.NotNull(metrics);
        // TotalVisits counts every audit row (including unresolved geo ones) —
        // only /api/map filters Unknown points, metrics stay a raw count.
        Assert.Equal(3, metrics!.TotalVisits);
    }
}
