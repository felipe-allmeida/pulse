namespace Pulse.Tests.Integration.Infrastructure;

/// <summary>
/// Base for every test class that needs a container. Mirrors ulbra-sau's <c>IntegrationTestBase</c>:
/// join the single "Integration" collection, take the shared fixture, and reset before each test.
///
/// <para>It deliberately does not hand out an <c>HttpClient</c> the way ulbra-sau's does — most of
/// Pulse's integration tests never touch the API, and constructing a client here would boot a host
/// (and pay Program.cs's synchronous Redis connect) for classes that only need Postgres or Redis.
/// API tests call <c>Fixture.CreateClient()</c> themselves.</para>
///
/// <para>Classes that need their own setup override <see cref="InitializeAsync"/> and call
/// <c>base.InitializeAsync()</c> <b>first</b>, so the reset happens before they seed.</para>
/// </summary>
[Collection("Integration")]
public abstract class IntegrationTestBase(PulseTestFixture fixture) : IAsyncLifetime
{
    protected PulseTestFixture Fixture { get; } = fixture;

    public virtual Task InitializeAsync() => Fixture.ResetAsync();

    public virtual Task DisposeAsync() => Task.CompletedTask;
}
