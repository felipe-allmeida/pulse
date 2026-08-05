using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
namespace Pulse.Api.Assistant;
public sealed class OpenAiClient(HttpClient http, IOptions<OpenAiOptions> ai, IOptions<AskOptions> ask) : IAiClient
{
    public async IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, [EnumeratorCancellation] CancellationToken ct)
    {
        var payload = new
        {
            model = ai.Value.Model,
            stream = true,
            max_tokens = ask.Value.MaxOutputTokens,
            messages = messages.Select(m => new { role = m.Role, content = m.Content }),
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{ai.Value.BaseUrl.TrimEnd('/')}/chat/completions")
        { Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json") };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ai.Value.ApiKey);

        using var resp = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        resp.EnsureSuccessStatusCode();
        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);
        string? line;
        while ((line = await reader.ReadLineAsync(ct)) is not null)
        {
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var data = line["data:".Length..].Trim();
            if (data is "[DONE]") yield break;
            var token = ParseDelta(data);
            if (!string.IsNullOrEmpty(token)) yield return token;
        }
    }

    private static string? ParseDelta(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("choices")[0].GetProperty("delta")
                .TryGetProperty("content", out var c) ? c.GetString() : null;
        }
        catch { return null; }
    }
}
