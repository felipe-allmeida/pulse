using System.Reflection;
namespace Pulse.Api.Assistant;
public interface IProfileProvider { string Profile { get; } }
public sealed class EmbeddedProfileProvider : IProfileProvider
{
    public string Profile { get; } = Load();
    private static string Load()
    {
        var asm = typeof(EmbeddedProfileProvider).Assembly;
        var name = asm.GetManifestResourceNames().Single(n => n.EndsWith("profile.md"));
        using var s = asm.GetManifestResourceStream(name)!;
        using var r = new StreamReader(s);
        return r.ReadToEnd();
    }
}
