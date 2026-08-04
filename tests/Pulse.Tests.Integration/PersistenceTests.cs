using Testcontainers.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;
using Pulse.Persistence;

public class PersistenceTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    public Task InitializeAsync() => _pg.StartAsync();
    public Task DisposeAsync() => _pg.DisposeAsync().AsTask();

    [Fact]
    public async Task CanPersistAndReadVisitAudit()
    {
        var opts = new DbContextOptionsBuilder<PulseDbContext>()
            .UseNpgsql(_pg.GetConnectionString()).UseSnakeCaseNamingConvention().Options;
        await using var ctx = new PulseDbContext(opts);
        await ctx.Database.MigrateAsync();

        ctx.VisitAudits.Add(VisitAudit.FromGeo(Guid.NewGuid(),
            new GeoResult("Portugal", "Lisbon", 38.72, -9.13), DateTimeOffset.UtcNow));
        await ctx.SaveChangesAsync();

        Assert.Equal(1, await ctx.VisitAudits.CountAsync());
    }
}
