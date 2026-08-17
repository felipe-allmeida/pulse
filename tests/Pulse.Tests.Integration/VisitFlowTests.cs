using MassTransit;
using MassTransit.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pulse.Domain.Events;
using Pulse.Persistence;
using Pulse.Tests.Integration.Infrastructure;
using Pulse.Worker.Consumers;

[Collection("Integration")]
public class VisitFlowTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    private ServiceProvider _provider = default!;
    private ITestHarness _harness = default!;

    public override async Task InitializeAsync()
    {
        // TRUNCATEs visit_audits (and the outbox tables) before the harness starts, which is what
        // keeps the exact count below meaning "the row this test wrote".
        await base.InitializeAsync();

        // The harness stays per-test: it is in-memory and costs no container, and a fresh bus per
        // test is what keeps the Consumed assertion about this test's message only.
        var services = new ServiceCollection();
        services.AddDbContext<PulseDbContext>(o =>
            o.UseNpgsql(Fixture.PostgresConnectionString).UseSnakeCaseNamingConvention());
        services.AddMassTransitTestHarness(x => x.AddConsumer<VisitStartedConsumer>());
        _provider = services.BuildServiceProvider(true);

        // No MigrateAsync here — the fixture owns the schema for the whole assembly.
        _harness = _provider.GetRequiredService<ITestHarness>();
        await _harness.Start();
    }

    public override async Task DisposeAsync()
    {
        await _harness.Stop();
        await _provider.DisposeAsync();
    }

    private PulseDbContext NewContext() => Fixture.NewDbContext();

    [Fact]
    public async Task PublishingVisitStarted_WritesAuditRow()
    {
        await _harness.Bus.Publish(new VisitStarted(
            Guid.NewGuid(), "conn-1", "Portugal", "Lisbon", 38.72, -9.13, DateTimeOffset.UtcNow));

        Assert.True(await _harness.Consumed.Any<VisitStarted>());

        await using var ctx = NewContext();
        Assert.Equal(1, await ctx.VisitAudits.CountAsync());
        var row = await ctx.VisitAudits.SingleAsync();
        Assert.Equal("Lisbon", row.City);
    }
}
