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
        var guard = new RedisAskRateGuard(_mux, Options.Create(new AskOptions { DailyCap = 3 }));
        Assert.True(await guard.TryConsumeAsync());
        Assert.True(await guard.TryConsumeAsync());
        Assert.True(await guard.TryConsumeAsync());
        Assert.False(await guard.TryConsumeAsync());
    }
}
