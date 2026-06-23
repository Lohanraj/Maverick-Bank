using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Threading.Tasks;

namespace MaverickBank.API.Middlewares
{
    public class LoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<LoggingMiddleware> _logger;

        public LoggingMiddleware(RequestDelegate next, ILogger<LoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var sw = Stopwatch.StartNew();
            _logger.LogInformation("Handling request: {Method} {Url}", context.Request.Method, context.Request.Path);

            await _next(context);

            sw.Stop();
            _logger.LogInformation("Finished handling request. Response Status: {StatusCode} in {ElapsedMilliseconds}ms", 
                context.Response.StatusCode, sw.ElapsedMilliseconds);
        }
    }
}
