using System.Reflection;
namespace Pulse.Api.Assistant;
public interface IProfileProvider { string Profile { get; } }

/// <summary>
/// The assistant's entire knowledge, assembled from two embedded resources:
/// the hand-maintained <c>profile.md</c>, and <c>projects.generated.md</c>,
/// which is rendered from the site's own project content by
/// <c>pnpm gen:assistant</c> so the assistant cannot contradict the case
/// studies a visitor is reading on the same page.
/// </summary>
public sealed class EmbeddedProfileProvider : IProfileProvider
{
    private const string ProfileResource = "Assistant.profile.md";
    private const string ProjectsResource = "Assistant.projects.generated.md";

    public string Profile { get; } = Load();

    private static string Load()
    {
        var asm = typeof(EmbeddedProfileProvider).Assembly;
        var profile = Read(asm, ProfileResource)
            ?? throw new InvalidOperationException($"Embedded resource '{ProfileResource}' is missing.");
        var projects = Read(asm, ProjectsResource);

        // The generated half is optional at runtime: a missing file should cost
        // the assistant its project detail, not take the whole endpoint down.
        return projects is null ? profile : $"{profile.TrimEnd()}\n\n{projects.TrimStart()}";
    }

    private static string? Read(Assembly asm, string suffix)
    {
        var name = asm.GetManifestResourceNames().SingleOrDefault(n => n.EndsWith(suffix, StringComparison.Ordinal));
        if (name is null) return null;
        using var stream = asm.GetManifestResourceStream(name)!;
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
