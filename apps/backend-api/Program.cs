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

// Main API endpoint - Get UTC time
app.MapGet("/api/time", () =>
{
    return Results.Ok(new
    {
        utc = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
        timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
        timezone = "UTC",
        service = "backend-api",
        version = "1.0.0"
    });
});

app.Run();
