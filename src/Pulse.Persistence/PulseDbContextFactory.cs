using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace Pulse.Persistence;
public sealed class PulseDbContextFactory : IDesignTimeDbContextFactory<PulseDbContext>
{
    public PulseDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PulseDbContext>()
            .UseNpgsql("Host=localhost;Database=pulse_design;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;
        return new PulseDbContext(options);
    }
}
