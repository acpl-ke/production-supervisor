using Microsoft.Data.SqlClient;

namespace IGI.ProductionManager.Api.Data;

public sealed class SqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string? _connectionString;

    public SqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("ProductionManager");
    }

    public SqlConnection Create()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            throw new InvalidOperationException("Connection string 'ProductionManager' is not configured.");
        }

        return new SqlConnection(_connectionString);
    }
}
