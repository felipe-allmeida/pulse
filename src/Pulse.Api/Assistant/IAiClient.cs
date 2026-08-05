namespace Pulse.Api.Assistant;
public interface IAiClient { IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct); }
