using MassTransit;
using Microsoft.EntityFrameworkCore;
using Pulse.Persistence;
using Pulse.Worker.Consumers;

var builder = Host.CreateApplicationBuilder(args);
var cfg = builder.Configuration;

builder.Services.AddDbContext<PulseDbContext>(o =>
    o.UseNpgsql(cfg.GetConnectionString("Postgres")).UseSnakeCaseNamingConvention());

builder.Services.AddMassTransit(x =>
{
    x.AddConsumers(typeof(VisitStartedConsumer).Assembly);
    x.UsingRabbitMq((c, cfg2) =>
    {
        cfg2.Host(cfg.GetConnectionString("RabbitMq"));
        cfg2.ConfigureEndpoints(c);
    });
});

var host = builder.Build();
host.Run();
