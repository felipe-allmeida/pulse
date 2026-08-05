using Testcontainers.Redis; using StackExchange.Redis; using Microsoft.Extensions.Options;
using Pulse.Api.Assistant;
public class AskRateGuardTests : IAsyncLifetime
{
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private ConnectionMultiplexer _mux = default!;
    public async Task InitializeAsync() { await _redis.StartAsync(); _mux = await ConnectionMultiplexer.ConnectAsync(_redis.GetConnectionString()); }
    public Task DisposeAsync() => _redis.DisposeAsync().AsTask();

    [Fact]
    public async Task TryConsume_AllowsUpToCap_ThenBlocks()
    {
        var guard = new RedisAskRateGuard(_mux, Options.Create(new AskOptions { DailyCap = 3, PerIpDailyCap = 100 }));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.False(await guard.TryConsumeAsync("1.1.1.1"));
    }

    [Fact]
    public async Task TryConsume_PerIpCap_BlocksOneIp_ButAllowsAnotherIp()
    {
        var guard = new RedisAskRateGuard(_mux, Options.Create(new AskOptions { DailyCap = 100, PerIpDailyCap = 2 }));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.False(await guard.TryConsumeAsync("1.1.1.1")); // per-IP cap hit for this IP
        Assert.True(await guard.TryConsumeAsync("2.2.2.2")); // different IP is unaffected
    }

    [Fact]
    public async Task TryConsume_GlobalCap_BlocksEvenDifferentIps()
    {
        var guard = new RedisAskRateGuard(_mux, Options.Create(new AskOptions { DailyCap = 2, PerIpDailyCap = 100 }));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("2.2.2.2"));
        Assert.False(await guard.TryConsumeAsync("3.3.3.3")); // global cap hit despite per-IP budget remaining
    }
}
