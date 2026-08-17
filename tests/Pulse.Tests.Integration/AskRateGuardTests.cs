using Microsoft.Extensions.Options;
using Pulse.Api.Assistant;
using Pulse.Tests.Integration.Infrastructure;

[Collection("Integration")]
public class AskRateGuardTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    // RedisAskRateGuard's daily counters live under fixed keys, so each test's budget starts full
    // only because the fixture FLUSHALLs the shared Redis in ResetAsync.

    [Fact]
    public async Task TryConsume_AllowsUpToCap_ThenBlocks()
    {
        var guard = new RedisAskRateGuard(Fixture.Redis, Options.Create(new AskOptions { DailyCap = 3, PerIpDailyCap = 100 }));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.False(await guard.TryConsumeAsync("1.1.1.1"));
    }

    [Fact]
    public async Task TryConsume_PerIpCap_BlocksOneIp_ButAllowsAnotherIp()
    {
        var guard = new RedisAskRateGuard(Fixture.Redis, Options.Create(new AskOptions { DailyCap = 100, PerIpDailyCap = 2 }));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.False(await guard.TryConsumeAsync("1.1.1.1")); // per-IP cap hit for this IP
        Assert.True(await guard.TryConsumeAsync("2.2.2.2")); // different IP is unaffected
    }

    [Fact]
    public async Task TryConsume_GlobalCap_BlocksEvenDifferentIps()
    {
        var guard = new RedisAskRateGuard(Fixture.Redis, Options.Create(new AskOptions { DailyCap = 2, PerIpDailyCap = 100 }));
        Assert.True(await guard.TryConsumeAsync("1.1.1.1"));
        Assert.True(await guard.TryConsumeAsync("2.2.2.2"));
        Assert.False(await guard.TryConsumeAsync("3.3.3.3")); // global cap hit despite per-IP budget remaining
    }

    [Fact]
    public async Task TryConsume_RejectedPerIpRequests_DoNotConsumeGlobalBudget()
    {
        // DailyCap is small enough that if the abuser's rejected requests leaked into the global
        // counter, it would be exhausted well before a different IP gets a turn.
        var guard = new RedisAskRateGuard(Fixture.Redis, Options.Create(new AskOptions { DailyCap = 3, PerIpDailyCap = 2 }));

        // Abuser IP: 2 allowed (consumes its per-IP cap), then hammer well past it — all rejected.
        Assert.True(await guard.TryConsumeAsync("9.9.9.9"));
        Assert.True(await guard.TryConsumeAsync("9.9.9.9"));
        for (var i = 0; i < 10; i++)
        {
            Assert.False(await guard.TryConsumeAsync("9.9.9.9"));
        }

        // A different IP must still have global budget left — the abuser's 10 rejected requests
        // must not have touched the shared global counter (only its 2 allowed ones did).
        Assert.True(await guard.TryConsumeAsync("8.8.8.8"));
    }
}
