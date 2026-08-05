using Pulse.Api.Geo;

namespace Pulse.Tests.Integration;

public class DemoGeoLocatorTests
{
    [Fact]
    public void Locate_ReturnsRealCity_NeverUnknown()
    {
        var geo = new DemoGeoLocator();

        var r = geo.Locate("127.0.0.1");

        Assert.NotEqual("Unknown", r.Country);
        Assert.NotEqual("Unknown", r.City);
        Assert.False(r.Lat == 0 && r.Lon == 0, "demo geo must have real coordinates");
    }

    [Fact]
    public void Locate_SpreadsAcrossManyCities_EvenForTheSameIp()
    {
        // Local visits all share one source IP (loopback/docker gateway), so the demo
        // locator must spread by call (round-robin), not by hashing the IP.
        var geo = new DemoGeoLocator();

        var countries = Enumerable.Range(0, 24)
            .Select(_ => geo.Locate("127.0.0.1").Country)
            .Distinct()
            .ToList();

        Assert.True(countries.Count >= 6, $"expected a spread of cities, got {countries.Count}");
    }
}
