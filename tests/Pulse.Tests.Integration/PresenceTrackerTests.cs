using Testcontainers.Redis;
using StackExchange.Redis;
using Pulse.Api.Realtime;

public class PresenceTrackerTests : IAsyncLifetime
{
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    public Task InitializeAsync() => _redis.StartAsync();
    public Task DisposeAsync() => _redis.DisposeAsync().AsTask();

    [Fact]
    public async Task JoinThenLeave_ReturnsToZero()
    {
        var mux = await ConnectionMultiplexer.ConnectAsync(_redis.GetConnectionString());
        var tracker = new PresenceTracker(mux);
        Assert.Equal(1, await tracker.JoinAsync("conn-1"));
        Assert.Equal(2, await tracker.JoinAsync("conn-2"));
        Assert.Equal(1, await tracker.LeaveAsync("conn-1"));
        Assert.Equal(0, await tracker.LeaveAsync("conn-2"));
    }
}
