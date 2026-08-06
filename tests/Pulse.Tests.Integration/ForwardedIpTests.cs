using System.Net;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;
using Testcontainers.Redis;

// Proves the real visitor IP survives the two-hop proxy chain (NPM -> Caddy -> API)
// in prod. The factory forces the "Testing" environment so Program.cs maps a
// test-only /__ip endpoint that echoes HttpContext.Connection.RemoteIpAddress —
// the same value PresenceHub's geo lookup and the rate limiter rely on. That
// endpoint never exists outside the Testing environment, so production surface
// is unchanged.
public class ForwardedIpTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private readonly RabbitMqContainer _rabbitMq = new RabbitMqBuilder().WithImage("rabbitmq:3-management").Build();
    private PulseApiFactory _factory = default!;

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_pg.StartAsync(), _redis.StartAsync(), _rabbitMq.StartAsync());
        _factory = new PulseApiFactory(_pg.GetConnectionString(), _redis.GetConnectionString(), _rabbitMq.GetConnectionString());
    }

    public async Task DisposeAsync()
    {
        _factory.Dispose();
        await _pg.DisposeAsync();
        await _redis.DisposeAsync();
        await _rabbitMq.DisposeAsync();
    }

    [Fact]
    public async Task TwoHopForwardedFor_ResolvesToOriginalVisitorIp()
    {
        var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/__ip");
        // Left-most = original visitor (NPM's edge), then Caddy's container IP —
        // mirrors what NPM -> Caddy -> API actually produces in prod.
        request.Headers.Add("X-Forwarded-For", "203.0.113.7, 172.18.0.9");
        request.Headers.Add("X-Forwarded-Proto", "https");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resolvedIp = await response.Content.ReadAsStringAsync();
        Assert.Equal("203.0.113.7", resolvedIp);
    }
}
