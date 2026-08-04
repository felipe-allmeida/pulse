using MassTransit;
using Pulse.Domain.Audit;
using Pulse.Domain.Events;
using Pulse.Domain.Geo;
using Pulse.Persistence;
namespace Pulse.Worker.Consumers;

public sealed class VisitStartedConsumer(PulseDbContext db) : IConsumer<VisitStarted>
{
    public async Task Consume(ConsumeContext<VisitStarted> ctx)
    {
        var m = ctx.Message;
        var geo = new GeoResult(m.Country, m.City, m.Lat, m.Lon);
        db.VisitAudits.Add(VisitAudit.FromGeo(m.VisitId, geo, m.OccurredAt));
        await db.SaveChangesAsync();
    }
}
