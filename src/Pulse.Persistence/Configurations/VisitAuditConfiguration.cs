using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pulse.Domain.Audit;
namespace Pulse.Persistence.Configurations;
public sealed class VisitAuditConfiguration : IEntityTypeConfiguration<VisitAudit>
{
    public void Configure(EntityTypeBuilder<VisitAudit> builder)
    {
        builder.HasKey(x => x.Id);
    }
}
