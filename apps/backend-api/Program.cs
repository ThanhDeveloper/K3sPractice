var builder = WebApplication.CreateBuilder(args);

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// Main API endpoint - Get server information with UTC time
app.MapGet("/api/server-information", () =>
{
    var config = app.Configuration;
    // GG_Client_Id from ConfigMap (inject as env -> appsettings override)
    var ggClientId = config["GoogleAuth:GG_Client_Id"] ?? "not-configured";
    // client_secret from Secret (inject as env -> top-level config key)
    var hasClientSecret = !string.IsNullOrEmpty(config["client_secret"]);

    return Results.Ok(new
    {
        utc = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
        timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
        timezone = "UTC",
        service = "backend-api",
        version = "1.0.0",
        gg_client_id = ggClientId,
        has_client_secret = hasClientSecret,
        hostname = Environment.MachineName
    });
});

app.Run();
