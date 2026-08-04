using MassTransit;
using MassTransit.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Pulse.Domain.Events;
using Pulse.Persistence;
using Pulse.Worker.Consumers;

public class VisitFlowTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    private ServiceProvider _provider = default!;
    private ITestHarness _harness = default!;

    public async Task InitializeAsync()
    {
        await _pg.StartAsync();

        var services = new ServiceCollection();
        services.AddDbContext<PulseDbContext>(o =>
            o.UseNpgsql(_pg.GetConnectionString()).UseSnakeCaseNamingConvention());
        services.AddMassTransitTestHarness(x => x.AddConsumer<VisitStartedConsumer>());
        _provider = services.BuildServiceProvider(true);

        await using (var scope = _provider.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<PulseDbContext>().Database.MigrateAsync();

        _harness = _provider.GetRequiredService<ITestHarness>();
        await _harness.Start();
    }

    public async Task DisposeAsync()
    {
        await _harness.Stop();
        await _provider.DisposeAsync();
        await _pg.DisposeAsync();
    }

    private PulseDbContext NewContext() => new(new DbContextOptionsBuilder<PulseDbContext>()
        .UseNpgsql(_pg.GetConnectionString()).UseSnakeCaseNamingConvention().Options);

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
