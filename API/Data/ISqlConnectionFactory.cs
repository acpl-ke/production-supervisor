using Microsoft.Data.SqlClient;

namespace IGI.ProductionManager.Api.Data;

public interface ISqlConnectionFactory
{
    SqlConnection Create();
    SqlConnection CreateIgi();
}
