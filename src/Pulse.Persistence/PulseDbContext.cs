using Microsoft.EntityFrameworkCore;
using Pulse.Domain.Audit;
namespace Pulse.Persistence;
public class PulseDbContext(DbContextOptions<PulseDbContext> options) : DbContext(options)
{
    public DbSet<VisitAudit> VisitAudits => Set<VisitAudit>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(PulseDbContext).Assembly);
        // MassTransit outbox tables added in Task 6 registration.
        base.OnModelCreating(b);
    }
}
