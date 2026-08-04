using StackExchange.Redis;
namespace Pulse.Api.Realtime;
public interface IPresenceTracker
{
    Task<int> JoinAsync(string connectionId);
    Task<int> LeaveAsync(string connectionId);
    Task<int> CountAsync();
}
public sealed class PresenceTracker(IConnectionMultiplexer mux) : IPresenceTracker
{
    private const string Key = "pulse:presence";
    private IDatabase Db => mux.GetDatabase();
    public async Task<int> JoinAsync(string id) { await Db.SetAddAsync(Key, id); return (int)await Db.SetLengthAsync(Key); }
    public async Task<int> LeaveAsync(string id) { await Db.SetRemoveAsync(Key, id); return (int)await Db.SetLengthAsync(Key); }
    public async Task<int> CountAsync() => (int)await Db.SetLengthAsync(Key);
}
