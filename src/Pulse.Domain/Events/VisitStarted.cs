// Events/VisitStarted.cs — geo resolved API-side; no IP on the wire (privacy constraint)
namespace Pulse.Domain.Events;
public sealed record VisitStarted(
    Guid VisitId, string ConnectionId,
    string Country, string City, double Lat, double Lon,
    DateTimeOffset OccurredAt);
