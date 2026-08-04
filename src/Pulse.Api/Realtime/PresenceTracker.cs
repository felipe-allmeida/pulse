using StackExchange.Redis;
namespace Pulse.Api.Realtime;
public interface IPresenceTracker
{
    Task<int> JoinAsync(string connectionId);
    Task<int> HeartbeatAsync(string connectionId);
    Task<int> LeaveAsync(string connectionId);
    Task<int> CountAsync();
    Task ClearAsync();
}
public sealed class PresenceTracker(IConnectionMultiplexer mux, TimeSpan? ttl = null) : IPresenceTracker
{
    private const string Key = "pulse:presence";
    private readonly TimeSpan _ttl = ttl ?? TimeSpan.FromSeconds(30);
    private IDatabase Db => mux.GetDatabase();

    public Task<int> JoinAsync(string id) => TouchAsync(id);
    public Task<int> HeartbeatAsync(string id) => TouchAsync(id);
    public async Task<int> LeaveAsync(string id) { await Db.SortedSetRemoveAsync(Key, id); return await PruneAndCountAsync(); }
    public Task<int> CountAsync() => PruneAndCountAsync();
    public Task ClearAsync() => Db.KeyDeleteAsync(Key);

    private async Task<int> TouchAsync(string id)
    {
        await Db.SortedSetAddAsync(Key, id, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        return await PruneAndCountAsync();
    }
    private async Task<int> PruneAndCountAsync()
    {
        var cutoff = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - _ttl.TotalMilliseconds;
        await Db.SortedSetRemoveRangeByScoreAsync(Key, double.NegativeInfinity, cutoff);
        return (int)await Db.SortedSetLengthAsync(Key);
    }
}
