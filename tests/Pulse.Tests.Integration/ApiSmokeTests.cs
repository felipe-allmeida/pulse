using System.Net;
using Pulse.Tests.Integration.Infrastructure;

[Collection("Integration")]
public class ApiSmokeTests(PulseTestFixture fixture) : IntegrationTestBase(fixture)
{
    [Fact]
    public async Task Health_ReturnsOk()
    {
        var client = Fixture.CreateClient();
        var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
