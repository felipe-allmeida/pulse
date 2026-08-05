namespace Pulse.Api.Assistant;
public sealed class AskOptions
{
    public int DailyCap { get; set; } = 500;
    public int MaxOutputTokens { get; set; } = 400;
    public int MaxQuestionChars { get; set; } = 500;
    public int MaxHistory { get; set; } = 4;
}
