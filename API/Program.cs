var builder = WebApplication.CreateBuilder(args);

var configPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "config.json"));
if (!File.Exists(configPath))
{
    configPath = Path.Combine(builder.Environment.ContentRootPath, "config.json");
}

builder.Configuration.AddJsonFile(configPath, optional: false, reloadOnChange: true);

var apiUrl = builder.Configuration["apiUrl"];
var webUrl = builder.Configuration["webUrl"];
if (string.IsNullOrWhiteSpace(apiUrl) || string.IsNullOrWhiteSpace(webUrl))
{
    throw new InvalidOperationException("apiUrl and webUrl must be set in config.json.");
}

builder.WebHost.UseUrls(apiUrl);

var webOrigin = new Uri(webUrl).GetLeftPart(UriPartial.Authority);
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebClient", policy =>
    {
        policy.WithOrigins(webOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<IGI.ProductionManager.Api.Data.ISqlConnectionFactory, IGI.ProductionManager.Api.Data.SqlConnectionFactory>();
builder.Services.AddScoped<IGI.ProductionManager.Api.Data.IProductionRepository, IGI.ProductionManager.Api.Data.SqlProductionRepository>();

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { message = exception?.Message ?? "Request failed." });
    });
});

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("WebClient");
app.UseAuthorization();
app.MapControllers();

app.Run();
