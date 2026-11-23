using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<OnboardingDbContext>(options =>
    options.UseSqlite("Data Source=onboarding.db"));

// Send and accept statuses as text ("Kickoff") rather than numbers (1).
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

// Apply any database migrations that haven't run yet.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
    db.Database.Migrate();
}

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    application = "Customer Onboarding API"
}));

app.MapGet("/api/customers", async (OnboardingDbContext db) =>
{
    var customers = await db.Customers
        .OrderBy(customer => customer.Id)
        .ToListAsync();

    return Results.Ok(customers);
});

app.MapGet("/api/customers/{id:int}", async (
    int id,
    OnboardingDbContext db) =>
{
    var customer = await db.Customers.FindAsync(id);

    return customer is null
        ? Results.NotFound()
        : Results.Ok(customer);
});

app.MapPost("/api/customers", async (
    CreateCustomerRequest request,
    OnboardingDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Name) ||
        string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new
        {
            message = "Name and email are required."
        });
    }

    var customer = new Customer
    {
        Name = request.Name.Trim(),
        Email = request.Email.Trim(),
        Status = OnboardingStatus.New,
        CreatedAt = DateTime.UtcNow
    };

    db.Customers.Add(customer);
    await db.SaveChangesAsync();

    return Results.Json(customer, statusCode: 201);
});

app.MapPatch("/api/customers/{id:int}/status", async (
    int id,
    UpdateStatusRequest request,
    OnboardingDbContext db) =>
{
    if (!Enum.TryParse<OnboardingStatus>(request.Status, ignoreCase: true, out var status) ||
        !Enum.IsDefined(status))
    {
        return Results.BadRequest(new
        {
            message = $"Status must be one of: {string.Join(", ", Enum.GetNames<OnboardingStatus>())}."
        });
    }

    var customer = await db.Customers.FindAsync(id);
    if (customer is null)
    {
        return Results.NotFound();
    }

    customer.Status = status;
    await db.SaveChangesAsync();

    return Results.Ok(customer);
});

app.Run();

public class OnboardingDbContext(DbContextOptions<OnboardingDbContext> options)
    : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Store the status as readable text in the database.
        modelBuilder.Entity<Customer>()
            .Property(customer => customer.Status)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}

public enum OnboardingStatus
{
    New,
    Kickoff,
    Implementation,
    Live
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public OnboardingStatus Status { get; set; } = OnboardingStatus.New;
    public DateTime CreatedAt { get; set; }
}

public record CreateCustomerRequest(string? Name, string? Email);

public record UpdateStatusRequest(string? Status);