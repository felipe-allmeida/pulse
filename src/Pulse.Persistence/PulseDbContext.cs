using MassTransit;
using Microsoft.EntityFrameworkCore;
using Pulse.Domain.Audit;
namespace Pulse.Persistence;
public class PulseDbContext(DbContextOptions<PulseDbContext> options) : DbContext(options)
{
    public DbSet<VisitAudit> VisitAudits => Set<VisitAudit>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(PulseDbContext).Assembly);
        b.AddInboxStateEntity();
        b.AddOutboxStateEntity();
        b.AddOutboxMessageEntity();
        base.OnModelCreating(b);
    }
}
