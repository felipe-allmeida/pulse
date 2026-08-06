using Pulse.Api.Assistant;
using Microsoft.Extensions.Options;
namespace Pulse.Api.Endpoints;
public sealed record AskRequest(string Question, ChatMessageDto[]? History, string? Locale);
public sealed record ChatMessageDto(string Role, string Content);

public static class AskEndpoints
{
    private static readonly string[] AllowedLocales = ["en", "pt-BR"];

    public static void MapAsk(this WebApplication app)
    {
        app.MapPost("/api/ask", async (AskRequest req, HttpContext ctx,
            AskMessageBuilder builder, IAiClient ai, IAskRateGuard guard, IOptions<AskOptions> opts) =>
        {
            var q = req.Question?.Trim() ?? "";
            if (q.Length == 0 || q.Length > opts.Value.MaxQuestionChars)
                return Results.BadRequest("Ask a question between 1 and " + opts.Value.MaxQuestionChars + " characters.");

            // Out-of-allow-list (or absent) locale is silently coerced to "en" — never 400 on this field,
            // and never interpolate the raw client value into the prompt built below.
            var locale = AllowedLocales.Contains(req.Locale) ? req.Locale! : "en";

            ctx.Response.ContentType = "text/plain; charset=utf-8";
            var clientIp = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (!await guard.TryConsumeAsync(clientIp))
            {
                var restingMessage = locale == "pt-BR"
                    ? "O assistente está descansando por hoje — tente novamente amanhã."
                    : "The assistant is resting for today — please try again tomorrow.";
                await ctx.Response.WriteAsync(restingMessage, ctx.RequestAborted);
                return Results.Empty;
            }
            var history = (req.History ?? []).Select(h => new ChatMessage(h.Role, h.Content)).ToList();
            var messages = builder.Build(q, history, locale);
            await foreach (var chunk in ai.StreamAsync(messages, ctx.RequestAborted))
            {
                await ctx.Response.WriteAsync(chunk, ctx.RequestAborted);
                await ctx.Response.Body.FlushAsync(ctx.RequestAborted);
            }
            return Results.Empty;
        }).RequireRateLimiting("ask");
    }
}
