using Pulse.Api.Assistant;

/// <summary>
/// Deliberately not an <c>IntegrationTestBase</c>: this reads two embedded resources out of the
/// assembly and touches no container, no host and no shared key, so joining the "Integration"
/// collection would serialise it behind the container suite to buy nothing.
/// </summary>
public class EmbeddedProfileProviderTests
{
    private static readonly string Profile = new EmbeddedProfileProvider().Profile;

    [Fact]
    public void Profile_ContainsTheHandMaintainedProfileAndTheGeneratedCaseStudies()
    {
        // Both embedded resources have to land in the one string the system
        // prompt is built from — if only profile.md loads, the assistant
        // silently loses every project answer and nothing else fails.
        Assert.Contains("# Felipe de Almeida", Profile);
        Assert.Contains("## Project case studies", Profile);
    }

    [Fact]
    public void Profile_KeepsTheProfileFirstSoTheIdentityBlockIsNotBuriedBehindProjectDetail()
    {
        Assert.True(Profile.IndexOf("# Felipe de Almeida", StringComparison.Ordinal)
                    < Profile.IndexOf("## Project case studies", StringComparison.Ordinal));
    }

    [Fact]
    public void Profile_HasNoUnfilledPlaceholdersLeft()
    {
        // A [PREENCHER] reaching production is a prompt telling the model to
        // answer with a Portuguese editing instruction.
        Assert.DoesNotContain("PREENCHER", Profile);
    }
}
