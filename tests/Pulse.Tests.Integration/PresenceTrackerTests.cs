using Testcontainers.Redis;
using StackExchange.Redis;
using Pulse.Api.Realtime;

public class PresenceTrackerTests : IAsyncLifetime
{
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private ConnectionMultiplexer _mux = default!;
    public async Task InitializeAsync() { await _redis.StartAsync(); _mux = await ConnectionMultiplexer.ConnectAsync(_redis.GetConnectionString()); }
    public Task DisposeAsync() => _redis.DisposeAsync().AsTask();

    [Fact]
    public async Task JoinDedupAndLeave_TracksLiveCount()
    {
        var t = new PresenceTracker(_mux, TimeSpan.FromSeconds(30));
        Assert.Equal(1, await t.JoinAsync("c1"));
        Assert.Equal(2, await t.JoinAsync("c2"));
        Assert.Equal(2, await t.JoinAsync("c1"));   // dedup: same id doesn't double-count
        Assert.Equal(1, await t.LeaveAsync("c1"));
        Assert.Equal(0, await t.LeaveAsync("c2"));
    }

    [Fact]
    public async Task StaleConnection_IsPrunedOnRead()   // simulates an ungraceful disconnect
    {
        var t = new PresenceTracker(_mux, TimeSpan.FromSeconds(30));
        await t.JoinAsync("fresh");
        // directly insert a member last-seen 60s ago (older than the 30s TTL)
        var stale = DateTimeOffset.UtcNow.AddSeconds(-60).ToUnixTimeMilliseconds();
        await _mux.GetDatabase().SortedSetAddAsync("pulse:presence", "orphan", stale);
        Assert.Equal(1, await t.CountAsync());        // orphan pruned, only "fresh" remains
    }

    [Fact]
    public async Task Heartbeat_KeepsConnectionAlive()
    {
        var t = new PresenceTracker(_mux, TimeSpan.FromSeconds(30));
        await t.JoinAsync("c1");
        Assert.Equal(1, await t.HeartbeatAsync("c1"));  // refresh, still present
    }

    [Fact]
    public async Task RateLimiter_BlocksAfterLimit()
    {
        var rl = new ReactionRateLimiter(_mux);         // default 5 / 5s
        for (var i = 0; i < 5; i++) Assert.True(await rl.AllowAsync("c1"));
        Assert.False(await rl.AllowAsync("c1"));         // 6th blocked
    }
}
