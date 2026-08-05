namespace Pulse.Api.Assistant;
public sealed class OpenAiOptions
{
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gpt-4o-mini";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
}
