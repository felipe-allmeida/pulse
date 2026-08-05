using System.Net;
using Microsoft.Extensions.Options;
using Pulse.Api.Assistant;
public class OpenAiClientTests
{
    [Fact]
    public async Task StreamAsync_YieldsDeltas_AndSendsAuthAndModel()
    {
        const string sse =
            "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\n" +
            "data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\n\n" +
            "data: [DONE]\n\n";
        HttpRequestMessage? captured = null;
        string? capturedBody = null;
        var http = new HttpClient(new StubHandler(sse, r => captured = r, b => capturedBody = b));
        var client = new OpenAiClient(http, Options.Create(new OpenAiOptions
            { ApiKey = "sk-test", Model = "gpt-4o-mini", BaseUrl = "https://api.openai.com/v1" }),
            Options.Create(new AskOptions { MaxOutputTokens = 400 }));

        var chunks = new List<string>();
        await foreach (var c in client.StreamAsync([new("user", "hi")], default)) chunks.Add(c);

        Assert.Equal(["Hello", " world"], chunks);
        Assert.Equal("Bearer sk-test", captured!.Headers.Authorization!.ToString());
        Assert.Contains("\"model\":\"gpt-4o-mini\"", capturedBody);
        Assert.Contains("\"stream\":true", capturedBody);
    }

    // NOTE: the request body is captured synchronously inside SendAsync (onBody), not read from
    // `captured.Content` afterwards. OpenAiClient's `using var req = ...` disposes the request
    // (and its Content) when the async-iterator's cleanup runs at end-of-stream, which happens
    // inside the final `await foreach` MoveNextAsync — strictly before control returns to this
    // test method. Reading `captured.Content` after the loop throws ObjectDisposedException
    // deterministically. Capturing the body while SendAsync still owns the live request avoids
    // that without touching OpenAiClient's (locked) implementation.
    private sealed class StubHandler(string body, Action<HttpRequestMessage> onSend, Action<string> onBody) : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct)
        {
            onSend(req);
            if (req.Content is not null) onBody(await req.Content.ReadAsStringAsync(ct));
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body) };
        }
    }
}
