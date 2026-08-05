using System.Runtime.CompilerServices;
namespace Pulse.Api.Assistant;
public sealed class NullAiClient : IAiClient
{
    public async IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, [EnumeratorCancellation] CancellationToken ct)
    {
        yield return "The AI assistant isn't configured in this environment. Set an OpenAI API key to enable it.";
        await Task.CompletedTask;
    }
}
