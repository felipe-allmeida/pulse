using StackExchange.Redis;
namespace Pulse.Api.Realtime;
public interface IReactionRateLimiter { Task<bool> AllowAsync(string connectionId); }
public sealed class ReactionRateLimiter(IConnectionMultiplexer mux) : IReactionRateLimiter
{
    private const int Limit = 5;
    private static readonly TimeSpan Window = TimeSpan.FromSeconds(5);
    public async Task<bool> AllowAsync(string connectionId)
    {
        var db = mux.GetDatabase();
        var key = (RedisKey)$"pulse:rl:react:{connectionId}";
        var n = await db.StringIncrementAsync(key);
        if (n == 1) await db.KeyExpireAsync(key, Window);
        return n <= Limit;
    }
}
