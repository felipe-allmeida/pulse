using Pulse.Api.Assistant;
public class AskMessageBuilderTests
{
    private static AskMessageBuilder Builder(string profile = "PROFILE-TEXT") =>
        new(new StubProfile(profile), Microsoft.Extensions.Options.Options.Create(new AskOptions { MaxHistory = 2 }));

    [Fact]
    public void Build_PutsGroundedSystemPromptWithProfileFirst_AndQuestionLast()
    {
        var msgs = Builder("PROFILE-TEXT").Build("Does he know Kubernetes?", []);
        Assert.Equal("system", msgs[0].Role);
        Assert.Contains("PROFILE-TEXT", msgs[0].Content);
        Assert.Contains("don't have that information", msgs[0].Content); // grounding
        Assert.Equal("user", msgs[^1].Role);
        Assert.Equal("Does he know Kubernetes?", msgs[^1].Content);
    }

    [Fact]
    public void Build_CapsHistoryToMaxHistory()
    {
        var history = Enumerable.Range(0, 10).Select(i => new ChatMessage("user", $"q{i}")).ToList();
        var msgs = Builder().Build("now", history);
        // system + last 2 history + user question
        Assert.Equal(4, msgs.Count);
        Assert.Equal("q9", msgs[2].Content);
    }

    private sealed class StubProfile(string p) : IProfileProvider { public string Profile => p; }
}
