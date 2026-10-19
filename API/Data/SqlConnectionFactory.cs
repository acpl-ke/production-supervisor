using Microsoft.Data.SqlClient;

namespace IGI.ProductionManager.Api.Data;

public sealed class SqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string? _connectionString;
    private readonly string? _igiConnectionString;

    public SqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("ProductionManager");
        _igiConnectionString = configuration.GetConnectionString("Igi");
    }

    public SqlConnection Create() => Open(_connectionString, "ProductionManager");

    public SqlConnection CreateIgi() => Open(_igiConnectionString, "Igi");

    private static SqlConnection Open(string? connectionString, string name)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException($"Connection string '{name}' is not configured.");
        }

        return new SqlConnection(connectionString);
    }
}
