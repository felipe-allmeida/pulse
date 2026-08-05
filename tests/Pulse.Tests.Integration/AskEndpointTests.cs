using System.Net;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pulse.Api.Assistant;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;
using Testcontainers.Redis;

public sealed class FakeAi(IEnumerable<string> chunks) : IAiClient
{
    public async IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, [EnumeratorCancellation] CancellationToken ct)
    {
        foreach (var chunk in chunks)
        {
            yield return chunk;
            await Task.Yield();
        }
    }
}

public class AskEndpointTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private readonly RabbitMqContainer _rabbitMq = new RabbitMqBuilder().WithImage("rabbitmq:3-management").Build();
    private PulseApiFactory _factory = default!;

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_pg.StartAsync(), _redis.StartAsync(), _rabbitMq.StartAsync());
        _factory = new PulseApiFactory(_pg.GetConnectionString(), _redis.GetConnectionString(), _rabbitMq.GetConnectionString());
    }

    public async Task DisposeAsync()
    {
        _factory.Dispose();
        await _pg.DisposeAsync();
        await _redis.DisposeAsync();
        await _rabbitMq.DisposeAsync();
    }

    private WebApplicationFactory<Program> WithFakeAi(IEnumerable<string> chunks) =>
        _factory.WithWebHostBuilder(b => b.ConfigureTestServices(s =>
        {
            s.RemoveAll<IAiClient>();
            s.AddSingleton<IAiClient>(new FakeAi(chunks));
        }));

    [Fact]
    public async Task Ask_StreamsAnswer_FromAiClient()
    {
        using var factory = WithFakeAi(["Hello", " world"]);
        var res = await factory.CreateClient().PostAsJsonAsync("/api/ask", new { question = "hi", history = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Equal("Hello world", await res.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Ask_RejectsOverLongQuestion()
    {
        using var factory = WithFakeAi(["irrelevant"]);
        var longQuestion = new string('a', 501);
        var res = await factory.CreateClient().PostAsJsonAsync("/api/ask", new { question = longQuestion, history = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Ask_RejectsEmptyQuestion()
    {
        using var factory = WithFakeAi(["irrelevant"]);
        var res = await factory.CreateClient().PostAsJsonAsync("/api/ask", new { question = "", history = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }
}
