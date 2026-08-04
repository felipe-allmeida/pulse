using Microsoft.AspNetCore.SignalR;
namespace Pulse.Api.Realtime;
public sealed class PresenceHub(IPresenceTracker tracker, IReactionRateLimiter rateLimiter) : Hub
{
    // small curated allow-list — rejects arbitrary strings (anti-abuse / anti-XSS)
    private static readonly HashSet<string> Allowed = new() { "👋", "❤️", "🔥", "👏", "🎉", "🚀", "😮", "💯" };

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
    public Task Heartbeat() => tracker.HeartbeatAsync(Context.ConnectionId);
    public async Task React(string emoji)
    {
        if (!Allowed.Contains(emoji)) return;                            // reject non-allow-listed
        if (!await rateLimiter.AllowAsync(Context.ConnectionId)) return; // rate-limited
        await Clients.All.SendAsync("ReactionReceived", new ReactionDto(emoji, DateTimeOffset.UtcNow));
    }
}
