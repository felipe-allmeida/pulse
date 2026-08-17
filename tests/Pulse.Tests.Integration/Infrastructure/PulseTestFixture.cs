using System.Collections.Concurrent;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Pulse.Persistence;
using StackExchange.Redis;
using Testcontainers.PostgreSql;
using Testcontainers.RabbitMq;
using Testcontainers.Redis;

namespace Pulse.Tests.Integration.Infrastructure;

/// <summary>
/// Single collection for every test that needs a container. xUnit runs collections in parallel but
/// the tests inside one collection sequentially, so this both shares the containers and serialises
/// the suite — which is what makes a plain TRUNCATE/FLUSHALL between tests a sound reset.
/// </summary>
[CollectionDefinition("Integration")]
public class IntegrationCollection : ICollectionFixture<PulseTestFixture>;

/// <summary>
/// One Postgres, one Redis, one RabbitMQ for the whole assembly.
///
/// <para>Modelled on <c>ulbra-sau</c>'s <c>UlbraSauApiFactory</c>, with one deliberate difference:
/// there, every integration test goes through the API, so the fixture only ever needs to hand out
/// hosts. Pulse's do not — <c>PresenceTrackerTests</c>, <c>AskRateGuardTests</c>,
/// <c>PersistenceTests</c> and <c>VisitFlowTests</c> talk to Postgres or Redis directly with no
/// host at all. So this fixture
/// exposes the raw connection strings and a ready multiplexer alongside the API factory, and
/// <see cref="ResetAsync"/> is careful never to touch <see cref="WebApplicationFactory{TEntryPoint}.Services"/>:
/// a run filtered down to the host-less classes must not pay for an API boot it never uses.</para>
/// </summary>
public sealed class PulseTestFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    private readonly RedisContainer _redis = new RedisBuilder().WithImage("redis:7").Build();
    private readonly RabbitMqContainer _rabbitMq = new RabbitMqBuilder().WithImage("rabbitmq:3-management").Build();

    private readonly ConcurrentDictionary<string, WebApplicationFactory<Program>> _derivedHosts = new();
    private IConnectionMultiplexer? _mux;

    public string PostgresConnectionString => _pg.GetConnectionString();
    public string RedisConnectionString => _redis.GetConnectionString();
    public string RabbitMqConnectionString => _rabbitMq.GetConnectionString();

    /// <summary>Shared multiplexer for the tests that exercise Redis directly. Thread-safe, and the
    /// suite is sequential anyway; <see cref="ResetAsync"/> flushes it between tests.</summary>
    public IConnectionMultiplexer Redis => _mux ?? throw new InvalidOperationException(
        "Redis is only available after the fixture's InitializeAsync has run.");

    /// <summary>A context over the shared Postgres, for tests that seed or assert without a host.</summary>
    public PulseDbContext NewDbContext() => new(new DbContextOptionsBuilder<PulseDbContext>()
        .UseNpgsql(PostgresConnectionString).UseSnakeCaseNamingConvention().Options);

    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder.UseEnvironment("Testing")
            .UseSetting("ConnectionStrings:Postgres", PostgresConnectionString)
            .UseSetting("ConnectionStrings:Redis", RedisConnectionString)
            .UseSetting("ConnectionStrings:RabbitMq", RabbitMqConnectionString)
            .UseSetting("Cors:Origins", "http://localhost:5173");

    /// <summary>
    /// Derived host memoised by <paramref name="key"/>, after <c>UlbraSauApiFactory.GetOrCreateHost</c>.
    ///
    /// <para><b>Why:</b> every <c>WithWebHostBuilder(...)</c> builds a whole application — DI
    /// container, EF model, <c>Database.MigrateAsync()</c>, and in Pulse's case a <b>synchronous</b>
    /// <c>ConnectionMultiplexer.Connect</c> in <c>Program.cs</c> that blocks until Redis answers.
    /// Tests that only need the SAME settings should pay that once per configuration, not once per
    /// <c>[Fact]</c>.</para>
    ///
    /// <para><b>Why it is safe:</b> the suite runs sequentially (one "Integration" collection) and
    /// <see cref="ResetAsync"/> wipes Postgres and Redis before each test — a host carries no
    /// business state between tests, only configuration, which is exactly what the key names.</para>
    ///
    /// <para><b>⚠️ Key contract:</b> the key must determine, on its own, everything
    /// <paramref name="configure"/> applies. Two different configurations under one key silently
    /// return the wrong host — precisely the cross-test coupling that sharing containers must not
    /// introduce. When a configuration is not representable as a string (e.g. a stateful object the
    /// test itself created), do NOT use this cache: register that object in DI under a fixed key and
    /// resolve it from <c>host.Services</c>, or build the host directly with
    /// <c>WithWebHostBuilder</c>.</para>
    /// </summary>
    public WebApplicationFactory<Program> GetOrCreateHost(string key, Action<IWebHostBuilder> configure) =>
        _derivedHosts.GetOrAdd(key, _ => WithWebHostBuilder(configure));

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_pg.StartAsync(), _redis.StartAsync(), _rabbitMq.StartAsync());

        var options = ConfigurationOptions.Parse(RedisConnectionString);
        // FLUSHALL is an admin command; without this StackExchange.Redis refuses to send it.
        options.AllowAdmin = true;
        _mux = await ConnectionMultiplexer.ConnectAsync(options);

        // The fixture owns the schema for the whole assembly, so no test has to migrate. Doing it
        // here (rather than on first API boot) means ResetAsync can TRUNCATE even in a run filtered
        // down to classes that never build a host.
        await using var db = NewDbContext();
        await db.Database.MigrateAsync();
    }

    /// <summary>
    /// Restores the clean slate every test was written against, so assertions like
    /// <c>Assert.Equal(1, await ctx.VisitAudits.CountAsync())</c> keep meaning what they meant when
    /// each class owned its own container.
    /// </summary>
    public async Task ResetAsync()
    {
        await using (var db = NewDbContext())
        {
            // The MassTransit tables are not optional: a leftover outbox_message row would make the
            // next test's harness deliver a message it never published.
            //
            // Table order matters. The API hosts run MassTransit's BusOutboxDeliveryService, which
            // polls outbox_state and then outbox_message inside one transaction. TRUNCATE takes
            // ACCESS EXCLUSIVE, so listing the tables in that same relative order means the two can
            // only ever queue behind each other, never form a lock cycle (ulbra-sau's 40P01).
            await db.Database.ExecuteSqlRawAsync(
                "TRUNCATE TABLE visit_audits, inbox_state, outbox_state, outbox_message CASCADE");
        }

        // Redis is the likeliest way to get container sharing wrong here: PresenceTracker writes the
        // fixed key pulse:presence, and PulseRateLimiter/ReactionRateLimiter use fixed pulse:rl:*
        // prefixes. Nothing namespaces them per test, so without this flush those classes collide
        // intermittently and in an ordering-dependent way.
        foreach (var endpoint in Redis.GetEndPoints())
            await Redis.GetServer(endpoint).FlushAllDatabasesAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        // Hosts before containers. base.DisposeAsync() tears down this host and every derived one
        // from GetOrCreateHost, which stops their IHostedServices — including the outbox delivery
        // service that polls Postgres. Kill the containers first and those pollers keep querying a
        // dead socket, flooding the console with connection-refused noise after every test has
        // already passed.
        await base.DisposeAsync();

        if (_mux is not null) await _mux.DisposeAsync();

        await Task.WhenAll(
            _pg.DisposeAsync().AsTask(),
            _redis.DisposeAsync().AsTask(),
            _rabbitMq.DisposeAsync().AsTask());
    }
}
