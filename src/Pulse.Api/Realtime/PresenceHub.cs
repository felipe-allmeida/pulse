using Microsoft.AspNetCore.SignalR;
namespace Pulse.Api.Realtime;
public sealed class PresenceHub(IPresenceTracker tracker) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var count = await tracker.JoinAsync(Context.ConnectionId);
        await Clients.All.SendAsync("PresenceUpdated", count);
        await base.OnConnectedAsync();
    }
    public override async Task OnDisconnectedAsync(Exception? ex)
    {
        var count = await tracker.LeaveAsync(Context.ConnectionId);
        await Clients.All.SendAsync("PresenceUpdated", count);
        await base.OnDisconnectedAsync(ex);
    }
    public Task React(string emoji) =>
        Clients.All.SendAsync("ReactionReceived", new ReactionDto(emoji, DateTimeOffset.UtcNow));
}
