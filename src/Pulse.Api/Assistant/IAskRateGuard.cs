using StackExchange.Redis; using Microsoft.Extensions.Options;
namespace Pulse.Api.Assistant;
public interface IAskRateGuard { Task<bool> TryConsumeAsync(); }
public sealed class RedisAskRateGuard(IConnectionMultiplexer mux, IOptions<AskOptions> opts) : IAskRateGuard
{
    private readonly int _cap = opts.Value.DailyCap;
    public async Task<bool> TryConsumeAsync()
    {
        var db = mux.GetDatabase();
        var key = (RedisKey)$"pulse:ask:daily:{DateTime.UtcNow:yyyyMMdd}";
        var n = await db.StringIncrementAsync(key);
        if (n == 1) await db.KeyExpireAsync(key, TimeSpan.FromHours(48));
        return n <= _cap;
    }
}
