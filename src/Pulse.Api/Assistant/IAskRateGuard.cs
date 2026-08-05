using StackExchange.Redis; using Microsoft.Extensions.Options;
namespace Pulse.Api.Assistant;
public interface IAskRateGuard { Task<bool> TryConsumeAsync(string clientIp); }
public sealed class RedisAskRateGuard(IConnectionMultiplexer mux, IOptions<AskOptions> opts) : IAskRateGuard
{
    private readonly int _cap = opts.Value.DailyCap;
    private readonly int _ipCap = opts.Value.PerIpDailyCap;
    public async Task<bool> TryConsumeAsync(string clientIp)
    {
        var db = mux.GetDatabase();
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var globalKey = (RedisKey)$"pulse:ask:daily:{date}";
        var ipKey = (RedisKey)$"pulse:ask:daily:ip:{clientIp}:{date}";

        var globalCount = await db.StringIncrementAsync(globalKey);
        if (globalCount == 1) await db.KeyExpireAsync(globalKey, TimeSpan.FromHours(48));

        var ipCount = await db.StringIncrementAsync(ipKey);
        if (ipCount == 1) await db.KeyExpireAsync(ipKey, TimeSpan.FromHours(48));

        return globalCount <= _cap && ipCount <= _ipCap;
    }
}
