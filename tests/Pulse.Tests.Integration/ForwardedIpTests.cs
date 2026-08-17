using System.Net;
using Pulse.Tests.Integration.Infrastructure;

// Proves the real visitor IP survives the two-hop proxy chain (NPM -> Caddy -> API)
// in prod. The fixture forces the "Testing" environment so Program.cs maps a
// test-only /__ip endpoint that echoes HttpContext.Connection.RemoteIpAddress —
// the same value PresenceHub's geo lookup and the rate limiter rely on. That
// endpoint never exists outside the Testing environment, so production surface
// is unchanged.
[Collection("Integration")]
public class ForwardedIpTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    [Fact]
    public async Task TwoHopForwardedFor_ResolvesToOriginalVisitorIp()
    {
        var client = Fixture.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/__ip");
        // Left-most = original visitor (NPM's edge), then Caddy's container IP —
        // mirrors what NPM -> Caddy -> API actually produces in prod.
        request.Headers.Add("X-Forwarded-For", "203.0.113.7, 172.18.0.9");
        request.Headers.Add("X-Forwarded-Proto", "https");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var resolvedIp = await response.Content.ReadAsStringAsync();
        Assert.Equal("203.0.113.7", resolvedIp);
    }
}
