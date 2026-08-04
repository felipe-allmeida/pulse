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
            VisitAudit.FromGeo(Guid.NewGuid(), new GeoResult("Brazil", "Sao Paulo", -23.55, -46.63), DateTimeOffset.UtcNow));
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
    public async Task Map_ReturnsSeededPoints()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/map");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var points = await response.Content.ReadFromJsonAsync<GeoPointDto[]>();
        Assert.NotNull(points);
        Assert.Equal(2, points!.Length);
    }

    [Fact]
    public async Task Metrics_ReportsTotalVisits()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/metrics");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var metrics = await response.Content.ReadFromJsonAsync<MetricsDto>();
        Assert.NotNull(metrics);
        Assert.Equal(2, metrics!.TotalVisits);
    }
}
