using Microsoft.EntityFrameworkCore;
using Pulse.Domain.Audit;
using Pulse.Domain.Geo;
using Pulse.Tests.Integration.Infrastructure;

[Collection("Integration")]
public class PersistenceTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    [Fact]
    public async Task CanPersistAndReadVisitAudit()
    {
        // The fixture migrated the shared database once and TRUNCATEd it before this test, so the
        // exact count below still means "the row this test wrote".
        await using var ctx = Fixture.NewDbContext();

        ctx.VisitAudits.Add(VisitAudit.FromGeo(Guid.NewGuid(),
            new GeoResult("Portugal", "Lisbon", 38.72, -9.13), DateTimeOffset.UtcNow));
        await ctx.SaveChangesAsync();

        Assert.Equal(1, await ctx.VisitAudits.CountAsync());
    }
}
